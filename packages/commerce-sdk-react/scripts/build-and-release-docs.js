/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
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
        return
    }

    let latestVersion

    const {stdout, stderr} = sh.exec(`npm view ${packageJSON.name} version`, {silent: true})
    if (stdout) {
        latestVersion = stderr
    } else {
        // if 'commerce-sdk-react' is not in the npm registry
        // assuming currentVersion to be the latest
        const isNotPublished = stderr.includes(`'${packageJSON.name}' is not in the npm registry`)
        if (isNotPublished) {
            latestVersion = currentVersion
        } else {
            console.log('stderr', stderr)
            process.exit(0)
        }
    }
    // check if current version is larger or equal than the latest one in npm,
    // if it is true, build and publish the docs to the gh-pages branch
    const isLatest = semver.gte(currentVersion, latestVersion)
    // we only want to publish the docs for latest release branch
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
