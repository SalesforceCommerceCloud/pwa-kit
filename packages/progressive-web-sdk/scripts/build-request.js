/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

'use strict'

const path = require('path')
const request = require('request')
const Utils = require('./utils')
const URL = require('url').URL

const buildRequest = (options, dataBuffer) => {
    // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

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
