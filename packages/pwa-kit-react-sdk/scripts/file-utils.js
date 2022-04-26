/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const fs = require('fs')

// TODO: Update tests so that fs.promises can be used directly
const promisify = require('util').promisify
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const statAsync = promisify(fs.stat)
const mkdirAsync = promisify(fs.mkdir)
const readdirAsync = promisify(fs.readdir)

const readFile = (path) => readFileAsync(path, 'utf8')
const writeFile = (path, contents) => writeFileAsync(path, contents, 'utf8')

const writeToPath = (path) => (contents) => writeFile(path, contents)

const mkdirIfNonexistent = (dirname) => statAsync(dirname).catch(() => mkdirAsync(dirname))

const existsSync = (path) => {
    try {
        fs.statSync(path)
        return true
    } catch (e) {
        return false
    }
}

const filterOnStat = (pathBuilder, statCondition) => async (items) => {
    const promises = items.map(async (item) => {
        try {
            const stats = await statAsync(pathBuilder(item))
            return statCondition(stats) ? item : null
        } catch (_) {
            // Ignoring the error because we only care about valid paths
            return null
        }
    })
    const results = await Promise.all(promises)
    return results.filter((item) => item != null)
}

const filterDirectories = (pathBuilder) => filterOnStat(pathBuilder, (stats) => stats.isDirectory())

const filterFiles = (pathBuilder) => filterOnStat(pathBuilder, (stats) => stats.isFile())

const jsonRead = (path) => {
    return readFile(path).then((text) => JSON.parse(text))
}

const jsonWrite = (path) => (contents) => {
    return writeFile(path, JSON.stringify(contents, null, 2))
}

module.exports = {
    // Just passing through
    createWriteStream: fs.createWriteStream,

    // Async fs functions
    readdirAsync,
    statAsync,
    readFileAsync,

    // Local utilities
    readFile,
    writeFile,
    writeToPath,
    mkdirIfNonexistent,
    existsSync,
    filterDirectories,
    filterFiles,
    jsonRead,
    jsonWrite
}
