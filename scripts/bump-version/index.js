#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const sh = require('shelljs')
const path = require('path')
const program = require('commander')
const {saveJSONToFile, setPackageVersion} = require('../utils')

// Exit upon error
sh.set('-e')

const rootPath = path.join(__dirname, '..', '..')
const lernaConfigPath = path.join(rootPath, 'lerna.json')

const monorepoPackages = JSON.parse(sh.exec('lerna list --all --json', {silent: true}))
const monorepoPackageNames = monorepoPackages.map((pkg) => pkg.name)

const INDEPENDENT_PACKAGES = ['@salesforce/retail-react-app', '@salesforce/commerce-sdk-react']
const independentPackages = INDEPENDENT_PACKAGES.map((pkgName) =>
    monorepoPackages.find((pkg) => pkg.name === pkgName)
)

/**
 * @param {import('commander').CommanderStatic} program
 */
const main = (program) => {
    const targetVersion = program.args[0]
    if (!targetVersion) {
        program.help()
    }

    const opts = program.opts()
    if (opts.package !== 'sdk') {
        // Assume that we're bumping the version of package that has its own independent version

        const script1 = path.join(__dirname, 'independent-pkg-version.js')
        sh.exec(`node ${script1} ${targetVersion} ${opts.package}`)

        const script2 = path.join(__dirname, 'pwa-kit-deps-version.js')
        const updateDepsBehaviour = /-dev\b/.test(targetVersion) ? 'sync' : 'latest'
        sh.exec(`node ${script2} ${updateDepsBehaviour} ${opts.package}`)

        // After updating the dependencies, let's update the package lock files
        sh.exec('npm install')

        process.exit(0)
    }

    sh.exec(`lerna version --exact --no-push --no-git-tag-version --yes ${targetVersion}`)
    // `--exact` above is for pinning the version of the pwa-kit dependencies
    // https://github.com/lerna/lerna/tree/main/libs/commands/version#--exact

    const lernaConfig = JSON.parse(sh.cat(lernaConfigPath))
    const newMonorepoVersion = lernaConfig.version

    // update versions for root package and root package lock
    setPackageVersion(newMonorepoVersion, {cwd: rootPath})

    independentPackages.forEach((pkg) => {
        const {location, version: oldVersion} = pkg
        // Restore and then increment to the next pre-release version
        // TODO: is it possible to _not_ trigger the lifecycle scripts? See CHANGELOG.md
        setPackageVersion(oldVersion, {cwd: location})
        setPackageVersion('prerelease', {cwd: location})

        const newVersion = JSON.parse(sh.exec('npm pkg get version', {cwd: location, silent: true}))
        pkg.version = newVersion
    })

    // Now that all of the package version updates are done,
    // let's make sure some dependencies' versions are updated accordingly
    monorepoPackages.forEach(({location}) => {
        const pathToPkgJson = path.join(location, 'package.json')
        const pkgJson = JSON.parse(sh.cat(pathToPkgJson))

        updatePeerDeps(pkgJson, newMonorepoVersion)
        updateDeps(pkgJson)

        saveJSONToFile(pkgJson, pathToPkgJson)
    })

    // After updating the dependencies, let's update the package lock files
    sh.exec('npm install')

    sh.echo('\nVersions of packages in the monorepo:\n')
    sh.exec('lerna list --all --long')
}

const updatePeerDeps = (pkgJson, newMonorepoVersion) => {
    const peerDependencies = pkgJson.peerDependencies
    if (!peerDependencies) return

    Object.keys(peerDependencies).forEach((dep) => {
        if (monorepoPackageNames.includes(dep)) {
            console.log(`Found lerna local package ${dep} as a peer dependency of ${pkgJson.name}.`)
            peerDependencies[dep] = newMonorepoVersion
        }
    })
}

const updateDeps = (pkgJson) => {
    independentPackages.forEach((independentPkg) => {
        const newVersion = independentPkg.version

        if (pkgJson.dependencies?.[independentPkg.name]) {
            pkgJson.dependencies[independentPkg.name] = newVersion
        } else if (pkgJson.devDependencies?.[independentPkg.name]) {
            pkgJson.devDependencies[independentPkg.name] = newVersion
        }
    })
}

program.description('Bump the version of a package in our monorepo')
program.arguments('<target-version>')

program.option(
    '-p, --package <package-name>',
    'the package name or an alias to a group of packages',
    'sdk'
)

program.parse(process.argv)
main(program)
