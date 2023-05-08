/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const sh = require('shelljs')

const SDK_PACKAGES = [
    'pwa-kit-react-sdk',
    'pwa-kit-dev',
    'pwa-kit-runtime',
    'commerce-sdk-react-preview'
]

const main = () => {
    const version = process.argv[2]
    SDK_PACKAGES.forEach((pkgName) => {
        // TODO: check first whether the dependency exists
        sh.exec(`npm pkg set devDependencies.${pkgName}=${version}`)
    })
}
main()
