/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const Utils = require('./utils')
const buildRequest = require('./build-request')

const ARCHIVE = 'build.tar'
const DEFAULT_ORIGIN = process.env.CLOUD_API_BASE || 'https://cloud.mobify.com'

const OPTION_DEFAULTS = {
    buildDirectory: 'build',
    settingsFile: Utils.getSettingsPath(),
    origin: DEFAULT_ORIGIN,
    target: '',
    message: Utils.setDefaultMessage()
}

const isEmptyOptions = (options) => {
    return (
        typeof options === 'undefined' ||
        typeof options.projectSlug === 'undefined' ||
        options.projectSlug.length === 0
    )
}

const upload = (options) => {
    const dataBufferPromise = Utils.buildObject(ARCHIVE, options).then((buildObj) => {
        const buildJSON = JSON.stringify(buildObj, null, 4)
        return new Buffer(buildJSON)
    })

    const credentialsPromise = Utils.readCredentials(options.settingsFile)

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

            console.log(`Beginning upload to ${options.origin}...`)
            return buildRequest(requestOptions, dataBuffer)
        })
        .then((data) => {
            console.log('Bundle Uploaded!')
            console.log(`Link to preview the bundle: ${data.bundle_preview_url}`)
        })
}

const uploadBundle = (customOptions) => {
    if (isEmptyOptions(customOptions)) {
        Utils.fail('[Error: You must provide a Mobify Cloud project slug to upload a bundle.]')
    }

    const options = Object.assign(OPTION_DEFAULTS, customOptions)

    // Create bundle will generate the archive file and return an updated
    // options object
    return Utils.createBundle(options, ARCHIVE).then((updatedOptions) => {
        return Utils.exists(ARCHIVE).then(() => upload(updatedOptions))
    })
}

module.exports = uploadBundle
