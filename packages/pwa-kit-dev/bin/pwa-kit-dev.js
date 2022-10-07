#!/usr/bin/env node
/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const p = require('path')
const fse = require('fs-extra')
const program = require('commander')
const isEmail = require('validator/lib/isEmail')
const {execSync: _execSync} = require('child_process')
const pkg = require('../package.json')
const chalk = require('chalk')
const {getConfig} = require('pwa-kit-runtime/utils/ssr-config')

const upload2 = (() => {
    try {
        return require('../dist/utils/upload2')
    } catch {
        return require('../utils/upload2')
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
        return program.command(name)
            .addOption(
                new program.Option('--cloud-origin <origin>', 'the API origin to connect to')
                    .default(upload2.DEFAULT_CLOUD_ORIGIN)
                    .env('CLOUD_API_BASE')
            )
            .addOption(
                new program.Option(
                    '-c, --credentialsFile <credentialsFile>',
                    `override the standard credentials file location "${credentialsLocationDisplay()}"`
                )
                    .default(undefined) // *must* default to undefined!
                    .env('PWA_KIT_CREDENTIALS_FILE')
            )
            .hook('preAction', (thisCommand, actionCommand) => {
                // The final credentialsFile path depends on both cloudOrigin and credentialsFile opts.
                // Pre-process before passing to the command.
                const {cloudOrigin, credentialsFile} = actionCommand.opts()
                actionCommand.setOptionValue(
                    'credentialsFile',
                    upload2.getCredentialsFile(
                        cloudOrigin,
                        credentialsFile
                    )
                )
            })
    }

    managedRuntimeCommand('save-credentials')
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

    program
        .command('start')
        .description(`develop your app locally`)
        .addOption(
            new program.Option('--inspect', 'enable debugging with --inspect on the node process')
        )
        .addOption(new program.Option('--noHMR', 'disable the client-side hot module replacement'))
        .action(async ({inspect, noHMR}) => {
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
                'a custom project directory where your build is located'
            ).default(p.join(process.cwd(), 'build'), './build')
        )
        .addOption(
            new program.Option(
                '-m, --message <message>',
                'a message to include along with the uploaded bundle in Managed Runtime'
            ).default(undefined, '<git branch>:<git commit hash>')
        )
        .addOption(
            new program.Option(
                '-s, --projectSlug <projectSlug>',
                "a project slug that differs from the name property in your project's package.json"
            )
                // We load the slug from the package.json by default, but we don't want to do that
                // unless we need to, so it is loaded conditionally in the action implementation
                .default(undefined, "the 'name' key from the package.json")
        )
        .addOption(
            new program.Option(
                '-t, --target <target>',
                'immediately deploy the bundle to this target once it is pushed'
            )
        )
        .action(async ({buildDirectory, message, projectSlug, target, cloudOrigin, credentialsFile}) => {
            // Set the deployment target env var, this is required to ensure we
            // get the correct configuration object.
            process.env.DEPLOY_TARGET = target

            const credentials = await upload2.readCredentials(credentialsFile)

            const mobify = getConfig() || {}

            if (!projectSlug) {
                try {
                    const projectPkg = p.join(process.cwd(), 'package.json')
                    const {name} = fse.readJsonSync(projectPkg)
                    if (!name) throw new Error(`Missing "name" field in ${projectPkg}`)
                    projectSlug = name
                } catch (err) {
                    throw new Error(
                        `Could not detect project slug from "name" field in package.json: ${err.message}`
                    )
                }
            }

            const bundle = await upload2.createBundle({
                message,
                ssr_parameters: mobify.ssrParameters,
                ssr_only: mobify.ssrOnly,
                ssr_shared: mobify.ssrShared,
                buildDirectory,
                projectSlug
            })
            const client = new upload2.CloudAPIClient({
                credentials,
                origin: cloudOrigin,
            })

            info(`Beginning upload to ${cloudOrigin}`)
            const data = await client.push(bundle, projectSlug, target)
            const warnings = (data.warnings || [])
            warnings.forEach(warn)
            success('Bundle Uploaded')
        })

    program
        .command('lint')
        .description('lint all source files')
        .argument('<path>', 'path or glob to lint')
        .option('--fix', 'Try and fix errors (default: false)')
        .action(async (path, {fix}) => {
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
        .action(async ({path}) => {
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

    program
        .option('-v, --version', 'show version number')
        .action(async ({version}) => {
            if (version) {
                console.log(pkg.version)
            } else {
                program.help({error: true})
            }
        })

    await program.parseAsync(process.argv)
}

Promise.resolve()
    .then(async () => {
        try {
            await main()
        } catch (err) {
            error(err.message || err.toString())
            process.exit(1)
        }
    })

