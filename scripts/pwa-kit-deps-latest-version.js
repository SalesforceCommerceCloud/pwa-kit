/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const path = require('path')
const {saveJSONToFile} = require('./utils')

// const publicPackages = JSON.parse(sh.exec('lerna list --json', {silent: true}))
// const independentPackages = JSON.parse(
//     sh.cat(path.join(__dirname, 'packages-with-independent-version.json'))
// )
// const packagesWithFixedVersion = publicPackages.filter(
//     (pkg) => !independentPackages.includes(pkg.name)
// )

const {stdout} = sh.exec('lerna list --all --json', {silent: true})
const monorepoPackages = JSON.parse(stdout.toString())

// Assuming that this is run within a specific package,
// the script would update the version of all its pwa-kit/sdk dependencies.
const main = () => {
    // const version = process.argv[2]

    const pathToPackageJson = path.join(process.cwd(), 'package.json')
    const pkgJson = JSON.parse(sh.cat(pathToPackageJson))

    // TODO
    monorepoPackages.forEach(({name}) => {
        if (pkgJson.dependencies?.[name]) {
            pkgJson.dependencies[name] = getLatestVersion(name)
        } else if (pkgJson.devDependencies?.[name]) {
            pkgJson.devDependencies[name] = getLatestVersion(name)
        }
    })

    // packagesWithFixedVersion.forEach(({name}) => {
    //     if (pkgJson.dependencies?.[name]) {
    //         pkgJson.dependencies[name] = version
    //     }
    //     if (pkgJson.devDependencies?.[name]) {
    //         pkgJson.devDependencies[name] = version
    //     }
    // })

    saveJSONToFile(pkgJson, pathToPackageJson)
}

const getLatestVersion = (pkgName) => {
    return sh.exec(`npm info ${pkgName}@latest version`, {silent: true}).trim()
    // return version
}

main()
