/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')
const path = require('path')

const SDK_PACKAGES = [
    'pwa-kit-react-sdk',
    'pwa-kit-dev',
    'pwa-kit-runtime',
    'commerce-sdk-react-preview'
]

const main = () => {
    setPackageVersion(process.argv[2])

    // Downgrade SDK dependencies to @latest version
    const {stdout: latestVersion} = sh.exec(`npm info ${SDK_PACKAGES[0]}@latest version`, {
        silent: true
    })
    SDK_PACKAGES.forEach((pkgName) => {
        // TODO: check first whether the dependency exists
        sh.exec(`npm pkg set devDependencies.${pkgName}=${latestVersion}`)
    })
}

const setPackageVersion = (version, shellOptions = {}) => {
    sh.exec(`npm version --no-git-tag ${version}`, {silent: true, ...shellOptions})
}

main()
