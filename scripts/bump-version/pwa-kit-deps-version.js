/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const sh = require('shelljs')
const path = require('path')
const {saveJSONToFile} = require('../utils')

// Exit upon error
sh.set('-e')

const publicPackages = JSON.parse(sh.exec('lerna list --json', {silent: true}))

const pathToPackage = (packageName) => {
    const pkg = publicPackages.find((pkg) => pkg.name === packageName)
    return pkg?.location
}

// Assuming that this is run within a specific package,
// the script would update its pwa-kit/sdk dependencies.
const main = () => {
    const updateBehaviour = process.argv[2]
    const packageName = process.argv[3]

    const pathToPackageJson = path.join(pathToPackage(packageName), 'package.json')
    const pkgJson = JSON.parse(sh.cat(pathToPackageJson))

    if (updateBehaviour === 'latest') {
        publicPackages.forEach(({name}) => {
            if (pkgJson.dependencies?.[name]) {
                pkgJson.dependencies[name] = getLatestVersion(name)
            } else if (pkgJson.devDependencies?.[name]) {
                pkgJson.devDependencies[name] = getLatestVersion(name)
            }
        })
    } else if (updateBehaviour === 'sync') {
        // Sync version with what's in the monorepo
        publicPackages.forEach(({version, name}) => {
            if (pkgJson.dependencies?.[name]) {
                pkgJson.dependencies[name] = version
            } else if (pkgJson.devDependencies?.[name]) {
                pkgJson.devDependencies[name] = version
            }
        })
    }

    saveJSONToFile(pkgJson, pathToPackageJson)
}

const getLatestVersion = (pkgName) => {
    return sh.exec(`npm info ${pkgName}@latest version`, {silent: true}).trim()
}

main()
