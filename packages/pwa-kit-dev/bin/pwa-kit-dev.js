#!/usr/bin/env node
/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const chalk = require('chalk')
const p = require('path')
const fse = require('fs-extra')
const WebSocket = require('ws')
const program = require('commander')
const validator = require('validator')
const {execSync: _execSync} = require('child_process')
const scriptUtils = require('../scripts/utils')
const uploadBundle = require('../scripts/upload.js')
const pkg = require('../package.json')
const {getConfig} = require('pwa-kit-runtime/utils/ssr-config')

const colors = {
    info: 'green',
    warn: 'yellow',
    error: 'red'
}

const execSync = (cmd, opts) => {
    const defaults = {stdio: 'inherit'}
    return _execSync(cmd, {...defaults, ...opts})
}

const main = () => {
    const pkgRoot = p.join(__dirname, '..')
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

    /**
     * All Managed Runtime commands take common opts like --cloud-origin
     * and --credentialsFile. These are set to be split out from the SDK
     * commands here in the near future.
     */
    const managedRuntimeCommand = (name) => {
        return program
            .command(name)
            .addOption(
                new program.Option('--cloud-origin <origin>', 'the API origin to connect to')
                    .default('https://cloud.mobify.com')
                    .env('CLOUD_API_BASE')
                    .argParser((val) => {
                        try {
                            const url = new URL(val)
                            const labels = url.host.split('.')
                            if (
                                labels.length !== 3 ||
                                !labels[0].startsWith('cloud') ||
                                !labels[1].startsWith('mobify') ||
                                labels[2] !== 'com'
                            ) {
                                throw new Error()
                            }
                        } catch {
                            throw new program.InvalidArgumentError(
                                `'${val}' is not a valid Cloud origin`
                            )
                        }
                        return val
                    })
            )
            .addOption(
                new program.Option(
                    '-c, --credentialsFile <credentialsFile>',
                    'override the standard credentials file location'
                )
                    .default(scriptUtils.getCredentialsFile())
                    .env('PWA_KIT_CREDENTIALS_FILE')
            )
    }

    managedRuntimeCommand('save-credentials')
        .description(`save API credentials for Managed Runtime`)
        .requiredOption(
            '-u, --user <email>',
            'the e-mail address you used to register with Managed Runtime',
            (val) => {
                if (!validator.isEmail(val)) {
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
                if (!(typeof val === 'string' && val.length > 0)) {
                    throw new program.InvalidArgumentError(`"${val}" cannot be empty`)
                } else {
                    return val
                }
            }
        )
        .action(({user, key, credentialsFile}) => {
            try {
                fse.writeJson(credentialsFile, {username: user, api_key: key}, {spaces: 4})
                console.log(`Saved Managed Runtime credentials to "${credentialsFile}".`)
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
        .addOption(new program.Option('--noHMR', 'disable the client-side hot module replacement'))
        .action(({inspect, noHMR}) => {
            execSync(
                `node${inspect ? ' --inspect' : ''} ${p.join(process.cwd(), 'app', 'ssr.js')}`,
                {
                    env: {
                        ...process.env,
                        ...(noHMR ? {HMR: 'false'} : {})
                    }
                }
            )
        })

    program
        .command('build')
        .addOption(
            new program.Option(
                '-b, --buildDirectory <buildDirectory>',
                'the directory where your project should be built'
            )
                .default(p.join(process.cwd(), 'build'), './build')
                .env('PWA_KIT_BUILD_DIR')
        )
        .description(`build your app for production`)
        .action(({buildDirectory}) => {
            const webpack = p.join(require.resolve('webpack'), '..', '..', '..', '.bin', 'webpack')
            const projectWebpack = p.join(process.cwd(), 'webpack.config.js')
            const webpackConf = fse.pathExistsSync(projectWebpack)
                ? projectWebpack
                : p.join(__dirname, '..', 'configs', 'webpack', 'config.js')
            fse.emptyDirSync(buildDirectory)
            execSync(`${webpack} --config ${webpackConf}`, {
                env: {
                    NODE_ENV: 'production',
                    ...process.env,
                    // Command option overrides the env var, so we must continue that pattern
                    PWA_KIT_BUILD_DIR: buildDirectory
                }
            })

            // Copy the project `package.json` into the build folder.
            fse.copyFileSync('package.json', p.join(buildDirectory, 'package.json'))

            // Copy config files.
            const config = p.resolve('config')
            if (fse.pathExistsSync(config)) {
                fse.copySync(
                    config,
                    p.join(buildDirectory, 'config'),
                    (file) => !p.basename(file).startsWith('local.')
                )
            }

            const loader = p.join(buildDirectory, 'loader.js')
            if (!fse.pathExistsSync(loader)) {
                fse.outputFileSync(
                    loader,
                    '// This file is required by Managed Runtime for historical reasons.\n'
                )
            }
        })

    managedRuntimeCommand('push')
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
                'a message to include along with the uploaded bundle in Managed Runtime'
            )
                // The default message is loaded dynamically as part of `uploadBundle(...)`
                .default(null, '<git branch>:<git commit hash>')
        )
        .addOption(
            new program.Option(
                '-s, --projectSlug <projectSlug>',
                "a project slug that differs from the name property in your project's package.json"
            )
                // We load the slug from the package.json by default, but we don't want to do that
                // unless we need to, so it is loaded conditionally in the action implementation
                .default(null, "the 'name' key from the package.json")
        )
        .addOption(
            new program.Option(
                '-t, --target <target>',
                'immediately deploy the bundle to this target once it is pushed'
            )
        )
        .action(({buildDirectory, message, projectSlug, target, cloudOrigin, credentialsFile}) => {
            // Set the deployment target env var, this is required to ensure we
            // get the correct configuration object.
            process.env.DEPLOY_TARGET = target
            const mobify = getConfig() || {}

            if (!projectSlug) {
                projectSlug = scriptUtils.readPackageJson('name')
            }

            const options = {
                buildDirectory,
                // Avoid setting message if it's blank, so that it doesn't override the default
                ...(message ? {message} : undefined),
                projectSlug,
                target,
                credentialsFile,
                // Note: Cloud expects snake_case, but package.json uses camelCase.
                ssr_parameters: mobify.ssrParameters,
                ssr_only: mobify.ssrOnly,
                ssr_shared: mobify.ssrShared,
                set_ssr_values: true,
                origin: cloudOrigin
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

    managedRuntimeCommand('tail-logs')
        .description(`continuously stream environment logs`)
        .addOption(
            new program.Option('-p, --project <projectSlug>', 'the project slug').default(
                null,
                "the 'name' key from package.json"
            )
        )
        .requiredOption('-e, --environment <environmentSlug>', 'the environment slug')
        .action(async ({project, environment, cloudOrigin, credentialsFile}, command) => {
            if (!project) {
                project = scriptUtils.readPackageJson('name')
            }

            let credentials
            try {
                credentials = fse.readJsonSync(credentialsFile)
            } catch (e) {
                scriptUtils.fail(`Error reading credentials: ${e}`)
            }

            const token = await scriptUtils.createToken(
                project,
                environment,
                cloudOrigin,
                credentials.api_key
            )
            const url = new URL(cloudOrigin.replace('cloud', 'logs'))
            url.protocol = 'wss'
            url.search = new URLSearchParams({
                project,
                environment,
                user: credentials.username,
                access_token: token
            })

            const ws = new WebSocket(url)
            let heartbeat

            ws.on('open', () => {
                // Send a heartbeat periodically to bypass idle timeout.
                const idleTimeout = 10 * 60 * 1000
                heartbeat = setInterval(() => ws.ping(), idleTimeout / 2)
            })

            ws.on('close', (code) => {
                clearInterval(heartbeat)
                console.log('Connection closed with code', code)
            })

            ws.on('error', (error) => {
                clearInterval(heartbeat)
                scriptUtils.fail(`Error tailing logs: ${error.message}`)
            })

            ws.on('message', (data) => {
                JSON.parse(data).forEach((log) => {
                    const {message, shortRequestId, level} = scriptUtils.parseLog(log.message)
                    const color = chalk[colors[level.toLowerCase()] || 'green']
                    const paddedLevel = level.padEnd(6)
                    console.log(
                        chalk.green(new Date(log.timestamp).toISOString()),
                        chalk.cyan(shortRequestId),
                        ['WARN', 'ERROR'].includes(level)
                            ? color.bold(paddedLevel)
                            : color(paddedLevel),
                        message
                    )
                })
            })
        })

    // Global options

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
