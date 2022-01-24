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

sh.set('-e')

const pkgRoot = p.join(__dirname, '..')

const binDir = p.join(require.resolve('@babel/cli'), '..', '..', '..', '.bin')

const prettier = p.join(binDir, 'prettier')

const babel = p.join(binDir, 'babel')
const babelConfig = p.resolve(p.join(__dirname, 'babel.config.js'))

const eslint = p.join(binDir, 'eslint')
const eslintConfig = p.resolve(p.join(__dirname, '.eslintrc.js'))

const prepareDist = p.resolve(p.join(__dirname, 'prepare-dist.js'))

const main = () => {
    program.description(`Internal build tools for monorepo libraries`)

    program.command('build').action(() => {
        sh.rm('-rf', './dist')
        sh.mkdir('./dist')
        sh.exec(
            `${babel} --config-file ${babelConfig} src -x ".js",".jsx" --ignore "**/test_fixtures/*","*.test.js","test.js" --out-dir dist --copy-files`
        )
        sh.exec(prepareDist)
    })

    program
        .command('lint')
        .argument('<path>', 'path or glob to lint')
        .option('--fix', 'Try and fix errors (default: false)')
        .action((path, {fix}) => {
            sh.exec(
                `${eslint} --config ${eslintConfig} --resolve-plugins-relative-to ${pkgRoot}${
                    fix ? ' --fix' : ''
                } ${path}`
            )
        })

    program
        .command('format')
        .argument('<path>', 'path or glob to format')
        .action((path) => {
            sh.exec(`${prettier} --write ${path}`)
        })

    program.parse(process.argv)
}

main()
