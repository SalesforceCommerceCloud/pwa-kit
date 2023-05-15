/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const path = require('path')

const publicPackages = JSON.parse(sh.exec('lerna list --json', {silent: true}))
const independentPackages = JSON.parse(
    sh.cat(path.join(__dirname, '../../..', 'scripts/packages-with-independent-version.json'))
)
const sdkPackages = publicPackages.filter((pkg) => !independentPackages.includes(pkg.name))

const main = () => {
    const version = process.argv[2]

    const pathToPackageJson = path.join(__dirname, '..', 'package.json')
    const pkgJson = JSON.parse(sh.cat(pathToPackageJson))

    sdkPackages.forEach(({name}) => {
        if (pkgJson.dependencies?.[name]) {
            pkgJson.dependencies[name] = version
        }
        if (pkgJson.devDependencies?.[name]) {
            pkgJson.devDependencies[name] = version
        }
    })

    saveJSONToFile(pkgJson, pathToPackageJson)
}

const saveJSONToFile = (json, filePath) => {
    new sh.ShellString(JSON.stringify(json, null, 2)).to(filePath)
}

main()
