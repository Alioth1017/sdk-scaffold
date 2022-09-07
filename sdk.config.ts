import path from "path";
import { LibraryOptions } from "vite";

interface ISdkConfig {
    lib?: LibraryOptions | false;
}
export const SdkConfig: ISdkConfig = {
    lib: {
        entry: path.resolve(__dirname, "src/main.tsx"),
        name: "Sdk",
        fileName: (format) => `sdk.${format}.js`,
    },
};
