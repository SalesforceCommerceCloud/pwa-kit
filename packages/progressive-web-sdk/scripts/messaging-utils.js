/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
'use strict'

const archiver = require('archiver')
const fs = require('fs')
const request = require('request')
const tmp = require('tmp')

const Utils = require('./utils.js')

const MessagingUtils = {}

const POST = 'POST'

/**
 * Make a Request as a Promise
 * @param {Object} requestOptions - passed to Request
 * @returns {Promise.<*>} that resolves when the request is complete,
 * or rejects with an Error.
 */
const makeRequest = (requestOptions) => {
    return new Promise((resolve, reject) => {
        request(requestOptions, (error, response, body) => {
            if (error) {
                Utils.fail(
                    `[Error: unable to make ${requestOptions.method} request to ${requestOptions.uri}: ${error}]`
                )
                reject(error)
            }

            if (response.statusCode === 200 || response.statusCode === 201) {
                resolve(body)
            } else {
                const msg = `[Error: unexpected response for ${requestOptions.method} request to ${requestOptions.uri}: status ${response.statusCode}, ${body}]`
                Utils.fail(msg)
                reject(new Error(msg))
            }
        })
    })
}

/**
 * Most of the Messaging V2 API endpoints return a standard JSON
 * object that may contain an error_code and error (message). If the
 * given response object contains those, then they are logged via
 * Utils.fail, which terminates the process. Otherwise the
 * function returns the response.
 *
 * To support testing, in which Utils.fail does not exit, this
 * will also throw an error.
 *
 * @param {Object} response - a parsed V2 API JSON response object
 */
const handleV2APIResponse = (response) => {
    if (response.error_code) {
        const msg = `[Error] code ${response.error_code}: ${response.error}`
        Utils.fail(msg)
        throw new Error(msg)
    }
    return response
}

/**
 * Wrapper for makeRequest that will JSONify the body of the request
 * and set the appropriate headers, then parse and return the JSON
 * response parsed into a JS object.
 */
const makeV2APIRequest = (requestOptions) => {
    const jsonBody = JSON.stringify(requestOptions.body)

    const headers = Utils.getRequestHeaders({
        'Content-Type': 'application/json',
        'Content-Length': jsonBody.length
    })

    const extendedOptions = Object.assign({}, requestOptions, {
        headers,
        body: jsonBody
    })

    return makeRequest(extendedOptions)
        .then(JSON.parse)
        .then(handleV2APIResponse)
}

/**
 * POST a gzipped-tar payload to the Messaging backend.
 * @param {Object} options - full set of options for the 'upload' command
 * @param {string} options.messagingHost - scheme and hostname for Messaging backend
 * @param {string} options.contentType - type of content to POST to backend
 * @param {string|Buffer} options.data - data to POST to backend
 * @param {string} options.messagingSiteId - messaging site identifier
 * @param {Object} options.credentials - Cloud credentials
 * @returns Promise resolving to the decoded JSON response
 */
MessagingUtils.uploadToBackend = (options) => {
    const data = options.data

    const headers = Utils.getRequestHeaders({
        'Content-Type': options.contentType,
        'Content-Length': data.length
    })

    const host = options.messagingHost || 'https://webpush.mobify.net'
    const uri = `${host}/api/v2/sites/${options.messagingSiteId}/`

    const requestOptions = {
        uri,
        method: POST,
        auth: {
            user: options.credentials.username,
            pass: options.credentials.api_key
        },
        headers,
        body: data
    }

    console.log(`Beginning upload of ${data.length} bytes to ${uri}...`)
    return makeRequest(requestOptions).then(JSON.parse)
}

/**
 * Build a zipped tar archive of the contents of the given path.
 *
 * @param {Object} options - full set of options for the 'upload' command
 * @param {string} options.messagingPath - path to messaging directory
 * @returns Promise that resolves to a copy of the input options with
 * contentType and data members added.
 */
