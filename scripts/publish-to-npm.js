#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const path = require('path')

// Exit upon error
sh.set('-e')

const PWA_KIT_PACKAGES = [
    'pwa-kit-create-app',
    'pwa-kit-dev',
    'pwa-kit-runtime',
    'pwa-kit-react-sdk',
    'commerce-sdk-react'
]

const main = () => {
    // TODO
    // - look at the release branch's name
    // - toggle `private` accordingly
    // - run `lerna publish`
    // - restore `private` afterwards
    const {stdout: branchName} = sh.exec('git branch --show-current', {silent: true})

    // If branch name is `release-3.1.x`
    // If branch name is `release-retail-react-app-3.1.x`
    // if (/^release-\d/.test(branchName)) {}
    // if (/^release-retail-react-app-\d/.test(branchName)) {}

    const isReleasingPWAKit = false
    const isReleasingRetailApp = true

    if (isReleasingPWAKit) {
        console.log('--- Planning to release pwa-kit packages...')
        const pathToRetailApp = path.join(__dirname, '..', 'packages/template-retail-react-app')

        sh.exec('npm pkg set private=true', {cwd: pathToRetailApp})
        lernaPublish()
        sh.exec('npm pkg delete private', {cwd: pathToRetailApp})

    } else if (isReleasingRetailApp) {
        console.log('--- Planning to release retail-react-app...')
        // TODO: rely on `lerna list --json`
        PWA_KIT_PACKAGES.forEach((packageName) => {
            const pathToPackage = path.join(__dirname, '..', `packages/${packageName}`)
            sh.exec('npm pkg set private=true', {cwd: pathToPackage})
        })

        lernaPublish()

        PWA_KIT_PACKAGES.forEach((packageName) => {
            const pathToPackage = path.join(__dirname, '..', `packages/${packageName}`)
            sh.exec('npm pkg delete private', {cwd: pathToPackage})
        })
    }
}

const lernaPublish = () => {
    // Why do we still want `lerna publish`? It turns that we do need it. Sometimes we wanted some behaviour that's unique to Lerna.
    // For example: we have `publishConfig.directory` in some package.json files that only Lerna knows what to do with it.
    // https://github.com/lerna/lerna/tree/main/libs/commands/publish#publishconfigdirectory

    // DEBUG: disable for now
    // sh.exec('npm run lerna -- publish from-package --yes --no-verify-access --pre-dist-tag next')

    console.log('--- Would publish some packages that are public:')
    sh.exec('npm run lerna -- list --long --all')
}

main()
