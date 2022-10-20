#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const p = require('path')
const program = require('commander')
const sh = require('shelljs')
const {execSync: _execSync} = require('child_process')

sh.set('-e')

const execSync = (cmd, opts) => {
    const defaults = {stdio: 'inherit'}
    return _execSync(cmd, {...defaults, ...opts})
}

const pkgRoot = p.join(__dirname, '..')

const binDir = p.join(require.resolve('@babel/cli'), '..', '..', '..', '.bin')

const main = () => {
    program.description(`Internal build tools for monorepo libraries`)

    program.command('build').action(() => {
        const babel = p.join(binDir, 'babel')
        const babelConfig = p.resolve(p.join(process.cwd(), 'babel.config.js'))
        const prepareDist = p.resolve(p.join(__dirname, 'prepare-dist.js'))

        sh.rm('-rf', './dist')
        sh.mkdir('./dist')
        execSync(
            `${babel} --config-file ${babelConfig} src -x ".js",".jsx",".ts",".tsx" --ignore "**/test_fixtures/*","*.test.js","test.js" --out-dir dist --copy-files`
        )
        execSync(`node ${prepareDist}`)
    })

    program
        .command('lint')
        .argument('<path>', 'path or glob to lint')
        .option('--fix', 'Try and fix errors (default: false)')
        .action((path, {fix}) => {
            const eslint = p.join(binDir, 'eslint')
            const eslintConfig = p.resolve(p.join(__dirname, '..', 'configs', '.eslintrc.js'))

            execSync(
                `${eslint} --config ${eslintConfig} --resolve-plugins-relative-to ${pkgRoot}${
                    fix ? ' --fix' : ''
                } "${path}"`
            )
        })

    program
        .command('format')
        .argument('<path>', 'path or glob to format')
        .action((path) => {
            const prettier = p.join(binDir, 'prettier')
            execSync(`${prettier} --write "${path}"`)
        })

    program
        .command('test')
        .allowUnknownOption()
        .description('test the library')
        .action((_, {args}) => {
            const jest = p.join(require.resolve('jest'), '..', '..', '..', '.bin', 'jest')
            execSync(
                `${jest} --passWithNoTests --maxWorkers=2${args.length ? ' ' + args.join(' ') : ''}`
            )
        })

    program.parse(process.argv)
}

Promise.resolve()
    .then(() => main())
    .catch((err) => {
        console.error(err.message)
        process.exit(1)
    })