MessagingUtils.buildUploadPayload = (options) => {
    return new Promise((resolve, reject) => {
        // Stream to a temporary file
        const archiveFile = tmp.fileSync()
        const archiveStream = fs.createWriteStream(archiveFile.name, {
            flags: 'w',
            fd: archiveFile.fd
        })

        const onError = (err) => {
            console.log(`[Error building archive: ${err}]`)

            // Close the archive stream (ignoring errors)
            try {
                archiveStream.end()
            } catch (e) {
                // Ignore
            }

            // Remove the temporary file (ignoring errors)
            try {
                archiveFile.removeCallback()
            } catch (e) {
                // Ignore
            }

            reject(err)
        }

        // We want a gzipped tar dump, with maximum compression to
        // reduce the network payload.
        const archive = archiver('tar', {
            gzip: true,
            gzipOptions: {
                level: 9
            }
        })

        // Any failure means we reject, closing and removing the
        // archive file
        archive.on('error', onError)
        archive.pipe(archiveStream)
        archive.on('close', archiveStream.end)

        // Logging
        archive.on('entry', (entry) => {
            console.log(`Adding file ${entry.name}`)
        })

        // Resolve on stream write completion
        archiveStream.on('close', () => {
            let data
            try {
                data = fs.readFileSync(archiveFile.name)
            } catch (err) {
                onError(err)
            }
            const optionsWithData = Object.assign({}, options, {
                // There are multiple known content-types for
                // a gzipped tar file. This one is understood
                // by the Messaging backend.
                contentType: 'application/tar+gzip',
                data
            })

            // We can now remove the archive file
            archiveFile.removeCallback()

            resolve(optionsWithData)
        })

        // add all the files in the given path
        const path = options.messagingPath
        const messagingPath = path.endsWith('/') ? path : `${path}/`

        console.log(`buildPayload: adding all files in ${messagingPath}`)
        archive.directory(messagingPath, '')

        archive.finalize()
    })
}

/**
 * Given a value that may be a single string or an array, log to
 * console, each one preceded by the given prefix.
 * @param {String|Array.<String>} value - message or array to be logged
 * @param {String} prefix - type of message(s) - info, error, etc
 */
const logStringOrArray = (value, prefix) => {
    if (!value) {
        return
    }

    const values = typeof value === 'string' ? [value] : value
    for (const v of values) {
        console.log(`[${prefix}] ${v}`)
    }
}

/**
 * Read and return the Cloud credentials
 * @param {Object} options - options for any Messaging command
 * @returns Promise that resolves to the input options
 * with the credentials member set.
 */
const getCredentials = (options) => {
    return Utils.readCredentials(Utils.getSettingsPath()).then((credentials) => {
        options.credentials = credentials
        return options
    })
}

/**
 * Upload the contents of the messaging directory to the Messaging
 * server, to configure Messaging for this project.
 *
 * Any info, warning or error messages from the upload are dumped to
 * the console.
 *
 * @param {Object} options - options for the 'upload' command
 * @returns a Promise that resolves when the upload is complete. If an
 * error occurs, Utils.fail is called to log the error and exit the process.
 */
MessagingUtils.uploadConfig = (options) => {
    // Build and post the zipped archive
    return getCredentials(options)
        .then(MessagingUtils.buildUploadPayload)
        .then(MessagingUtils.uploadToBackend)
        .then((response) => {
            // The response contains a developer-readable
            // set of messages in info/warning/error, which
            // may be a single string or an array
            logStringOrArray(response.info, 'Info')
            logStringOrArray(response.warning, 'Warning')
            logStringOrArray(response.error, 'Error')
        })
        .catch(Utils.fail)
}

/**
 * Request a CSR from the Messaging backend. Save the resulting certificate
 * request file in the messaging directory, and give the user instructions
 * on what to do next.
 *
 * @param {Object} options - options for the 'certificate' command
 * @returns a Promise that resolves when the certificate request has been
 * downloaded and saved. If an error occurs, Utils.fail is called to log the
 * error and exit the process.
 */
MessagingUtils.generateCSR = (options) => {
    const appId = options.siteConfig.apn_app_id
    const certName = options.siteConfig.apn_native_certificate_name
    if (!appId || !certName) {
        Utils.fail(
            `${options.configFilePath} must define apn_app_id and apn_native_certificate_name`
        )

        // This is necessary so that tests work
        return Promise.reject()
    }

    const host = options.messagingHost || 'https://webpush.mobify.net'
    const uri = `${host}/api/v2/sites/${options.messagingSiteId}/certificate_request/?apn_app_id=${appId}`

    return getCredentials(options)
        .then((options) => {
            const requestOptions = {
                uri,
                method: 'GET',
                auth: {
                    user: options.credentials.username,
                    pass: options.credentials.api_key
                }
            }

            console.log(`Requesting certificate-request file from ${uri}...`)
            return makeRequest(requestOptions)
        })
        .then(
            // Save the certificate data in the correct file
            (data) => {
                const fileName = `${options.messagingPath}/${certName}.csr`
                fs.writeFileSync(fileName, data)

                const output = [
                    `Certificate Request file ${fileName} generated.`,
                    'Log into your Apple Developer account, and request an Apple Push Notification',
                    `service SSL (Sandbox & Production) certificate for the App ID '${appId}'.`,
                    'When prompted, upload the Certificate Request file. The Apple Developer website',
                    "will return you a '.cer' file. Rename that file to",
                    `${fileName.replace('.csr', '.cer')} and move it to the ${
                        options.messagingPath
                    } folder.`,
                    `Then you should run '${options.argv.$0} upload' to upload the certificate and`,
                    'configuration file to the Messaging server.'
                ]

                console.log(output.join('\n'))
            }
        )
        .catch(Utils.fail)
}

