#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')

// Exit upon error
sh.set('-e')

// The branch naming convention for releasing a particular package is: release-<package-name>-1.1.x
// For example: 'release-retail-react-app-1.1.x'
const RELEASE_ONE_PACKAGE = /release-([-a-z]+)-\d+\./i

const main = () => {
    console.log(
        '--- Verify that all the versions are correct by installing every package in the monorepo'
    )
    sh.exec('npm install')

    const {stdout} = sh.exec('git branch --show-current', {silent: true})
    // TODO
    // const branchName = stdout.trim()
    const branchName = 'release-3.1.x'
    // const branchName = 'release-retail-react-app-3.1.x'

    console.log('--- Given the current branch:', branchName)

    const matched = branchName.match(RELEASE_ONE_PACKAGE)
    const packageName = matched && matched[1]

    if (packageName) {
        console.log(`--- Releasing ${packageName}...`)

        const publicPackages = JSON.parse(sh.exec('lerna list --json', {silent: true}))
        const allOtherPublicPackages = publicPackages.filter((pkg) => pkg.name !== packageName)

        allOtherPublicPackages.forEach((pkg) => {
            sh.exec('npm pkg set private=true', {cwd: pkg.location})
        })
        lernaPublish()
        allOtherPublicPackages.forEach((pkg) => {
            sh.exec('npm pkg delete private', {cwd: pkg.location})
        })
    } else {
        console.log('--- Releasing all packages...')
        lernaPublish()
    }
}

const lernaPublish = () => {
    // Why do we still want `lerna publish`? It turns out that we do need it. Sometimes we wanted some behaviour that's unique to Lerna.
    // For example: we have `publishConfig.directory` in some package.json files that only Lerna knows what to do with it.
    // https://github.com/lerna/lerna/tree/main/libs/commands/publish#publishconfigdirectory

    // DEBUG: disable for now
    // sh.exec('npm run lerna -- publish from-package --yes --no-verify-access --pre-dist-tag next')

    console.log('--- Would publish these public packages to npm:')
    sh.exec('lerna list --long')
}

main()
