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
    // Exiting early if working tree is not clean
    verifyCleanWorkingTree()

    console.log(
        '--- Verify that all the versions are correct by installing every package in the monorepo'
    )
    sh.exec('npm install')

    // TODO: un-comment this
    // const branchName = sh.exec('git branch --show-current', {silent: true}).trim()
    // const branchName = 'release-3.1.x'
    const branchName = 'release-retail-react-app-1.0.x'

    console.log('--- Given the current branch:', branchName)

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

const publishPackages = (packages = []) => {
    verifyCleanWorkingTree()

    const publicPackages = JSON.parse(sh.exec('lerna list --json', {silent: true}))
    const packagesToIgnore = publicPackages.filter((pkg) => !packages.includes(pkg.name))

    const cleanUp = () => {
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

    // TODO: un-comment this
    const {stderr, code} = sh.exec(
        'npm run lerna -- publish from-package --yes --no-verify-access --pre-dist-tag next',
        {fatal: false}
    )
    if (stderr) {
        cleanUp()
        process.exit(code)
    }

    // DEBUG
    // console.log('--- Would publish these public packages to npm:')
    // sh.exec('lerna list --long')

    if (publishSomePackagesOnly) {
        cleanUp()
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
