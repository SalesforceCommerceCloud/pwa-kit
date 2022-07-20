#!/usr/bin/env node
/* eslint-env node */
const sh = require('shelljs')
const semver = require('semver')

const main = () => {
    // get the latest version from npm registry
    const {stdout: latestVersion} = sh.exec('npm view pwa-kit-react-sdk version', {silent: true})

    // get the version number from package json
    const {stdout: currentVersion} = sh.exec(
        "cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g'"
    )

    // const isPrerelease = semver.prerelease(currentVersion.trim())
    // if it is a pre-release version, do nothing
    // if (isPrerelease) {
    //     return
    // }

    const isLatest = semver.gt(currentVersion, latestVersion)
    // we only want to publish the docs for latest release branch
    if (isLatest) {
        console.log(`Publish docs for version ${currentVersion} to gh-pages branch test run`)
        // build the docs
        sh.exec('npm run build:docs')

        // release the docs
        sh.exec(
            'npx -y gh-pages --dotfiles --message "[skip ci] Pushing docs to gh-pages" --dist docs'
        )

        // delete docs file
        sh.rm('-rf', 'docs')
    }
}

main()
