#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const utils = require('./utils')
const spawnSync = require('cross-spawn').sync

const main = () => {
    return utils
        .withSSRServer(() => {
            const proc = spawnSync('npm', ['run', 'test:e2e'], {stdio: 'inherit'})
            return proc.status !== 0 ? Promise.reject() : Promise.resolve()
        })
        .catch(() => {
            process.exit(1)
        })
}

main()
