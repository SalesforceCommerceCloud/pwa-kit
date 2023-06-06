#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const program = require('commander')
const path = require('path')

sh.set('-e')

const defaultDir = process.cwd()

program.description(
    [
        `Smoke-tests uncommonly-run NPM scripts that get shipped with PWA Kit projects `,
        `by simply checking that those scripts exit without errors.`
    ].join('\n')
)
program.option('--dir <dir>', `Path to a PWA Kit project`, defaultDir)

program.parse(process.argv)

const main = () => {
    const opts = program.opts();

    const cwd = path.resolve(opts.dir)

    const pkg = JSON.parse(sh.cat(path.join(cwd, 'package.json')))

    // The excluded scripts are either already part of our CI steps or are not safe to run.
    const exclude = [
        /^lint.*$/,
        /^test.*$/,
        /^push$/,
        /^save-credentials$/,
        /^tail-logs$/,
        /^format$/,
        /^build$/,
        /^start.*$/,
        /^compile-translations.*$/,
        /^extract-default-translations.*$/,
        /^bump-version.*$/
    ]

    const scripts = Object.keys(pkg.scripts).filter(
        (script) => !exclude.some((re) => script.match(re))
    )

    scripts.forEach((script) => {
        const cmd = `npm run ${script}`
        console.log(`Testing "${cmd}"`)
        try {
            sh.exec(cmd, {cwd, silent: true})
        } catch (e) {
            console.error(e)
            sh.exit(1)
        }
    })
}

main()
