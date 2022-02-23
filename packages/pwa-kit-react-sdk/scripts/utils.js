/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable strict */
'use strict'

const fileUtils = require('./file-utils')
const Utils = {}

Utils.exists = fileUtils.statAsync

/* istanbul ignore next */
Utils.fail = (errorMessage) => {
    console.error(errorMessage)
    process.exit(1)
}

module.exports = Utils
