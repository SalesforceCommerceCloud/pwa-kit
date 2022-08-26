#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Update Change Log heading
const pkg = require('../package.json')
const path = require('path')
const os = require('os')
const fs = require('fs')

const date = new Date()
    .toString()
    .split(' ')
    .slice(1, 4)
const heading = `## v${pkg.version} (${date[0]} ${date[1]}, ${date[2]})\n`

const changelog = path.resolve(os.tmpdir(), 'CHANGELOG.md')

fs.writeFileSync(changelog, heading, 'utf8')
fs.appendFileSync(changelog, fs.readFileSync('CHANGELOG.md'), 'utf8')
fs.copyFileSync(changelog, 'CHANGELOG.md')
