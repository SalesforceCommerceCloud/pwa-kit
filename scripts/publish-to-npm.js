#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')

// The branch naming convention for releasing a particular package is: release-<package-name>-1.1.x
// For example: 'release-retail-react-app-1.1.x'
const RELEASE_ONE_PACKAGE = /release-([-a-z]+)-\d+\./i

const main = () => {
    // Exiting early if working tree is not clean
    verifyCleanWorkingTree()

    const branchName = sh.exec('git branch --show-current', {silent: true}).trim()
    // DEBUG
    // const branchName = 'release-3.0.x'
    // const branchName = 'release-retail-react-app-1.0.x'

    console.log('--- Given the current branch:', branchName)

    const isNightly = branchName === 'nightly-releases'

    if (isNightly) {
        console.log('--- Nightly release detected. Releasing all packages...')
        publishPackages([], true)
    } else {
        const matched = branchName.match(RELEASE_ONE_PACKAGE)
        const packageName = matched && matched[1]

        if (packageName) {
            console.log(`--- Releasing ${packageName}...`)
            publishPackages([packageName])
        } else {
            console.log('--- Releasing all packages...')
            publishPackages()
        }
    }
}

/**
 * @param {string[]} packages - a list of package names without the "@salesforce" namespace
 * @param {boolean} isNightly - boolean value suggesting if packages are being published as a nightly release (affects NPM tag)
 */
const publishPackages = (packages = [], isNightly = false) => {
    verifyCleanWorkingTree()

    const publicPackages = JSON.parse(sh.exec('lerna list --json', {silent: true}))
    const packagesToIgnore = publicPackages.filter(
        (pkg) => !packages.includes(pkg.name.replace('@salesforce/', ''))
    )

    const cleanUp = () => {
        // Undo the temporary commit
        sh.exec('git reset HEAD~1', {silent: true})

        packagesToIgnore.forEach((pkg) => {
            sh.exec('npm pkg delete private', {cwd: pkg.location})
        })
    }

    const publishSomePackagesOnly = packages.length > 0
    if (publishSomePackagesOnly) {
        packagesToIgnore.forEach((pkg) => {
            sh.exec('npm pkg set private=true', {cwd: pkg.location})
        })

        sh.exec('git add .', {silent: true})
        sh.exec('git commit -m "temporary commit to have clean working tree"', {silent: true})
    }

    // Why do we still want `lerna publish`? It turns out that we do need it. Sometimes we wanted some behaviour that's unique to Lerna.
    // For example: we have `publishConfig.directory` in some package.json files that only Lerna knows what to do with it.
    // https://github.com/lerna/lerna/tree/main/libs/commands/publish#publishconfigdirectory

    const {stderr, code} = sh.exec(
        `npm run lerna -- publish from-package --yes --no-verify-access --pre-dist-tag ${
            isNightly ? 'nightly-next' : 'next'
        } ${process.env.CI ? '' : '--registry http://localhost:4873/'}`
    )
    // DEBUG
    // console.log('--- Would publish these public packages to npm:')
    // sh.exec('lerna list --long')

    // Make sure to clean up, no matter if there's an error or not
    if (publishSomePackagesOnly) {
        cleanUp()
    }

    if (stderr) {
        process.exit(code)
    }
}

const verifyCleanWorkingTree = () => {
    const isWorkingTreeClean = sh.exec('git status --porcelain', {silent: true}).trim() === ''
    if (!isWorkingTreeClean) {
        console.error(
            'There are some uncommitted changes. `lerna publish` expects a clean working tree.'
        )
        process.exit(1)
    }
}

main()
