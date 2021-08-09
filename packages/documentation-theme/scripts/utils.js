const fs = require('fs-extra')
const path = require('path')

const HARP_PUBLIC_FOLDER = 'public'

const logAndExit = (msg) => (e) => {
    msg && console.error(msg)
    console.error(e)
    process.exit(1)
}

const remove = (location) => {
    console.log(`Removing ${location}`)
    return fs
        .remove(location)
        .then(() => {
            console.log(`Removal of ${location} successful`)
        })
        .catch(logAndExit(`Could not remove ${location}`))
}

/**
 * We expect to see a relative string value like "public" or "docs/public/dev"
 * @param {string} dirString
 */
const docsDirInfo = (dirString) => {
    const split = dirString.split(path.sep)
    const publicFolderIndex = split.indexOf(HARP_PUBLIC_FOLDER)
    // Harp uses a conventional 'public' folder to store documentation in
    const root = split[publicFolderIndex - 1] || ''

    // This is the 'version' that documentation falls under - for some projects
    // it's "latest" and for others it does not exist
    const version = split[publicFolderIndex + 1] || false

    // This will provide an absolute path to the folder containing 'public'
    // e.g. "docs/public/latest" -> "/Users/foo/project_name/docs/"
    const absRoot = path.resolve(root)

    return {
        split,
        absPath: path.resolve(dirString),
        absRoot,
        version
    }
}

module.exports = {
    logAndExit,
    remove,
    docsDirInfo
}
