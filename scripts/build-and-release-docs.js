#!/usr/bin/env node
/* eslint-env node */
const sh = require('shelljs')
const semver = require('semver')

const main = () => {
    const {stdout: latestVersion} = sh.exec('npm view pwa-kit-react-sdk version', {silent: true})

    const {stdout: currentVersion} = sh.exec(
        "cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g'"
    )

    sh.exec('npm run build:docs')

    // release the docs
    sh.exec('npx gh-pages --dotfiles --message "[skip ci] Pushing docs to gh-pages" --dist docs')

    // delete docs file
    sh.rm('-rf', 'docs')

    console.log('currentVersion', currentVersion)

    const isPrerelease = semver.prerelease(currentVersion.trim())
    if (isPrerelease) {
        return
    }

    const isLatest = semver.gt(currentVersion, latestVersion)
    // we only want to publish the docs for latest release branch
    if (isLatest) {
        console.log(`Publish docs for version ${currentVersion} to gh-pages branch`)
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
