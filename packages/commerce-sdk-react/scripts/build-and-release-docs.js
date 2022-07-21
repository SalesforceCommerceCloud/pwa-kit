/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const semver = require('semver')

// this script is expected to run on release branch.
const main = () => {
    // get the version number from package json
    const {stdout: currentVersion} = sh.exec(
        "cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g'"
    )
    // const isPrerelease = semver.prerelease(currentVersion.trim())
    // // if it is a pre-release version, do nothing
    // if (isPrerelease) {
    //     return
    // }

    let latestVersion

    //TODO: Refactor this after we've release first version of commerce-sdk-react
    // get the latest version from npm registry
    const {stdout, stderr} = sh.exec('npm view commerce-sdk-react version', {silent: true})
    latestVersion = stdout
    // if error, it means 'commerce-sdk-react' is not in the npm registry yet
    if (stderr) {
        // use the version of pwa-kit-react-sdk instead
        const {stdout} = sh.exec('npm view pwa-kit-react-sdk version', {silent: true})
        latestVersion = stdout
    }

    console.log('currentVersion', currentVersion)
    console.log('latestVersion', latestVersion)

    // check if current version is larger than the latest one in npm,
    // if it is true, it means we are about to release a new version to npm
    const isLatest = semver.gt(currentVersion, latestVersion)
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
