/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable strict */
'use strict'

const fileUtils = require('./file-utils')

const SDK_VERSION = require('../package.json').version
const DEFAULT_DOCS_URL = 'http://sfdc.co/pwa-kit'

const Utils = {}


Utils.exists = fileUtils.statAsync

/* istanbul ignore next */
Utils.fail = (errorMessage) => {
    console.error(errorMessage)
    process.exit(1)
}

Utils.getRequestHeaders = (additionalHeaders) =>
    Object.assign({'User-Agent': `progressive-web-sdk#${SDK_VERSION}`}, additionalHeaders)

/* istanbul ignore next */
Utils.getSettingsPath = () =>
    `${process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME}/.mobify`

Utils.delayedPromise = (value, delay) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(value), delay)
    })
}

Utils.handleRequestError = (error) => {
    throw new Error(error.message)
}

module.exports = Utils
