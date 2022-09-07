/// <reference types="vitest" />

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import eslintPlugin from "vite-plugin-eslint";
import progress from "vite-plugin-progress";
import { SdkConfig } from "./sdk.config";

console.log("Starting", SdkConfig);
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        eslintPlugin({
            include: [
                "src/**/*.js",
                "src/**/*.vue",
                "src/**/*.ts",
                "src/**/*.tsx",
                "src/*.js",
                "src/*.vue",
                "src/*.ts",
                "src/*.tsx",
            ],
        }),
        progress(),
    ],
    define: {
        "process.env": { NODE_ENV: process.env.NODE_ENV },
    },
    css: {
        // css预处理器
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
    build: {
        lib: SdkConfig.lib,
        // rollupOptions: {
        //     // 确保外部化处理那些你不想打包进库的依赖
        //     external: ["vue"],
        //     output: {
        //         // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        //         globals: {
        //             vue: "Vue",
        //         },
        //     },
        // },
    },
    // docs: https://cn.vitest.dev/guide/#%E9%85%8D%E7%BD%AE-vitest
    test: {
        environment: "happy-dom"
    },
});
