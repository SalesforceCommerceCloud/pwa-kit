#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const path = require('path')
const {saveJSONToFile, setPackageVersion} = require('./utils')

// Exit upon error
sh.set('-e')

const {stdout} = sh.exec('lerna list --all --json', {silent: true})
const monorepoPackages = JSON.parse(stdout.toString())

const main = () => {
    const version = process.argv[2]
    setPackageVersion(version)

    const pkgName = JSON.parse(sh.exec('npm pkg get name', {silent: true}))
    const otherPackages = monorepoPackages.filter((pkg) => pkg.name !== pkgName)

    otherPackages.forEach(({location}) => {
        const pathToPkgJson = path.join(location, 'package.json')
        const pkgJson = JSON.parse(sh.cat(pathToPkgJson))

        if (pkgJson.dependencies?.[pkgName]) {
            pkgJson.dependencies[pkgName] = version
        } else if (pkgJson.devDependencies?.[pkgName]) {
            pkgJson.devDependencies[pkgName] = version
        }

        saveJSONToFile(pkgJson, pathToPkgJson)
    })
}

main()
