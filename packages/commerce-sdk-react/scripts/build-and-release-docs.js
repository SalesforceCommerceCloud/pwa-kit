/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const packageJSON = require('../package.json')
const sh = require('shelljs')
const semver = require('semver')

// this script is expected to run on release branch.
const main = () => {
    // get the version number from package json
    const currentVersion = packageJSON.version
    const isPrerelease = semver.prerelease(currentVersion.trim())
    // if it is a pre-release version, do nothing
    if (isPrerelease) {
        console.log('This is a preview release, exiting.')
        return
    }

    let latestVersion
    let isNewPackage
    const {stdout, stderr} = sh.exec(`npm view ${packageJSON.name} version`, {silent: true})
    if (stderr) {
        isNewPackage = stderr.includes(`'${packageJSON.name}' is not in the npm registry`)
        if (!isNewPackage) {
            console.log('stderr', stderr)
            process.exit(0)
        }
    } else {
        latestVersion = stdout
    }

    const isLatest = isNewPackage || semver.gt(currentVersion, latestVersion)
    if (isLatest) {
        console.log(`Publish docs for version ${currentVersion} to gh-pages branch`)
        // build the docs
        sh.exec('npm run build:docs')

        // release the docs
        sh.exec(
            'npx gh-pages --dotfiles --message "[skip ci] Pushing docs to gh-pages" --dist docs'
        )
    }
}

main()
