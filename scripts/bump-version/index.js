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

const INDEPENDENT_PACKAGES = [
    '@salesforce/retail-react-app',
    '@salesforce/commerce-sdk-react',
    '@salesforce/extension-chakra-storefront',
    '@salesforce/extension-chakra-store-locator',
    '@salesforce/extension-starter'
]
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
    const packageName = opts.package
    const isIndependentBump = opts.package !== 'sdk'

    if (isIndependentBump) {
        // Assume that we're bumping the version of package that has its own independent version
        const script1 = path.join(__dirname, 'independent-pkg-version.js')
        sh.exec(`node ${script1} ${targetVersion} ${packageName}`)

        const script2 = path.join(__dirname, 'pwa-kit-deps-version.js')
        const updateDepsBehaviour = opts.pwaKitDeps
        sh.exec(`node ${script2} ${updateDepsBehaviour} ${packageName}`)

        // Update peerDependencies across all packages
        updatePeerDeps(packageName, targetVersion, true)

        // After updating the dependencies, let's update the package lock files
        sh.exec('npm install')

        listAllVersions()

        process.exit(0)
    }

    // Handle non-independent package version bump
    sh.exec(`lerna version --exact --no-push --no-git-tag-version --yes ${targetVersion}`)
    // `--exact` above is for pinning the version of the pwa-kit dependencies
    // https://github.com/lerna/lerna/tree/main/libs/commands/version#--exact

    const lernaConfig = JSON.parse(sh.cat(lernaConfigPath))
    const newMonorepoVersion = lernaConfig.version

    // update versions for root package and root package lock
    setPackageVersion(newMonorepoVersion, {cwd: rootPath})

    // Restore independent package versions
    independentPackages.forEach((pkg) => {
        const {location, version: oldVersion} = pkg
        // TODO: is it possible to _not_ trigger the lifecycle scripts? See commerce-sdk-react/CHANGELOG.md
        setPackageVersion(oldVersion, {cwd: location})
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

    listAllVersions()
}

/**
 * Updates the peerDependencies of monorepo packages to the specified version in all packages.
 * If updating an independent package version, only updates its references in all packages.
 *
 * @param {string|Object} pkgJsonOrPackageName - Package JSON object or package name to update.
 * @param {string} newVersion - The target version to set.
 * @param {boolean} [isIndependent=false] - Whether the update is for an independent package.
 */
const updatePeerDeps = (pkgJsonOrPackageName, newVersion, isIndependent = false) => {
    monorepoPackages.forEach(({location}) => {
        const pathToPkgJson = path.join(location, 'package.json')
        const pkgJson = JSON.parse(sh.cat(pathToPkgJson))
        const peerDependencies = pkgJson.peerDependencies || {}

        if (isIndependent) {
            if (peerDependencies[pkgJsonOrPackageName]) {
                console.log(`Updating ${pkgJsonOrPackageName} peerDependency in ${pkgJson.name} to ${newVersion}`)
                peerDependencies[pkgJsonOrPackageName] = newVersion
                saveJSONToFile(pkgJson, pathToPkgJson)
            }
        } else {
            Object.keys(peerDependencies).forEach((dep) => {
                if (monorepoPackageNames.includes(dep)) {
                    console.log(`Updating ${dep} peerDependency in ${pkgJson.name} to ${newVersion}`)
                    peerDependencies[dep] = newVersion
                }
            })
        }
    })
}

/**
 * Updates the dependencies of a package to match the versions of independent packages.
 *
 * @param {Object} pkgJson - The package.json object to update.
 */
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

const listAllVersions = () => {
    sh.echo('\nVersions of packages in the monorepo:\n')
    sh.exec('lerna list --all --long')
}

program.description('Bump the version of a package in our monorepo')
program.arguments('<target-version>')

program
    .option(
        '-p, --package <package-name>',
        'the package name or an alias to a group of packages',
        'sdk'
    )
    .addOption(
        new program.Option(
            '-d, --pwa-kit-deps <update-behavior>',
            'for non-sdk packages, choose how to update their pwa-kit dependencies: either sync with repo or grab @latest from npm'
        )
            .choices(['sync', 'latest'])
            .default('sync')
    )

program.parse(process.argv)
main(program)
