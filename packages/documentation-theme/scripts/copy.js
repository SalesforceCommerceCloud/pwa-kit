const fs = require('fs-extra')
const path = require('path')

const logAndExit = require('./utils.js').logAndExit

const PACKAGE_NAME = '@mobify/documentation-theme'
const COPY_FOLDER = 'theme'

const copy = (absPath) => {
    // We're already provided an absolute path, so just append the folder name
    const copyFolder = path.join(absPath, COPY_FOLDER)
    console.log('Copying theme files to:', copyFolder)

    return fs
        .copy(path.resolve('node_modules', PACKAGE_NAME, COPY_FOLDER), copyFolder)
        .then(() => {
            console.log('Copy successful')
        })
        .catch(logAndExit('Failed to copy theme files:'))
}

module.exports = copy
