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

sh.set('-e')
sh.config.silent = false

const monorepoRoot = p.resolve(__dirname, '..', '..', '..')
const templatePath = p.resolve(__dirname, '..', 'template')

const mkdtempSync = () => fs.mkdtempSync(p.resolve(os.tmpdir(), 'pwa-template-tmp'))

const main = () => {
    sh.rm('-rf', templatePath)

    const tmpDir = mkdtempSync()
    const checkoutDir = p.join(tmpDir, 'mobify-platform-sdks')

    sh.exec(
        `git clone --config core.longpaths=true --single-branch ` +
            `--depth=1 file://${monorepoRoot} ${checkoutDir}`
    )

    sh.cp('-R', p.join(checkoutDir, 'packages', 'pwa'), templatePath)
    sh.rm('-rf', tmpDir)
}

main()
