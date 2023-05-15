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

const lernaConfigPath = path.join(__dirname, '..', 'lerna.json')
const rootPath = path.join(__dirname, '..')

const INDEPENDENT_PACKAGES = JSON.parse(sh.cat(path.join(__dirname, 'packages-with-independent-version.json')))

const {stdout} = sh.exec('lerna list --all --json', {silent: true})
const monorepoPackages = JSON.parse(stdout.toString())
const independentPackages = INDEPENDENT_PACKAGES.map((pkgName) => monorepoPackages.find((pkg) => pkg.name === pkgName))

const main = () => {
    // TODO: during our release process, it looks like we should be tagging with annotated tags:
    // https://lerna.js.org/docs/troubleshooting#publish-does-not-detect-manually-created-tags-in-fixed-mode-with-githubgithub-enterprise
    sh.exec(`lerna version --exact --no-push --no-git-tag-version --yes ${process.argv.slice(2).join(' ')}`)

    // TODO: is this really necessary? Well, it does cause some bootstrapping to happen, plus other lifecycle scripts
    // sh.exec(`npm install`)

    const lernaConfig = JSON.parse(sh.cat(lernaConfigPath))
    const newVersion = lernaConfig.version

    const packageNames = monorepoPackages.map((pkg) => pkg.name)

    monorepoPackages.forEach(({location}) => {
        const pathToPkgJson = path.join(location, 'package.json')
        const pkgJson = JSON.parse(sh.cat(pathToPkgJson))
        const peerDependencies = pkgJson.peerDependencies

        if (!peerDependencies) return

        Object.keys(peerDependencies).forEach((dep) => {
            if (packageNames.includes(dep)) {
                console.log(`Found lerna local package ${dep} as a peer dependency of ${pkgJson.name}.`)
                peerDependencies[dep] = `^${newVersion}`
            }
        })
        saveJSONToFile(pkgJson, pathToPkgJson)

        // !!!
        // TODO: some packages (see my-extended-retail-app) may depend on the packages listed in the ignoreList. 
        // We'll need to make sure those packages have the correct dependency version.
    })

    // update versions for root package and root package lock
    setPackageVersion(newVersion, {cwd: rootPath})

    independentPackages.forEach(({location, version: oldVersion}) => {
        // Restore and then increment to the next pre-release version
        setPackageVersion(oldVersion, {cwd: location})
        setPackageVersion('prerelease', {cwd: location})
    })

    sh.echo('\nVersions of packages in the monorepo:')
    sh.exec('lerna list --all --long')
}

const saveJSONToFile = (json, filePath) => {
    new sh.ShellString(JSON.stringify(json, null, 2)).to(filePath)
}

const setPackageVersion = (version, shellOptions = {}) => {
    sh.exec(`npm version --no-git-tag ${version}`, {silent: true, ...shellOptions})
}

main()
