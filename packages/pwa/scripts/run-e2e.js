#!/usr/bin/env node

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
