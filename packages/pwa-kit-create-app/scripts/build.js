/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const p = require('path')
const sh = require('shelljs')
const fs = require('fs')
const os = require('os')
const tar = require('tar')

sh.set('-e')
sh.config.silent = false

const monorepoRoot = p.resolve(__dirname, '..', '..', '..')
const templatesDir = p.resolve(__dirname, '..', 'templates')

const mkdtempSync = () => fs.mkdtempSync(p.resolve(os.tmpdir(), 'pwa-template-tmp'))

const tarPathForPkg = (pkg) => p.resolve(templatesDir, `${pkg}.tar.gz`)

const main = () => {
    const pkgNames = ['pwa', 'hello-world']

    if (!sh.test('-d', templatesDir)) {
        sh.mkdir('-p', templatesDir)
    }

    sh.rm('-rf', pkgNames.map(tarPathForPkg))

    const tmpDir = mkdtempSync()
    const checkoutDir = p.join(tmpDir, 'mobify-platform-sdks')

    sh.exec(
        `git clone --config core.longpaths=true --single-branch ` +
            `--depth=1 file://${monorepoRoot} ${checkoutDir}`
    )

    return Promise.all(
        pkgNames.map((pkgName) =>
            tar.c(
                {
                    file: tarPathForPkg(pkgName),
                    cwd: p.join(checkoutDir, 'packages')
                },
                [pkgName]
            )
        )
    ).then(() => sh.rm('-rf', tmpDir))
}

main()
