#!/usr/bin/env node
/* eslint-env node */

const spawnSync = require('cross-spawn').sync

const spawn = (cmd, args) => {
    const proc = spawnSync(cmd, args, {stdio: 'inherit'})
    if (proc.status !== 0) {
        throw new Error()
    }
    return proc
}

const main = () => {
    spawn('lerna', ['version', '--no-push', '--no-git-tag-version'].concat(process.argv.slice(2)))
    spawn('npm', ['install'])
}

main()
