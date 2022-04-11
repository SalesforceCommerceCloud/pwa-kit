/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const Promise = require('bluebird')
const fs = require('fs')
const _ = require('lodash')

// Explicitly promisify for more reliable testing
const readFileAsync = Promise.promisify(fs.readFile)
const writeFileAsync = Promise.promisify(fs.writeFile)
const statAsync = Promise.promisify(fs.stat)
const mkdirAsync = Promise.promisify(fs.mkdir)
const readdirAsync = Promise.promisify(fs.readdir)

const readFile = (path) => readFileAsync(path, 'utf8')
const writeFile = (path, contents) => writeFileAsync(path, contents, 'utf8')

// Equivalent to:
// (path) => (contents) => writeFile(path, contents)
const writeToPath = _.curry(writeFile)

const mkdirIfNonexistent = (dirname) => statAsync(dirname).catch(() => mkdirAsync(dirname))

const existsSync = (path) => {
    try {
        fs.statSync(path)
        return true
    } catch (e) {
        return false
    }
}

const clearNulls = (items) => items.filter((item) => item !== null)

const filterOnStat = (pathBuilder, statCondition) => (items) => {
    return Promise.map(items, (item) => {
        return statAsync(pathBuilder(item))
            .then((stats) => {
                return statCondition(stats) ? item : null
            })
            .catchReturn(null)
    }).then(clearNulls)
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
