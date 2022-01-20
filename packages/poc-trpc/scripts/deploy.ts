import path from "path";
import fs from "fs";
import task from "tasuku";
import yargs from "yargs";
import globby from "globby";
import fetch from "cross-fetch";

interface DeployArguments {
    username: string;
    apiKey: string;
    message: string;
}

async function run() {
    await task("Deploying build...", async ({ setOutput, setError }) => {
        const file = path.resolve(__dirname, "../dist/build.tar");
        if (!fs.existsSync(file)) {
            setError(`${file} does not exist! Please make sure you run "npm run build" first!`);
            return;
        }

        await new Promise<void>((resolve, reject) => {
            yargs
                .usage("Usage: $0 [options]")
                .option("username", { type: "string", description: "Username", demandOption: true })
                .option("apiKey", { type: "string", description: "API Key", demandOption: true })
                .option("message", { type: "string", description: "Message", demandOption: true })
                .help()
                .parse(process.argv, async (yargsErr: Error | undefined, argv: yargs.ArgumentsCamelCase<DeployArguments>, output: string) => {
                    if (yargsErr) {
                        setError(yargsErr);
                        reject(yargsErr);
                        return;
                    }

                    if (output) {
                        setOutput(output);
                        reject(output);
                        return;
                    }

                    const pkg = require("../package.json") as { name: string; commerceCloudRuntime: { ssrFunctionNodeVersion: string } };
                    const url = `https://cloud.mobify.com/api/projects/${encodeURIComponent(pkg.name)}/builds/`;

                    const { username, apiKey } = argv;

                    const data = await fs.promises.readFile(file);
                    const b64Data = data.toString("base64");

                    const cwd = path.resolve(__dirname, "../dist/build");
                    const ssrOnlyFileList = await globby("**/*", { cwd });

                    const body = JSON.stringify({
                        message: argv.message,
                        encoding: "base64",
                        data: b64Data,
                        ssr_parameters: { ssrFunctionNodeVersion: pkg.commerceCloudRuntime.ssrFunctionNodeVersion },
                        ssr_only: ssrOnlyFileList,
                        ssr_shared: [],
                    });

                    try {
                        const res = await fetch(url, {
                            method: "POST",
                            headers: {
                                authorization: `Basic ${Buffer.from(`${username}:${apiKey}`).toString("base64")}`,
                                "content-type": "application/json",
                                "content-length": body.length.toString(),
                                "user-agent": "progressive-web-sdk#0.3.46",
                            },
                            body,
                        });

                        const { message } = await res.json();

                        if (res.ok) {
                            setOutput(message);
                            resolve(message);
                        } else {
                            setError(message);
                            reject(message);
                        }
                    } catch (fetchErr) {
                        setError(fetchErr as Error);
                        reject(fetchErr);
                    }
                });
        });
    });
}

run();
