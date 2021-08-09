const fs = require('fs-extra')
const path = require('path')

const logAndExit = require('./utils.js').logAndExit

/**
 * @param {string} newVersion - The new version number for this deployment
 * @param {object} docsDir - The object from Utils.docsDirInfo
 
 * @returns {Promise} - resolves to absolute path to the created symlink
 */
const symlink = (newVersion, docsDir) => {
    const split = docsDir.split
    const linkLocation = split.slice(0, split.indexOf(docsDir.version))
    const linkPath = path.join(...linkLocation, newVersion)

    console.log(`Creating symlink to ${docsDir.version} at ${linkPath}`)
    return fs
        .symlink(docsDir.version, linkPath, 'junction')
        .then(() => {
            console.log(`Symlink successful`)
            return path.resolve(linkPath)
        })
        .catch(logAndExit('Failed to create symlink:'))
}

module.exports = symlink