/**
 * POST to the Messaging backend to create a message object.
 *
 * @param {Object} options - options for the 'testmessage' command
 * @returns a Promise that resolves when the POST is done,
 * with the options object including the message_id.
 * If an error occurs, Utils.fail is called to log the
 * error and exit the process.
 */
const createTestMessage = (options) => {
    const msgUrl = `https://${options.siteConfig.target_domain}/`

    const requestOptions = {
        uri: `${options.messagingHost}/api/v2/sites/${options.messagingSiteId}/messages/`,
        method: POST,
        auth: {
            user: options.credentials.username,
            pass: options.credentials.api_key
        },
        body: {
            title: options.argv.title,
            text: options.argv.text,
            icon: options.argv.icon,
            url: options.argv.url || msgUrl
        }
    }

    return makeV2APIRequest(requestOptions).then((msgResponse) => {
        return Object.assign(
            {
                messageId: msgResponse.message_id
            },
            options
        )
    })
}

const DELIVERED = 'DELIVERED'

/**
 * Given a 'testmessage' command options object containing a
 * deliveryId, poll until that delivery state reaches DELIVERED,
 * or a timeout occurs.
 * @param {Object} options - options for the 'testmessage' command
 * @returns {Promise.<*>} that resolves after the delivery has changed
 * to the DELIVERED state, or a timeout has occurred.
 * If an error occurs, Utils.fail is called to log the
 * error and exit the process.
 */
const waitUntilDelivered = (options) => {
    const expires = Date.now() + 30 * 1000 // 30S timeout

    const requestOptions = {
        uri: `${options.messagingHost}/api/v2/sites/${options.messagingSiteId}/deliveries/${options.deliveryId}/`,
        method: 'GET',
        auth: {
            user: options.credentials.username,
            pass: options.credentials.api_key
        }
    }

    const checker = (resolve, reject) =>
        makeRequest(requestOptions)
            .then(JSON.parse)
            .then(handleV2APIResponse)
            .then((deliveryResponse) => {
                if (deliveryResponse.state === DELIVERED) {
                    console.log(`Delivery ${options.deliveryId} now marked as DELIVERED`)
                    return resolve(options)
                }

                /* istanbul ignore if */
                if (deliveryResponse.state !== 'PENDING') {
                    const msg = `Delivery ${options.deliveryId} changed to ${deliveryResponse.state}`
                    console.log(msg)
                    return reject(msg)
                }

                /* istanbul ignore if */
                if (Date.now() > expires) {
                    const msg = `[Error] State of delivery ${options.deliveryId} did not change to DELIVERED`
                    Utils.fail(msg)
                    return reject(msg)
                } else {
                    return setTimeout(() => checker(resolve, reject), 1000)
                }
            })

    return new Promise(checker)
}

/**
 * Given an options object containing a messageId and
 * argv.client_id, POST to the backend to create a delivery for
 * that message.
 * @param {Object} options - options for the 'testmessage' command
 * @returns a Promise that resolves after the delivery has changed
 * to the DELIVERED state, or a timeout has occurred.
 * If an error occurs, Utils.fail is called to log the
 * error and exit the process.
 */
const deliverTestMessage = (options) => {
    const requestOptions = {
        uri: `${options.messagingHost}/api/v2/sites/${options.messagingSiteId}/deliveries/`,
        method: POST,
        auth: {
            user: options.credentials.username,
            pass: options.credentials.api_key
        },
        body: {
            client_id: options.argv.client_id,
            message_id: options.messageId
        }
    }

    return makeV2APIRequest(requestOptions)
        .then((deliveryResponse) => {
            console.log(`Message sent as delivery ${deliveryResponse.delivery_id}`)

            const extendedOptions = Object.assign(
                {
                    deliveryId: deliveryResponse.delivery_id
                },
                options
            )

            // Wait one second before checking
            return Utils.delayedPromise(extendedOptions, 1000)
        })
        .then(waitUntilDelivered)
}

/**
 * Ask the Messaging backend to send a test message to a given
 * client_id, for the site corresponding to the current project.
 *
 * @param {Object} options - options for the 'testmessage' command
 * @returns a Promise that resolves when the POSTs are done.
 * If an error occurs, Utils.fail is called to log the
 * error and exit the process.
 */
MessagingUtils.sendTestMessage = (options) => {
    options.messagingHost = options.messagingHost || 'https://webpush.mobify.net'
    return getCredentials(options)
        .then(createTestMessage)
        .then(deliverTestMessage)
}

module.exports = MessagingUtils
