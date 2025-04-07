import {defineConfig} from "vite";

export default defineConfig({
    root: "./",
    base: "./",
    build: {
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        },
        assetsInlineLimit: 0
    }
});