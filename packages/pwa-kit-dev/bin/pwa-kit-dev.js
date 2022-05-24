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
const scriptUtils = require('../scripts/utils')
const uploadBundle = require('../scripts/upload.js')
const pkg = require('../package.json')
const {getConfig} = require('pwa-kit-runtime/utils/ssr-config')

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
                fse.writeJson(settingsPath, {username: user, api_key: key}, {spaces: 4})
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
                'a message to include along with the uploaded bundle in Managed Runtime'
            )
                // The default message is loaded dynamically as part of `uploadBundle(...)`
                .default(undefined, '<git branch>:<git commit hash>')
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
        .action(({buildDirectory, message, projectSlug, target}) => {
            // Set the deployment target env var, this is required to ensure we
            // get the correct configuration object.
            process.env.DEPLOY_TARGET = target

            const mobify = getConfig() || {}

            if (!projectSlug) {
                try {
                    // Using the full path isn't strictly necessary, but results in clearer errors
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

            const options = {
                buildDirectory,
                // Avoid setting message if it's blank, so that it doesn't override the default
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

    program.parse(process.argv)
}

Promise.resolve()
    .then(() => main())
    .catch((err) => {
        console.error(err.message)
        process.exit(1)
    })
