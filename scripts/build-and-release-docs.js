#!/usr/bin/env node
/* eslint-env node */
const sh = require('shelljs')
const semver = require('semver')

// this script is expected to run on release branch.
const main = () => {
    // get the latest version from npm registry
    const {stdout: latestVersion} = sh.exec('npm view pwa-kit-react-sdk version', {silent: true})

    // get the version number from package json
    const {stdout: currentVersion} = sh.exec(
        "cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g'"
    )

    const isPrerelease = semver.prerelease(currentVersion.trim())
    // if it is a pre-release version, do nothing
    if (isPrerelease) {
        return
    }

    // check if current version is larger than the latest one in npm,
    // if it is true, it means we are about to release a new version to npm
    const isLatest = semver.gt(currentVersion, latestVersion)
    // we only want to publish the docs for latest release branch
    if (isLatest) {
        console.log(`Publish docs for version ${currentVersion} to gh-pages branch test run`)
        // build the docs
        sh.exec('npm run build:docs')

        // release the docs
        sh.exec(
            'npx gh-pages --dotfiles --message "[skip ci] Pushing docs to gh-pages" --dist docs'
        )

        // delete docs file
        sh.rm('-rf', 'docs')
    }
}

main()
