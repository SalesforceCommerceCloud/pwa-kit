/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const p = require('path')
const sh = require('shelljs')
const fs = require('fs')
const os = require('os')
const tar = require('tar')

sh.set('-e')
sh.config.silent = false

const TEMPLATE_PREFIX = 'template-'

const monorepoRoot = p.resolve(__dirname, '..', '..', '..')
const templatesDir = p.resolve(__dirname, '..', 'templates')

const mkdtempSync = () => fs.mkdtempSync(p.resolve(os.tmpdir(), 'pwa-template-tmp'))

const tarPathForPkg = (pkg) => p.resolve(templatesDir, `${pkg}.tar.gz`)

const main = () => {
    const pkgNames = [
        'retail-react-app',
        'express-minimal',
        'typescript-minimal',
        'mrt-reference-app'
    ]

    if (!sh.test('-d', templatesDir)) {
        sh.mkdir('-p', templatesDir)
    }

    sh.rm('-rf', pkgNames.map(tarPathForPkg))

    const tmpDir = mkdtempSync()
    const checkoutDir = p.join(tmpDir, 'mobify-platform-sdks')
    const packageDir = p.join(checkoutDir, 'packages')

    sh.exec(
        `git clone --config core.longpaths=true --single-branch ` +
            `--depth=1 file://${monorepoRoot} ${checkoutDir}`
    )

    return Promise.all(
        pkgNames.map((pkgName) => {
            // Emulate an NPM package by having the tar contain a "package" folder.
            const tmpPackageDir = mkdtempSync()
            sh.mv(
                p.join(packageDir, `${TEMPLATE_PREFIX}${pkgName}`),
                p.join(tmpPackageDir, 'package')
            )

            return tar
                .c(
                    {
                        file: tarPathForPkg(pkgName),
                        cwd: tmpPackageDir
                    },
                    ['.']
                )
                .then(() => sh.rm('-rf', tmpPackageDir))
        })
    ).then(() => sh.rm('-rf', tmpDir))
}

main()
