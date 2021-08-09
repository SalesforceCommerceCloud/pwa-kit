/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const Utils = require('../scripts/utils.js')
const fs = require('fs')

// This is the potential options of all mobify commands.
const POTENTIAL_OPTIONS = {
    buildDirectory: 'b',
    json: 'j',
    message: 'm',
    polling: 'p',
    projectDirectory: 'd',
    projectSlug: 's',
    target: 't'
}

/**
 * Parse the package.json file first to get some useful values and construct an options object. And then, parse the argv
 * from the command line to update the options object. All mobify commands use this to construct the options object.
 * @param {Object} argv - The argv from the command line
 */
const constructOptionsFromCommandArgv = (argv) => {
    const projectPath = argv.projectDirectory || '.'
    const packagePath = `${projectPath}/package.json`

    let packageJson = {}
    const hint = argv.projectDirectory
        ? 'Please make sure the projectDirectory you entered is correct.'
        : 'You need to run this command in the project root directory or use option "projectDirectory" to specify the directory of the project.' // eslint-disable-line max-len

    try {
        // Assumption: this binary is invoked from the project root directory
        packageJson = JSON.parse(fs.readFileSync(packagePath, {encoding: 'utf8'}))
    } catch (e) {
        let message
        if (e.code === 'ENOENT') {
            message = `${e.message}\n${hint}`
        } else {
            message = e.message
        }

        Utils.fail(message)
    }
    if (packageJson.mobify === undefined) {
        Utils.fail(`Error: There is no mobify object in your package.json.\n${hint}`)
    }

    // Take the default slug from package.json
    if (typeof argv.projectSlug === 'undefined') {
        argv.projectSlug = packageJson.name
    }

    const options = {}

    // Filter out undefined options
    for (const opt in POTENTIAL_OPTIONS) {
        if (typeof argv[opt] !== 'undefined') {
            options[opt] = argv[opt]
        }
    }
    return options
}

module.exports = {
    POTENTIAL_OPTIONS,
    constructOptionsFromCommandArgv
}
