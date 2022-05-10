#!/usr/bin/env node
/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const p = require('path')
const zlib = require('zlib')
const fs = require('fs')
const request = require('request')
const program = require('commander')
const isEmail = require('validator/lib/isEmail')
const {execSync: _execSync} = require('child_process')
const scriptUtils = require('../scripts/utils')
const sh = require('shelljs')
const uploadBundle = require('../scripts/upload.js')
const pkg = require('../package.json')
const {getConfig} = require('pwa-kit-runtime/utils/ssr-config')
const {fromCognitoIdentity} = require("@aws-sdk/credential-providers")
const {KinesisClient, GetShardIteratorCommand, ListShardsCommand, GetRecordsCommand, ListStreamsCommand} = require("@aws-sdk/client-kinesis")
const {S3Client, ListObjectsV2Command, GetObjectCommand} = require("@aws-sdk/client-s3")
const { NodeHttpHandler } = require("@aws-sdk/node-http-handler");

const pkgRoot = p.join(__dirname, '..')

const projectPkg = require(p.join(process.cwd(), 'package.json'))

const execSync = (cmd, opts) => {
    const defaults = {stdio: 'inherit'}
    return _execSync(cmd, {...defaults, ...opts})
}

const main = () => {
    process.env.CONTEXT = process.cwd()
    program.description(
        [
            `PWA Kit Dev`,
            ``,
            `For more information run a command with the --help flag, eg.`,
            ``,
            `  $ pwa-kit-dev push --help`
        ].join('\n')
    )

    program.addHelpText(
        'after',
        [
            ``,
            `Usage inside NPM scripts:`,
            ``,
            `  The PWA Kit Developer Tools is used in NPM scripts so you can conveniently`,
            `  run eg. 'npm run push' to push a bundle from a project.`,
            ``,
            `  To pass args to pwa-kit-dev when wrapped in an NPM script, separate them`,
            `  with '--' so they aren't parsed by NPM itself, eg:`,
            ``,
            `    $ pwa-kit-dev push --target production`,
            ``,
            `  Would become this, when used in an NPM script:`,
            ``,
            `    $ npm run push -- --target production`,
            ``,
            `  See https://docs.npmjs.com/cli/v8/commands/npm-run-script`,
            ``
        ].join('\n')
    )

    program
        .command('save-credentials')
        .description(`save API credentials for Managed Runtime`)
        .requiredOption(
            '-u, --user <email>',
            'the e-mail address you used to register with Managed Runtime',
            (val) => {
                if (!isEmail(val)) {
                    throw new program.InvalidArgumentError(`"${val}" is not a valid email`)
                } else {
                    return val
                }
            }
        )
        .requiredOption(
            '-k, --key <api-key>',
            `find your API key at https://runtime.commercecloud.com/account/settings`,
            (val) => {
                if (!(typeof val === 'string') && val.length > 0) {
                    throw new program.InvalidArgumentError(`"${val}" cannot be empty`)
                } else {
                    return val
                }
            }
        )
        .action(({user, key}) => {
            try {
                const settingsPath = scriptUtils.getSettingsPath()
                fs.writeFileSync(
                    settingsPath,
                    JSON.stringify({username: user, api_key: key}, null, 4)
                )
                console.log(`Saved Managed Runtime credentials to "${settingsPath}".`)
            } catch (e) {
                console.error('Failed to save credentials.')
                console.error(e)
                process.exit(1)
            }
        })

    program
        .command('start')
        .description(`develop your app locally`)
        .addOption(
            new program.Option('--inspect', 'enable debugging with --inspect on the node process')
        )
        .action(({inspect}) => {
            execSync(`node${inspect ? ' --inspect' : ''} ${p.join(process.cwd(), 'app', 'ssr.js')}`)
        })

    program
        .command('build')
        .description(`build your app for production`)
        .action(() => {
            const webpack = p.join(require.resolve('webpack'), '..', '..', '..', '.bin', 'webpack')
            const projectWebpack = p.join(process.cwd(), 'webpack.config.js')
            const webpackConf = fs.existsSync(projectWebpack)
                ? projectWebpack
                : p.join(__dirname, '..', 'configs', 'webpack', 'config.js')
            sh.rm('-rf', './build')
            execSync(`${webpack} --config ${webpackConf}`, {
                env: {
                    NODE_ENV: 'production',
                    ...process.env
                }
            })

            // Copy the project `package.json` into the build folder.
            sh.cp(p.resolve('package.json'), './build/package.json')

            // Copy config files.
            const config = p.resolve('config')
            if (fs.existsSync(config)) {
                sh.cp('-R', config, './build')
                sh.rm('./build/config/local.*')
            }

            // This file is required by MRT, for historical reasons.
            sh.touch('./build/loader.js')
        })

    program
        .command('push')
        .description(`push a bundle to Managed Runtime`)
        .addOption(
            new program.Option(
                '-b, --buildDirectory <buildDirectory>',
                'a custom project directory where your build is located'
            ).default(p.join(process.cwd(), 'build'), './build')
        )
        .addOption(
            new program.Option(
                '-m, --message <message>',
                "a message to include along with the uploaded bundle in Managed Runtime (default: '<git branch>:<git commit hash>')"
            )
        )
        .addOption(
            new program.Option(
                '-s, --projectSlug <projectSlug>',
                "a project slug that differs from the name property in your project's package.json (default: the 'name' key from the package.json)"
            ).default(projectPkg.name)
        )
        .addOption(
            new program.Option(
                '-t, --target <target>',
                'immediately deploy the bundle to this target once it is pushed'
            )
        )
        .action(({buildDirectory, message, projectSlug, target}) => {
            // Set the deployment target env var, this is required to ensure we
            // get the correct configuration object.
            process.env.DEPLOY_TARGET = target

            const mobify = getConfig() || {}

            const options = {
                buildDirectory,
                ...(message ? {message} : undefined),
                projectSlug,
                target,
                // Note: Cloud expects snake_case, but package.json uses camelCase.
                ssr_parameters: mobify.ssrParameters,
                ssr_only: mobify.ssrOnly,
                ssr_shared: mobify.ssrShared,
                set_ssr_values: true
            }

            if (
                !Array.isArray(options.ssr_only) ||
                options.ssr_only.length === 0 ||
                !Array.isArray(options.ssr_shared) ||
                options.ssr_shared.length === 0
            ) {
                scriptUtils.fail('ssrEnabled is set, but no ssrOnly or ssrShared files are defined')
            }
            uploadBundle(options).catch((err) => {
                console.error(err.message || err)
            })
        })

    program
        .command('lint')
        .description('lint all source files')
        .argument('<path>', 'path or glob to lint')
        .option('--fix', 'Try and fix errors (default: false)')
        .action((path, {fix}) => {
            const eslint = p.join(require.resolve('eslint'), '..', '..', '..', '.bin', 'eslint')
            const eslintConfig = p.join(__dirname, '..', 'configs', 'eslint', 'eslint-config.js')
            execSync(
                `${eslint} --config ${eslintConfig} --resolve-plugins-relative-to ${pkgRoot}${
                    fix ? ' --fix' : ''
                } "${path}"`
            )
        })

    program
        .command('format')
        .description('automatically re-format all source files')
        .argument('<path>', 'path or glob to format')
        .action((path) => {
            const prettier = p.join(require.resolve('prettier'), '..', '..', '.bin', 'prettier')
            execSync(`${prettier} --write "${path}"`)
        })

    program
        .command('test')
        .description('test the project')
        .action((_, {args}) => {
            const jest = p.join(require.resolve('jest'), '..', '..', '..', '.bin', 'jest')
            execSync(
                `${jest} --passWithNoTests --maxWorkers=2${args.length ? ' ' + args.join(' ') : ''}`
            )
        })

    program.option('-v, --version', 'show version number').action(({version}) => {
        if (version) {
            console.log(pkg.version)
        } else {
            program.help({error: true})
        }
    })

    program
        .command('logs')
        .description(`display logs for an environment`)
        .requiredOption(
            '-p, --project <project_slug>',
            'the project slug',
            (val) => {
                if (!(typeof val === 'string') && val.length > 0) {
                    throw new program.InvalidArgumentError(`"${val}" cannot be empty`)
                } else {
                    return val
                }
            }
        )
        .requiredOption(
            '-e, --environment <environment_slug>',
            'the environment slug',
            (val) => {
                if (!(typeof val === 'string') && val.length > 0) {
                    throw new program.InvalidArgumentError(`"${val}" cannot be empty`)
                } else {
                    return val
                }
            }
        )
        .action(({project, environment}) => {
            try {
                const settingsPath = scriptUtils.getSettingsPath()
                const auth = JSON.parse(fs.readFileSync(
                    settingsPath
                ))
                const options = {
                    url: `https://cloud-kieran.mobify-staging.com/api/projects/${project}/target/${environment}/log/`,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${auth.api_key}`
                    }
                };

                request(options, async function(err, res, body) {
                    let json = JSON.parse(body);
                    logGroupName = json.log_group;
                    region = json.regionl;
                    identityId = json.identity_id;
                    
                    const kinesisClient = new KinesisClient({
                        region,
                        requestHandler: new NodeHttpHandler({}),
                        credentials: fromCognitoIdentity({
                            identityId,
                            logins: {
                                "cognito-identity.amazonaws.com": json.token
                            }
                        }),
                        // logger: console
                    });

                    const getShardIterator = async (stream_name, shard_id) => {
                        const shard_iterator_data = await kinesisClient.send(new GetShardIteratorCommand({
                            ShardIteratorType: 'TRIM_HORIZON',
                            ShardId: shard_id,
                            StreamName: stream_name
                        }))
                        return shard_iterator_data.ShardIterator
                    }

                    try {
                        const streams = await kinesisClient.send(new ListStreamsCommand({}));
                        const stream_name = streams.StreamNames.find((stream) => stream.includes(`${project}-${environment}`));
                        const shards = await kinesisClient.send(new ListShardsCommand({StreamName: stream_name}));
                        let current_shard_index = 0
                        let shard_id = shards.Shards[current_shard_index].ShardId
                        
                        let shard_iterator = await getShardIterator(stream_name, shard_id)
                        async function loop_through_stream_records() {
                            const command = new GetRecordsCommand({
                                ShardIterator: shard_iterator
                            })
                            kinesisClient.send(command).then(
                                async (data) => {
                                    shard_iterator = data.NextShardIterator
                                    // if (!shard_iterator) {
                                    //     console.log("No Records")
                                    //     current_shard_index += 1
                                    //     if (current_shard_index === shards.Shards.length)
                                    //         return
                                    //     let next_shard = shards.Shards[current_shard_index]
                                    //     console.log(`NEXT ${next_shard.ShardId}`)
                                    //     shard_iterator = await getShardIterator(stream_name, next_shard.ShardId)
                                    // }
                                    data.Records.forEach((record) => {
                                        let data = JSON.parse(zlib.unzipSync(Buffer.from(record.Data, 'base64')).toString())
                                        data.logEvents.forEach((event) => {
                                            let eventDate = new Date(event.timestamp)
                                            console.log(`${eventDate.toISOString()}: ${event.message}`)
                                        })
                                    })
                                    setTimeout(loop_through_stream_records, 2000)
                                },
                                (error) => {
                                    console.error(error)
                                }
                            )
                        }
                        loop_through_stream_records()
                    } catch (error) {
                        console.error(error)
                    }
                });
            } catch (e) {
                console.error('Failed to read credentials.')
                console.error(e)
                process.exit(1)
            }
        })

    program
        .command('s3logs')
        .description(`display logs for an environment`)
        .requiredOption(
            '-p, --project <project_slug>',
            'the project slug',
            (val) => {
                if (!(typeof val === 'string') && val.length > 0) {
                    throw new program.InvalidArgumentError(`"${val}" cannot be empty`)
                } else {
                    return val
                }
            }
        )
        .requiredOption(
            '-e, --environment <environment_slug>',
            'the environment slug',
            (val) => {
                if (!(typeof val === 'string') && val.length > 0) {
                    throw new program.InvalidArgumentError(`"${val}" cannot be empty`)
                } else {
                    return val
                }
            }
        )
        .action(({project, environment}) => {
            try {
                const settingsPath = scriptUtils.getSettingsPath()
                const auth = JSON.parse(fs.readFileSync(
                    settingsPath
                ))
                const options = {
                    url: `https://cloud-kieran.mobify-staging.com/api/projects/${project}/target/${environment}/log/`,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${auth.api_key}`
                    }
                };

                request(options, async function(err, res, body) {
                    let json = JSON.parse(body);
                    logGroupName = json.log_group;
                    region = json.regionl;
                    identityId = json.identity_id;
                    
                    const s3Client = new S3Client({
                        region,
                        credentials: fromCognitoIdentity({
                            identityId,
                            logins: {
                                "cognito-identity.amazonaws.com": json.token
                            }
                        }),
                    });
                    const bucket_name = `log-stream-${project}-${environment}`
                    
                    const getPrefix = () => {
                        let current_date = new Date().toISOString().split("T")
                        const date_prefix = current_date[0].split("-").join("/")
                        const time_prefix = current_date[1].split(":")[0]
                        return `${date_prefix}/${time_prefix}`
                    }
                    const streamToBuffer = (stream) => {
                        return new Promise((resolve, reject) => {
                            const chunks = []
                            stream.on("data", (chunk) => chunks.push(chunk))
                            stream.on("error", reject)
                            stream.on("end", () => resolve(Buffer.concat(chunks)))
                        })
                    }

                    const processLogEvent = (log_event) => {
                        let eventDate = new Date(log_event.timestamp).toISOString()
                        let message = log_event.message.replace(new RegExp("\t", "g"), " ")
                        return `${eventDate}: ${message}`
                    }

                    const displayLogEvents = (content) => {
                        let contents = content.replace(new RegExp("}{", "g"), "}%%%{")
                        contents.split("%%%").forEach((record) => {
                            let parsed = JSON.parse(record)
                            parsed.logEvents.forEach((event) => {
                                console.log(processLogEvent(event))
                            })
                        })
                    }

                    let last_key = null
                    const loop_through_logs = async () => {
                        let options = {
                            Bucket: bucket_name,
                            Prefix: getPrefix(),
                            MaxKeys: 5
                        }
                        if (last_key !== null)
                            options.StartAfter = last_key
                        const objects = await s3Client.send(new ListObjectsV2Command(options))
                        if (objects.Contents && objects.Contents.length > 0) {
                            last_key = objects.Contents[objects.Contents.length-1].Key
                            objects.Contents.forEach((object) => {
                                s3Client.send(new GetObjectCommand({
                                    Bucket: bucket_name,
                                    Key: object.Key
                                })).then((object) => {
                                    return streamToBuffer(object.Body)
                                }).then((compressedData) => {
                                    return zlib.unzipSync(compressedData).toString()
                                }).then((contents) => {
                                    displayLogEvents(contents)
                                })
                            })
                        }
                        setTimeout(loop_through_logs, 2000)
                    }
                    loop_through_logs()
                });
            } catch (e) {
                console.error(e)
                process.exit(1)
            }
        })

    program.parse(process.argv)
}

Promise.resolve()
    .then(() => main())
    .catch((err) => {
        console.error(err.message)
        process.exit(1)
    })
