// publish example：    yarn package:publish -p './packages/xxx' --prepatch
// unpublish example：  yarn package:publish -p './packages/xxx' --unpublish 0.0.1

const fs = require("fs-extra");
const path = require("path");
const spawn = require("cross-spawn");
const { program } = require("commander");

// import chalk from "chalk";
function redConsoleError(msg) {
    // console.error(chalk.red(msg));
    console.error(msg);
}
process.on("unhandledRejection", (reason, promise) => {
    redConsoleError("\nAn unhandled rejection has occurred inside SDK:");
    redConsoleError(reason.toString());
    redConsoleError("\nSDK was terminated. Location:");
    redConsoleError(JSON.stringify(promise));
    process.exit(1);
});
process.on("uncaughtException", (err) => {
    if (err && err.message && err.stack) {
        redConsoleError("\nAn unhandled exception has occurred inside SDK:");
        redConsoleError(err.message);
        redConsoleError(err.stack);
    } else {
        redConsoleError("\nSDK was terminated:");
        redConsoleError(typeof err === "string" ? err : JSON.stringify(err));
    }
    process.exit(1);
});
function execCommand(command, args, options) {
    const res = spawn.sync(command, args, {
        stdio: "pipe",
        ...options,
    });
    if (res.stderr) {
        const errMsg = Buffer.from(res.stderr).toString();
        if (["ERR!"].some((errKeyword) => errMsg.indexOf(errKeyword) > -1)) {
            throw new Error(errMsg);
        }
        console.log("stderr:", errMsg);
        return;
    }
    console.log("stdout:", Buffer.from(res.stdout).toString());
}

// import fs from 'fs-extra';
// import path from 'path';
function workingDir(dir, cwd, checkExisting = true) {
    let finalDir = dir;
    if (cwd) {
        if (path.isAbsolute(cwd) && (!checkExisting || fs.existsSync(cwd))) {
            finalDir = cwd;
        } else {
            const resolved = path.resolve(finalDir, cwd);
            if (!checkExisting || fs.existsSync(resolved)) {
                finalDir = resolved;
            }
        }
    }

    return finalDir;
}

(async () => {
    const versionCommands = [
        "prerelease",
        "prepatch",
        "preminor",
        "premajor",
        "patch",
        "minor",
        "major",
    ];

    let dir = process.cwd();
    let packageJsonPath = path.resolve(__dirname, "./package.json");
    let isUnPublish = false;
    let unPublishVersion = "";
    let versionCommand = "";
    program
        .version((await fs.readJson(packageJsonPath)).version)
        .arguments("[cwd]")
        .option("-p, --packagePath [path]", "specify the package directory")
        .option(
            "--namePrefix [namePrefix]",
            "prefix of package name (eg: @xxx/)",
        )
        .option("--build [<@scope>/]<pkg>@<scripts>")
        .option("--prerelease", "1.0.0 >> 1.0.1-0, 1.0.1-0 >> 1.0.1-1")
        .option("--prepatch", "1.0.0 >> 1.0.1-0, 1.0.1-0 >> 1.0.2-0")
        .option("--preminor", "1.0.0 >> 1.1.0-0, 1.1.0-0 >> 1.2.0-0")
        .option("--premajor", "1.0.0 >> 2.0.0-0, 2.0.0-0 >> 3.0.0-0")
        .option("--patch", "1.0.1-n >> 1.0.1")
        .option("--minor", "1.1.0-n >> 1.1.0")
        .option("--major", "2.0.0-n >> 2.0.0")
        .option("--unpublish [<@scope>/]<pkg>@<version>")
        .action(async (cwd, options) => {
            dir = workingDir(dir, cwd);
            if (options.packagePath) {
                packageJsonPath = path.join(
                    __dirname,
                    options.packagePath,
                    "package.json",
                );
            }
            versionCommand = versionCommands.find((cmd) => options[cmd]);
            if (options.unpublish) {
                isUnPublish = true;
                unPublishVersion =
                    // eslint-disable-next-line valid-typeof
                    typeof options.unpublish === true ? "" : options.unpublish;
            }
        })
        .parse(process.argv);

    const options = {
        dir,
        packageJsonPath,
        versionCommand,
        isUnPublish,
        unPublishVersion,
        ...program.opts(),
        npmCliConfigs: [
            // "--registry={Your npm registry}",
            // "--_authToken={Your npm account token}",
            // "--access public", // when pkg name start with @, set a package to be either publicly accessible or restricted.
        ],
    };

    console.log("options", options);
    new Action(options).start();
})();

class Action {
    constructor(options) {
        this.packagePath = options.packagePath;
        this.packageJsonPath = options.packageJsonPath;
        this.namePrefix = options.namePrefix;
        this.npmCliConfigs = options.npmCliConfigs;
        this.isUnPublish = options.isUnPublish;
        this.unPublishVersion = options.unPublishVersion;
        this.buildCmd = options.build;
        this.versionCommand = options.versionCommand;
    }
    async start() {
        console.log(`publishPackage isPublish=${!this.isUnPublish}`);
        this.updatePackageVersion();
        this.execCommand(this.buildCmd);
        const configData = await fs.readJson(this.packageJsonPath);
        let { version, name } = configData;
        console.log("publishPackage data=", name, version);
        let isSameName = true;
        // edit pkg name with prefixName
        if (name && this.namePrefix && !name.startsWith(this.namePrefix)) {
            name = `${this.namePrefix}${name}`;
            isSameName = false;
        }

        // unpublish handler
        if (this.isUnPublish) {
            this.publishOrUnPublish(name, this.unPublishVersion);
            return;
        }

        // publish handler
        configData.name = name;
        if (isSameName) {
            this.publishOrUnPublish(name, version);
            return;
        }
        // if is not same name, update the package.json and do publish
        await fs.writeJSON(this.packageJsonPath, configData, {
            spaces: 2,
        });
        this.publishOrUnPublish(name, version);
    }

    updatePackageVersion() {
        if (this.isUnPublish || !this.versionCommand) {
            return;
        }
        console.log(
            `updatePackageVersion versionCommand=${this.versionCommand}`,
        );
        this.updateVersion(this.versionCommand);
    }

    publishOrUnPublish(name, version) {
        if (this.isUnPublish) {
            this.unpublish(name, version);
        } else {
            this.publish(name, version);
        }
    }

    publish(name, version) {
        execCommand("npm", [
            "publish",
            this.packagePath,
            ...this.npmCliConfigs,
        ]);
        console.log(`publish ${name}@${version} done!`);
    }

    unpublish(name, version) {
        execCommand("npm", [
            "unpublish",
            `${name}@${version}`,
            "--force",
            ...this.npmCliConfigs,
        ]);
        console.log(`unpublish ${name}@${version} done!`);
    }

    updateVersion(type) {
        execCommand("npm", ["version", type]);
    }

    execCommand(command) {
        if (!command) {
            return;
        }
        execCommand("npm", ["run", command]);
    }
}
