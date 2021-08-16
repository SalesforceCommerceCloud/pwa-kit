/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable strict */
'use strict'

const path = require('path')
const git = require('git-rev-sync')

const archiver = require('archiver')

const fileUtils = require('./file-utils')

const Matcher = require('../dist/utils/glob').Matcher

const SDK_VERSION = require('../package.json').version
const DEFAULT_DOCS_URL =
    'https://dev.mobify.com/v2.x/how-to-guides/categories/deployment/pushing-and-publishing-bundles'

const Utils = {}

// Returns a bundle object ready to upload to the Release Console.
Utils.buildObject = (archivePath, options) => {
    options = options || {}
    return fileUtils
        .readFileAsync(archivePath)
        .catch((err) => Utils.fail(err))
        .then((data) => {
            // Encode data and assemble object to upload
            const base64data = data.toString('base64')

            const bundleMetadata = {
                message: options.message || '',
                encoding: 'base64',
                data: base64data
            }

            // Copy any defined SSR parameters from the
            // options.
            if (options.set_ssr_values) {
                for (const key of Object.keys(options).filter((key) => key.startsWith('ssr_'))) {
                    const value = options[key]
                    if (value !== undefined) {
                        bundleMetadata[key] = value
                    }
                }
            }

            return bundleMetadata
        })
}

/**
 * @param options
 *   {
 *       buildDirectory,
 *       projectSlug,
 *       set_ssr_values,
 *       ssr_only,
 *       ssr_shared
 *   }
 * @param destination
 * @returns {*}
 */
Utils.createBundle = (options, destination) => {
    return Utils.exists(options.buildDirectory)
        .catch(() =>
            Utils.fail(
                /* eslint-disable max-len */
                `[Error: Build directory at path "${path.join(
                    process.cwd(),
                    options.buildDirectory
                )}" not found.]\n` +
                    'You must first run the Progressive Web SDK build process before uploading a bundle.'
                /* eslint-disable max-len */
            )
        )
        .then(() => {
            // Clone the options so that we can return a modified object
            const returnedOptions = Object.assign({}, options)

            // Build a list of files in the archive
            const filesInArchive = []

            const output = fileUtils.createWriteStream(destination)
            const archive = archiver('tar')

            archive.on('error', Utils.fail)

            archive.pipe(output)

            // The new root directory of files, that will replace
            // the buildPrefix. Must be of form: <project_slug>/bld/
            const newRoot = path.join(options.projectSlug, 'bld', '')

            // archive.bulk is deprecated, so we use archive.directory to
            // walk the tree and add files (under the newRoot path), adding
            // files to filesInArchive as we go.
            archive.directory(
                // We archive the build directory and everything underneath it.
                options.buildDirectory,
                // We pass an empty destPath because we fix the entry prefix
                // in the function.
                '',
                // This function is called for every file in the tree.
                (entry) => {
                    // entry is a TarEntryData object.
                    // https://archiverjs.com/docs/global.html#TarEntryData
                    // The entry.name field is the file path relative to the
                    // buildDirectory.
                    if (entry.stats.isFile()) {
                        filesInArchive.push(entry.name)
                    }

                    // Add a prefix so that the entry in the tar file
                    // is relative and starts with newRoot
                    entry.prefix = newRoot

                    return entry
                }
            )

            return new Promise((resolve) => {
                output.on('finish', () => {
                    // If we're doing an SSR build, we now need
                    // to update the ssr_only and ssr_shared lists,
                    // which are supplied to use as minimatch-style
                    // glob patterns, but must be uploaded as lists
                    // of actual file paths relative to the build
                    // directory.
                    if (options.set_ssr_values) {
                        const ssrOnlyMatcher = new Matcher(options.ssr_only)
                        returnedOptions.ssr_only = filesInArchive.filter(ssrOnlyMatcher.filter)
                        const ssrSharedMatcher = new Matcher(options.ssr_shared)
                        returnedOptions.ssr_shared = filesInArchive.filter(ssrSharedMatcher.filter)
                    }

                    resolve(returnedOptions)
                })

                // Finalize now that we have set up all the event handlers
                archive.finalize()
            })
        })
}

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

Utils.setDefaultMessage = () => {
    try {
        return `${git.branch()}: ${git.short()}`
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('Please run "git init" to initialize a new Git repository.')
        }
        return 'Mobify Bundle'
    }
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
    code500: 'Internal Server Error. Please report this to Mobify support team.'
}

module.exports = Utils
