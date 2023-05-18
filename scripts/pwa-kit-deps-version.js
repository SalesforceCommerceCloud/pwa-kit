/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const path = require('path')
const {saveJSONToFile} = require('./utils')

const {stdout} = sh.exec('lerna list --all --json', {silent: true})
const monorepoPackages = JSON.parse(stdout.toString())

// Assuming that this is run within a specific package,
// the script would update the version of all its pwa-kit/sdk dependencies.
const main = () => {
    // option = latest OR sync
    const option = process.argv[2]

    const pathToPackageJson = path.join(process.cwd(), 'package.json')
    const pkgJson = JSON.parse(sh.cat(pathToPackageJson))

    if (option === 'latest') {
        monorepoPackages.forEach(({name}) => {
            if (pkgJson.dependencies?.[name]) {
                pkgJson.dependencies[name] = getLatestVersion(name)
            } else if (pkgJson.devDependencies?.[name]) {
                pkgJson.devDependencies[name] = getLatestVersion(name)
            }
        })
    } else if (option === 'sync') {
        // Sync version with what's in the monorepo
        monorepoPackages.forEach(({version, name}) => {
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
