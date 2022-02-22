/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env node */

// For more information on these settings, see https://webpack.js.org/configuration
const fs = require('fs')
const path = require('path')

const projectDir = process.cwd()
const projectWebpackPath = path.resolve(projectDir, 'webpack.config.js')

if (fs.existsSync(projectWebpackPath)) {
    module.exports = require(projectWebpackPath)
} else {
    module.exports = require('./base-config.js')
}
