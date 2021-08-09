#!/usr/bin/env node
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

'use strict'

const sh = require('shelljs')
const common = require('shelljs/src/common')
const path = require('path')

const ShellString = common.ShellString

const webpack = path.join('node_modules', '.bin', 'webpack')

sh.set('-e')
sh.config.silent = true

const pkg = JSON.parse(sh.cat('package.json'))

// These are the libs that don't get compiled into ssr.js using webpack.
const mobifyConfig = pkg.mobify || {}
const allDependencies = {
    ...(pkg.devDependencies || {}),
    ...(pkg.dependencies || {})
}

const deps = ['express', ...(mobifyConfig.externals || [])]
    .map((lib) => ({
        lib: lib,
        version: allDependencies[lib]
    }))
    .filter(({version}) => !!version)
    .map(({lib, version}) => `${lib}@${version}`)

sh.rm('-rf', 'build')

sh.exec(`${webpack} --bail`)

ShellString(
    JSON.stringify({
        name: 'build',
        version: '0.0.1',
        description: 'build',
        license: 'UNLICENSED'
    })
).to('build/package.json')

sh.exec(`npm install --prefix build --no-save ${deps.join(' ')}`)

sh.rm(`build/package.json`)

sh.echo('Built successfully')
