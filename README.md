# sdk-scaffold

A sdk scaffold with vite & typescript.

## Start

```bash
git clone --depth=1 https://github.com/Alioth1017/sdk-scaffold my-sdk
cd my-sdk
pnpm i
```

### config change

```js
//  sdk.config.ts
···
    lib: {
        entry: path.resolve(__dirname, "src/main.tsx"),
        /**
         * The name of the exposed global variable. Required when the `formats` option includes
         * `umd` or `iife`
         */
        name: "[SDK]",
        fileName: (format) => `[your sdk file name].${format}.js`,
    },
···
```

```js
//  package.json
{
    "name": "[your sdk project name]",
    ···
    "main": "./dist/[your sdk file name].umd.js",
    "module": "./dist/[your sdk file name].es.js",
}
```

### dev

```bash
pnpm dev
```

### build

```bash
pnpm build
```
