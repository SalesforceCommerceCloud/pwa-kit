/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict'

const path = require('path')
const request = require('request')
const Utils = require('./utils')
const URL = require('url').URL

const buildRequest = (options, dataBuffer) => {
    // e.g. https://cloud.mobify.com/api/projects/progressive-web/builds/
    /* eslint-disable prefer-template */
    const pathname = path.posix.join(
        'api',
        'projects',
        options.projectSlug,
        'builds',
        options.target || '',
        '/'
    )
    const uri = new URL(pathname, options.origin)

    /* eslint-enable prefer-template */
    const headers = Utils.getRequestHeaders({'Content-Length': options.dataLength})

    const requestOptions = {
        uri,
        method: 'POST',
        auth: {
            user: options.username,
            pass: options.api_key
        },
        headers
    }

    return new Promise((resolve) => {
        request(requestOptions, (error, response, body) => {
            if (error || (error = Utils.errorForStatus(response))) {
                let message
                if (error.code === 'ECONNREFUSED') {
                    message =
                        `Unable to connect to ${options.origin}.` +
                        `Check your connection and try again.\n` +
                        `For more information visit ${Utils.DEFAULT_DOCS_URL}'.`
                } else {
                    message = error.message
                }

                Utils.fail(message)
            }

            resolve(body)
        }).end(dataBuffer)
    })
        .then((body) => JSON.parse(body))
        .catch((e) => Utils.fail(e))
}

module.exports = buildRequest
