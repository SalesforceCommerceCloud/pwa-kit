#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const chalk = require('chalk')
const p = require('path')
const fse = require('fs-extra')
const WebSocket = require('ws')
const program = require('commander')
const validator = require('validator')
const {execSync: _execSync} = require('child_process')
const projectPkg = require(process.cwd() + '/package.json')
const {getConfig} = require('@salesforce/pwa-kit-runtime/utils/ssr-config')

// Scripts in ./bin have never gone through babel, so we
// don't have a good pattern for mixing compiled/un-compiled
// code.
//
// This conditional import lets us gradually migrate portions
// of this script to Typescript, until internal-lib-build
// has a decent pattern for ./bin scripts!
const scriptUtils = (() => {
    try {
        return require('../dist/utils/script-utils')
    } catch {
        return require('../utils/script-utils')
    }
})()

const colors = {
    warn: 'yellow',
    error: 'red',
    success: 'cyan'
}

const fancyLog = (level, msg) => {
    const color = colors[level] || 'green'
    const colorFn = chalk[color]
    console.log(`${colorFn(level)}: ${msg}`)
}
const info = (msg) => fancyLog('info', msg)
const success = (msg) => fancyLog('success', msg)
const warn = (msg) => fancyLog('warn', msg)
const error = (msg) => fancyLog('error', msg)

const execSync = (cmd, opts) => {
    const defaults = {stdio: 'inherit'}
    return _execSync(cmd, {...defaults, ...opts})
}

const getProjectName = async () => {
    const projectPkg = await scriptUtils.getProjectPkg()
    if (!projectPkg.name) {
        throw new Error(`Missing "name" field in "package.json"`)
    }
    return projectPkg.name
}

