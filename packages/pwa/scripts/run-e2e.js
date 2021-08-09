#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
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
