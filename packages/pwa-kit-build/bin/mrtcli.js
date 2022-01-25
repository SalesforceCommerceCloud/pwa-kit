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
const isEmail = require('validator/lib/isEmail')
const {execSync: _execSync} = require('child_process')
const scriptUtils = require('../scripts/utils')
const sh = require('shelljs')
const uploadBundle = require('../scripts/upload.js')

const pkgRoot = p.join(__dirname, '..')
const binDir = p.join(require.resolve('prettier'), '../../.bin')

const projectPkg = require(p.join(process.cwd(), 'package.json'))

const execSync = (cmd, opts) => {
    const defaults = {stdio: 'inherit'}
    return _execSync(cmd, {...defaults, ...opts})
}

const main = () => {
    process.env.CONTEXT = process.cwd()
    program.description(`The Managed Runtime CLI`)

    program
        .command('login')
        .description(`login to Managed Runtime`)
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
            '-k --key <api-key>',
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
        .command('dev')
        .description(`develop your app locally`)
        .action(() => {
            execSync(`node ${p.join(process.cwd(), 'app', 'ssr.js')}`)
        })

    program
        .command('build')
        .description(`build your app for production`)
        .action(() => {
            const original = sh.config.silent
            sh.config.silent = false
            const webpack = p.join(binDir, 'webpack')
            const webpackConf = p.resolve(
                p.join(__dirname, '..', 'configs', 'webpack', 'config.js')
            )
            try {
                sh.rm('-rf', './build')
                sh.exec(`${webpack} --config ${webpackConf}`, {
                    env: {
                        NODE_ENV: 'production',
                        ...process.env
                    }
                })
            } finally {
                sh.config.silent = original
            }
        })

    program
        .command('push')
        .description(`push a bundle to managed runtime`)
        .addOption(
            new program.Option(
                '-b --buildDirectory <buildDirectory>',
                'a custom project directory where your build is located'
            ).default(p.join(process.cwd(), 'build'), './build')
        )
        .addOption(
            new program.Option(
                '-m --message <message>',
                "a message to include along with the uploaded bundle in Managed Runtime (default: '<git branch>:<git commit hash>')"
            )
        )
        .addOption(
            new program.Option(
                '-s --projectSlug <projectSlug>',
                "a project slug that differs from the name property in your project's package.json (default: the 'name' key from the package.json)"
            ).default(projectPkg.name)
        )
        .addOption(
            new program.Option(
                '-t --target <target>',
                'a custom target to upload a bundle to within Managed Runtime'
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
            const eslint = p.join(binDir, 'eslint')
            const eslintConfig = p.join(__dirname, '..', 'configs', 'eslint', 'eslint-config.js')
            sh.exec(
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
            const prettier = p.join(binDir, 'prettier')
            execSync(`${prettier} --write ${path}`)
        })

    program
        .command('test')
        .description('test the project')
        .option('--jest-args <args>', 'arguments to forward to Jest')
        .action(({jestArgs}) => {
            const jest = p.join(binDir, 'jest')
            execSync(`${jest} --passWithNoTests --maxWorkers=2${jestArgs ? ' ' + jestArgs : ''}`)
        })

    program.parse(process.argv)
}

main()
