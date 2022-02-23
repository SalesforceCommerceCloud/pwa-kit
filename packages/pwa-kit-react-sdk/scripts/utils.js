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


Utils.errorForStatus = (response) => {
    const status = response.statusCode

    if (status < 400) {
        return false
    }

    let error
    try {
        error = JSON.parse(response.body)
    } catch (err) {
        // We set this to an empty object to resolve issues where response.body
        // is not a JSON or properly-formatted JSON object
        // e.g. response.body === 'Unauthorized'
        error = {}
    }

    return new Error(
        [
            `HTTP ${status}`,
            error.message || response.body,
            `For more information visit ${error.docs_url || DEFAULT_DOCS_URL}$`
        ].join('\n')
    )
}

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

Utils.readCredentials = (filepath) => {
    return Utils.exists(filepath)
        .catch(
            /* istanbul ignore next */ () =>
                Utils.fail(
                    `Credentials file "${filepath}" not found.\n` +
                        'Visit https://runtime.commercecloud.com/account/settings for ' +
                        'steps on authorizing your computer to push bundles.'
                )
        )
        .then(() => fileUtils.readFileAsync(filepath))
        .then((creds) => {
            creds = JSON.parse(creds)

            return {
                username: creds.username,
                api_key: creds.api_key
            }
        })
        .catch(
            /* istanbul ignore next */ (e) =>
                Utils.fail(`Error parsing "${filepath}".\n` + `[${e}]`)
        )
}

Utils.delayedPromise = (value, delay) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(value), delay)
    })
}

Utils.handleRequestError = (error) => {
    throw new Error(error.message)
}

Utils.requestErrorMessage = {
    code401: 'Invalid api_key.',
    code403:
        'You do not have permission to perform this actions.\nPlease double check your command to make sure the option values are correct.', //  wrong project name.
    code404:
        'Resource not found.\nPlease double check your command to make sure the option values are correct.', // wrong target name
    code500: 'Internal Server Error. Please report this to Salesforce support team.'
}

module.exports = Utils
