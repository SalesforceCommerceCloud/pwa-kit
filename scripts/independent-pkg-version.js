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

const {stdout} = sh.exec('lerna list --all --json', {silent: true})
const monorepoPackages = JSON.parse(stdout.toString())

const main = () => {
    const version = process.argv[2]

    // TODO: when bumping the version of retail-react-app, we also need to update other packages that depend on it
    sh.exec(`npm version --no-git-tag ${version}`, {silent: true})

    // TODO
    const pkgName = 'retail-react-app'

    monorepoPackages.forEach(({location}) => {
        const pathToPkgJson = path.join(location, 'package.json')
        const pkgJson = JSON.parse(sh.cat(pathToPkgJson))

        if (pkgJson.dependencies?.[pkgName]) {
            pkgJson.dependencies[pkgName] = version
        }
        if (pkgJson.devDependencies?.[pkgName]) {
            pkgJson.devDependencies[pkgName] = version
        }

        saveJSONToFile(pkgJson, pathToPkgJson)
    })
}

const saveJSONToFile = (json, filePath) => {
    new sh.ShellString(JSON.stringify(json, null, 2)).to(filePath)
}

main()