const main = async () => {
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
            `  The PWA Kit Developer Tools are used in NPM scripts so you can conveniently`,
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
     * Return a platform-specific representation of the default credentials
     * location *for documentation purposes only*.
     *
     * It's easier to recognize the intention behind `(default "~/.mobify")` in
     * docs than it is `(default "/Users/xyz/.mobify")`. In the second case,
     * you have to actually remember that this is your home dir!
     */
    const credentialsLocationDisplay = () => {
        const dir = process.platform === 'win32' ? '%USERPROFILE%' : '~'
        return p.join(dir, '.mobify')
    }

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
                    .default(scriptUtils.DEFAULT_CLOUD_ORIGIN)
                    .env('CLOUD_API_BASE')
            )
            .addOption(
                new program.Option(
                    '-c, --credentialsFile <credentialsFile>',
                    `override the standard credentials file location "${credentialsLocationDisplay()}"`
                )
                    // Must default to undefined in order to trigger automatic-lookup
                    // of a credentials file, based on --cloud-origin.
                    .default(undefined)
                    .env('PWA_KIT_CREDENTIALS_FILE')
            )
            .hook('preAction', (thisCommand, actionCommand) => {
                // The final credentialsFile path depends on both cloudOrigin and credentialsFile opts.
                // Pre-process before passing to the command.
                const {cloudOrigin, credentialsFile} = actionCommand.opts()
                actionCommand.setOptionValue(
                    'credentialsFile',
                    scriptUtils.getCredentialsFile(cloudOrigin, credentialsFile)
                )
            })
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
                if (typeof val !== 'string' || val === '') {
                    throw new program.InvalidArgumentError(`"api-key" cannot be empty`)
                } else {
                    return val
                }
            }
        )
        .action(async ({user, key, credentialsFile}) => {
            try {
                fse.writeJson(credentialsFile, {username: user, api_key: key}, {spaces: 4})
                success(`Saved Managed Runtime credentials to "${chalk.cyan(credentialsFile)}".`)
            } catch (e) {
                error('Failed to save credentials.')
                throw e
            }
        })

    const appSSRpath = p.join(process.cwd(), 'app', 'ssr.js')
    const appSSRjs = fse.pathExistsSync(appSSRpath)
    const overrideSSRpath = p.join(
        process.cwd(),
        typeof projectPkg?.ccExtensibility?.overridesDir === 'string' &&
            !projectPkg?.ccExtensibility?.overridesDir?.startsWith(p.sep)
            ? p.sep + projectPkg?.ccExtensibility?.overridesDir
            : projectPkg?.ccExtensibility?.overridesDir
            ? projectPkg?.ccExtensibility?.overridesDir
            : '',
        'app',
        'ssr.js'
    )
    const overrideSSRjs = fse.pathExistsSync(overrideSSRpath)
    const resolvedSSRPath = appSSRjs ? appSSRpath : overrideSSRjs ? overrideSSRpath : null

    program
        .command('start')
        .description(`develop your app locally`)
        .addOption(
            new program.Option('--inspect', 'enable debugging with --inspect on the node process')
        )
        .addOption(new program.Option('--noHMR', 'disable the client-side hot module replacement'))
        .action(async ({inspect, noHMR}) => {
            execSync(`node${inspect ? ' --inspect' : ''} ${resolvedSSRPath}`, {
                env: {
                    ...process.env,
                    ...(noHMR ? {HMR: 'false'} : {})
                }
            })
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
        .action(async ({buildDirectory}) => {
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
                'a custom project build directory that you want to push'
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
        .action(
            async ({
                buildDirectory,
                message,
                projectSlug,
                target,
                cloudOrigin,
                credentialsFile
            }) => {
                // Set the deployment target env var, this is required to ensure we
                // get the correct configuration object. Do not assign the variable it if
                // the target value is `undefined` as it will serialied as a "undefined"
                // string value.
                if (target) {
                    process.env.DEPLOY_TARGET = target
                }

                const credentials = await scriptUtils.readCredentials(credentialsFile)

                if (!fse.pathExistsSync(buildDirectory)) {
                    throw new Error(`Supplied "buildDirectory" does not exist!`)
                }

                const mobify = getConfig({buildDirectory}) || {}

                if (!projectSlug) {
                    projectSlug = await getProjectName()
                }

                const bundle = await scriptUtils.createBundle({
                    message,
                    ssr_parameters: mobify.ssrParameters,
                    ssr_only: mobify.ssrOnly,
                    ssr_shared: mobify.ssrShared,
                    buildDirectory,
                    projectSlug
                })
                const client = new scriptUtils.CloudAPIClient({
                    credentials,
                    origin: cloudOrigin
                })

                info(`Beginning upload to ${cloudOrigin}`)
                const data = await client.push(bundle, projectSlug, target)
                const warnings = data.warnings || []
                warnings.forEach(warn)
                success('Bundle Uploaded')
            }
        )

    program
        .command('lint')
        .description('lint all source files')
        .argument('<path>', 'path or glob to lint')
        .option('--fix', 'Try and fix errors (default: false)')
        .action(async (path, {fix}) => {
            const eslint = p.join(require.resolve('eslint'), '..', '..', '..', '.bin', 'eslint')
            execSync(
                `${eslint} --resolve-plugins-relative-to ${pkgRoot}${fix ? ' --fix' : ''} "${path}"`
            )
        })

    program
        .command('format')
        .description('automatically re-format all source files')
        .argument('<path>', 'path or glob to format')
        .action(async (path) => {
            const prettier = p.join(require.resolve('prettier'), '..', '..', '.bin', 'prettier')
            execSync(`${prettier} --write "${path}"`)
        })

    program
        .command('test')
        .description('test the project')
        .action(async (_, {args}) => {
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
        .action(async ({project, environment, cloudOrigin, credentialsFile}) => {
            if (!project) {
                project = await getProjectName()
            }

            const credentials = await scriptUtils.readCredentials(credentialsFile)

            const client = new scriptUtils.CloudAPIClient({
                credentials,
                origin: cloudOrigin
            })

            const token = await client.createLoggingToken(project, environment)

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

            ws.on('error', (err) => {
                clearInterval(heartbeat)
                error(`Error tailing logs: ${err.message}`)
                throw err
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
    program.option('-v, --version', 'show version number').action(async ({version}) => {
        if (version) {
            const pkg = await scriptUtils.getPkgJSON()
            console.log(pkg.version)
        } else {
            program.help({error: true})
        }
    })

    await program.parseAsync(process.argv)
}

Promise.resolve().then(async () => {
    try {
        await main()
    } catch (err) {
        error(err.message || err.toString())
        process.exit(1)
    }
})
