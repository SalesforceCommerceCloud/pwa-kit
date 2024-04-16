#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const readline = require('readline')
const path = require('path')
const childProc = require('child_process')
const fs = require('fs')
const pkg = require('../package.json')

const isWin = process.platform === 'win32'
const extension = isWin ? '.cmd' : ''

const npm = `npm${extension}`

const spawnSync = (...args) => {
    const proc = childProc.spawnSync(...args)
    if (proc.status !== 0) {
        throw proc.stderr.toString()
    }
    return proc
}

if (!fs.existsSync(path.join('node_modules', 'semver'))) {
    spawnSync(
        npm,
        [
            'install',
            `semver@${pkg.devDependencies['semver']}`,
            '--loglevel=silent',
            '--no-save',
            '--no-package-lock',
            '--ignore-scripts',
            '--no-audit'
        ],
        {shell: true}
    )
}

const semver = require('semver')
const requiredNode = pkg.engines.node
const foundNode = process.version
const requiredNpm = pkg.engines.npm
const foundNpm = spawnSync(npm, ['-v'], {shell: true}).stdout.toString().trim()

const warnings = []

if (!semver.satisfies(foundNode, new semver.Range(requiredNode))) {
    warnings.push(`- Node: ${foundNode} is installed, but we require ${requiredNode}`)
}

if (!semver.satisfies(foundNpm, new semver.Range(requiredNpm))) {
    warnings.push(`- NPM: ${foundNpm} is installed, but we require ${requiredNpm}`)
}

const red = (s) => `\x1b[31m${s}\u001b[0m`
const blue = (s) => `\x1b[36m${s}\u001b[0m`

if (warnings.length) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    console.log(red('Pausing installation...'))
    console.log(
        'Warning: Some software installed locally does not meet the version requirements:\n'
    )
    warnings.forEach((warning) => console.log(warning))
    console.log('')

    console.log('To fix this warning, see: http://sfdc.co/pwa-kit-required-software')
    rl.question(
        blue(
            'Your app may not work as expected when deployed to Managed Runtime servers. Would you like to continue installing anyway? (y/N) '
        ),
        (answer) => {
            const continueAnyway = /^y|yes$/i.test(answer)
            process.exit(continueAnyway ? 0 : 1)
        }
    )
} else {
    process.exit(0)
}
