/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const Utils = require('./utils')
const buildRequest = require('./build-request')

const ARCHIVE = 'build.tar'

const isEmptyOptions = (options) => {
    return (
        typeof options === 'undefined' ||
        typeof options.projectSlug === 'undefined' ||
        options.projectSlug.length === 0 ||
        typeof options.origin === 'undefined' ||
        options.origin.length === 0
    )
}

const upload = (options) => {
    const dataBufferPromise = Utils.buildObject(ARCHIVE, options).then((buildObj) => {
        const buildJSON = JSON.stringify(buildObj, null, 4)
        return Buffer.from(buildJSON)
    })

    const credentialsPromise = Utils.readCredentials(options.credentialsFile)

    return Promise.all([dataBufferPromise, credentialsPromise])
        .then((values) => {
            const dataBuffer = values[0]
            const credentials = values[1]

            const requestOptions = {
                username: credentials.username,
                api_key: credentials.api_key,
                body: dataBuffer,
                dataLength: dataBuffer.length,
                origin: options.origin,
                projectSlug: options.projectSlug,
                target: options.target
            }

            console.log(`Beginning upload to ${options.origin}`)
            return buildRequest(requestOptions, dataBuffer)
        })
        .then(() => {
            console.log('Bundle Uploaded!')
        })
}

const uploadBundle = (opts) => {
    if (isEmptyOptions(opts)) {
        Utils.fail(
            '[Error: You must provide a Managed Runtime project slug and Cloud origin to upload a bundle.]'
        )
    }

    const defaults = {
        buildDirectory: 'build',
        credentialsFile: Utils.getCredentialsFile(),
        target: '',
        message: Utils.setDefaultMessage()
    }

    const options = Object.assign({}, defaults, opts)

    // Create bundle will generate the archive file and return an updated
    // options object
    return Utils.createBundle(options, ARCHIVE).then((updatedOptions) => {
        return Utils.exists(ARCHIVE).then(() => upload(updatedOptions))
    })
}

module.exports = uploadBundle
