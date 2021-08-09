#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env node */
/* eslint-disable import/no-commonjs */

const exec = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const FileUtils = require('../scripts/file-utils')

const SCRIPT_FILENAME = 'extract-route-regexes.js'

if (!FileUtils.existsSync('app')) {
    console.log('This script must be run in the root directory of a project')
    process.exit(1)
}

if (FileUtils.existsSync(path.join('app', 'app-provider.jsx'))) {
    console.log(
        "We have detected the routing file named 'app/app-provider.jsx'. The SDK now requires that this file be named 'app/router.jsx'"
    )
    process.exit(1)
}

if (!FileUtils.existsSync(path.join('app', 'router.jsx'))) {
    console.log("This script will only read routes from 'app/router.jsx'")
    process.exit(1)
}

const scriptContents = fs.readFileSync(
    path.resolve(__dirname, '..', 'scripts', SCRIPT_FILENAME),
    'utf8'
)

fs.writeFileSync(SCRIPT_FILENAME, scriptContents, 'utf8')

let exitCode = 0
try {
    exec(`cross-env NODE_ENV=production node ${SCRIPT_FILENAME}`)
} catch (e) {
    exitCode = 1
}

rimraf(SCRIPT_FILENAME, () => {
    process.exit(exitCode)
})
