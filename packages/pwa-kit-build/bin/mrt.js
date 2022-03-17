#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const p = require('path')
const fs = require('fs')
const program = require('commander')
const { CloudWatchLogsClient, FilterLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs");
const {fromCognitoIdentity} =  require("@aws-sdk/credential-providers")
const isEmail = require('validator/lib/isEmail')
const {execSync: _execSync} = require('child_process')
const request = require('request')
const scriptUtils = require('../scripts/utils')
const sh = require('shelljs')
const uploadBundle = require('../scripts/upload.js')
const pkg = require('../package.json')

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
            `The Managed Runtime CLI`,
            ``,
            `For more information run a command with the --help flag, eg.`,
            ``,
            `  $ mrt push --help`
        ].join('\n')
    )

    program.addHelpText(
        'after',
        [
            ``,
            `Usage inside NPM scripts:`,
            ``,
            `  The mrt CLI is used in NPM scripts so you can conveniently`,
            `  run eg. 'npm run push' to push a bundle from a project.`,
            ``,
            `  To pass args to mrt when wrapped in an NPM script, separate them`,
            `  with '--' so they aren't parsed by NPM itself, eg:`,
            ``,
            `    $ mrt push --target production`,
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
            const webpackConf = p.resolve(
                p.join(__dirname, '..', 'configs', 'webpack', 'config.js')
            )
            sh.rm('-rf', './build')
            execSync(`${webpack} --config ${webpackConf}`, {
                env: {
                    NODE_ENV: 'production',
                    ...process.env
                }
            })
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
            const mobify = projectPkg.mobify || {}

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
                } ${path}`
            )
        })

    program
        .command('format')
        .description('automatically re-format all source files')
        .argument('<path>', 'path or glob to format')
        .action((path) => {
            const prettier = p.join(require.resolve('prettier'), '..', '..', '.bin', 'prettier')
            execSync(`${prettier} --write ${path}`)
        })

    program
        .command('test')
        .description('test the project')
        .option('--jest-args <args>', 'arguments to forward to Jest')
        .action(({jestArgs}) => {
            const jest = p.join(require.resolve('jest'), '..', '..', '..', '.bin', 'jest')
            execSync(`${jest} --passWithNoTests --maxWorkers=2${jestArgs ? ' ' + jestArgs : ''}`)
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
                    url: `https://cloud-mahdi.mobify-staging.com/api/projects/${project}/target/${environment}/log/`,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${auth.api_key}`
                    }
                };

                request(options, function(err, res, body) {
                    let json = JSON.parse(body);
                    logGroupName = json.log_group;
                    region = json.region
                    identityId = json.identity_id;
                    const cloudwatch = new CloudWatchLogsClient({
                        region,
                        credentials: fromCognitoIdentity({
                            identityId,
                            logins: {
                                "cognito-identity.amazonaws.com": json.token
                            }
                        })
                    });
                    next_token = null
                    function loop_display_logs(){
                        const command = new FilterLogEventsCommand({
                            logGroupName, //: "/aws/lambda/ssr-JLVNKC4YCFG4FDSBLXREHVS3Y5CJQ6WZXGUOME5A",
                            nextToken: next_token
                        })
                        cloudwatch.send(command).then(
                            (data) => {
                                // display logs.
                                if(data.events.length > 0){
                                    console.log(data.events);
                                    next_token = data.nextToken;
                                }
                                setTimeout(loop_display_logs, 2000);
                            },
                            (error) => {
                                // error handling.
                                console.log('error', error)
                            }
                        );
                    }
                    loop_display_logs()
                });
            } catch (e) {
                console.error('Failed to read credentials.')
                console.error(e)
                process.exit(1)
            }
        })

    program.option('-v, --version', 'show version number').action(({version}) => {
        if (version) {
            console.log(pkg.version)
        } else {
            program.help({error: true})
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
