/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const Promise = require('bluebird')
const crypto = require('crypto')
const glob = Promise.promisify(require('glob'))
const path = require('path')
const mkdirp = Promise.promisify(require('mkdirp'))
const fileUtils = require('./file-utils')
const Utils = require('./utils')
const currentDate = Date.now()

const APP_MANIFEST_NAME = 'cache-hash-manifest.json'
const LOADER_MANIFEST_NAME = 'loader-cache-hash-manifest.json'

const getHash = (filePath, options) =>
    fileUtils
        .readFile(filePath)
        .catch((err) => Utils.fail(err))
        .then((file) => {
            const fileWithHash = {}
            const destPath = path.relative(options.baseDir, filePath)

            fileWithHash[destPath] = crypto
                .createHash('md5')
                .update(file)
                .digest('hex')
                .slice(0, options.hashLength)

            return fileWithHash
        })

const getHashMap = (options) => {
    if (typeof options.files !== 'object' || options.files.length === 0) {
        Utils.fail('[Error: getHashMap requires an array of string globbing patterns]')
    }

    return Promise.map(options.files, (filePattern) => {
        return glob(filePattern, {nodir: true})
            .then((matches) => Promise.map(matches, (match) => getHash(match, options)))
            .then((hashes) => hashes.reduce((hashA, hashB) => Object.assign(hashA, hashB)))
    })
        .then((hashArray) => hashArray.reduce((a, b) => Object.assign(a, b)))
        .then((hashes) => ({
            hashes,
            buildDate: currentDate
        }))
}

const createHashManifest = (options) => {
    if (typeof options.baseDir === 'undefined') {
        Utils.fail('[Error: You must provide a "baseDir" configuration key.]')
    }

    const appManifestDestination = path.join(options.destinationFolder, APP_MANIFEST_NAME)
    const loaderManifestDestination = path.join(options.destinationFolder, LOADER_MANIFEST_NAME)

    return Utils.exists(options.destinationFolder)
        .catch(() => mkdirp(options.destinationFolder))
        .then(() => getHashMap(options))
        .then(fileUtils.jsonWrite(appManifestDestination))
        .then(() => console.log(`App cache manifest created at "${appManifestDestination}"`))
        .then(() => ({hashes: {}, buildDate: currentDate}))
        .then(fileUtils.jsonWrite(loaderManifestDestination))
        .then(() => console.log(`Loader cache manifest created at "${loaderManifestDestination}"`))
        .catch((err) => Utils.fail(err))
}

module.exports = createHashManifest
