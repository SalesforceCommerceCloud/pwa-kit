#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict'

const sh = require('shelljs')
const common = require('shelljs/src/common')
const path = require('path')
const Utils = require('../scripts/utils.js')

const ShellString = common.ShellString

const webpack = path.join('node_modules', '.bin', 'webpack')

sh.set('-e')
sh.config.silent = true

const config = Utils.getConfig() || {}
const pkg = JSON.parse(sh.cat('package.json'))

// These are the libs that don't get compiled into ssr.js using webpack.
const allDependencies = {
    ...(pkg.devDependencies || {}),
    ...(pkg.dependencies || {})
}

// NOTE: We need to update this to include the values from the config file.
const deps = ['express', ...(config.externals || [])]
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
