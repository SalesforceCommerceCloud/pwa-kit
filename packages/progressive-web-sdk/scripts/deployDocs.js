#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
const process = require('process')
const spawnSync = require('cross-spawn').sync
const pkg = require('../package.json')
const path = require('path')

const envs = ['testing', 'staging', 'production']
const env = process.argv[2]

if (envs.indexOf(env) < 0) {
    console.log(`Unsupported env '${env}'`)
    process.exit(1)
} else {
    spawnSync(
        path.resolve('node_modules', '.bin', 'mobify-docs'),
        [
            'deploy',
            path.relative(process.cwd(), path.resolve('docs', 'public', 'latest')),
            '--project',
            'progressive-web',
            '--version_num',
            pkg.version,
            '--env',
            env
        ],
        {stdio: [0, 1, 2]}
    )
}
