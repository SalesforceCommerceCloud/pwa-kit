import path from "path";
import fs from "fs/promises";
import task from "tasuku";
import rimraf from "rimraf";
import * as esbuild from "esbuild";
import * as tar from "tar";
import globby from "globby";

async function run() {
    await task("Deleting dist folder...", async () => {
        rimraf.sync("dist");
    });

    await task("Compiling and bundling TypeScript code...", async ({ setOutput }) => {
        const result = await esbuild.build({
            entryPoints: ["src/ssr.ts"],
            outfile: "dist/build/ssr.js",
            sourcemap: true,
            bundle: true,
            format: "cjs",
            platform: "node",
            target: ["node14"],
            metafile: true,
            define: { "process.env.NODE_ENV": `"production"` },
        });

        const output = await esbuild.analyzeMetafile(result.metafile);
        setOutput(output?.trim());
    });

    await task("Creating loader.js...", async () => {
        const file = path.resolve(__dirname, "../dist/build/loader.js");
        await fs.writeFile(file, "/* ¯\\_(ツ)_/¯ */\n");
    });

    await task("Creating dist/build.tar...", async ({ setOutput }) => {
        const pkg = require("../package.json") as { name: string };
        const file = path.resolve(__dirname, "../dist/build.tar");
        const prefix = `${pkg.name}/bld`;
        const cwd = path.resolve(__dirname, "../dist/build");

        const fileList = await globby("**/*", { cwd });
        await tar.create({ file, prefix, cwd }, fileList);
        setOutput(fileList.join("\n  "));
    });
}

run();
