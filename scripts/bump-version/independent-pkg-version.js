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
const {saveJSONToFile, setPackageVersion} = require('../utils')

// Exit upon error
sh.set('-e')

const monorepoPackages = JSON.parse(sh.exec('lerna list --all --json', {silent: true}))

const pathToPackage = (packageName) => {
    const pkg = monorepoPackages.find((pkg) => pkg.name === packageName)
    return pkg?.location
}

// Meant for setting the version of a package that has its own independent version
const main = () => {
    const version = process.argv[2]
    const pkgName = process.argv[3]
    const otherPackages = monorepoPackages.filter((pkg) => pkg.name !== pkgName)

    setPackageVersion(version, {cwd: pathToPackage(pkgName)})

    // Update other packages who depend on the current package
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
