#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-var-requires */
const promisify = require('util').promisify
const fs = require('fs')
const fsPromises = require('fs').promises
const rimraf = promisify(require('rimraf'))
const path = require('path')
const replace = require('replace-in-file')
const packlist = require('npm-packlist')

const {copyFile} = fsPromises

const DEST_DIR = 'dist/'

/**
 * Error catcher that will log an error and exit the process
 * @private
 */
const catcher = (message) => (error) => {
    console.log(`${message}: ${error}`)
    process.exit(1)
}

/**
 * Copy files from their source to a given destination.
 * @private
 * @param srcs {Array<String>} any array of file paths
 * @param dest {String} the destination path
 * @returns {Promise} resolves when files are copied.
 */
const copyFiles = (srcs, dest) => {
    return Promise.all(
        srcs.map((src) => {
            // Assign the full file path
            const newFilePath = path.join(dest, src)

            // Ensure the path exists, create if it doesn't.
            if (!fs.existsSync(newFilePath)) {
                fs.mkdirSync(path.dirname(newFilePath), {recursive: true})
            }

            return copyFile(src, path.join(dest, src))
        })
    )
}

const main = async () => {
    console.log('Preparing dist...')
    // Remove the dist/package.json so we don't end up including more files in
    // the package.
    await rimraf(`${DEST_DIR}/package.json`)

    try {
        // Get a list of files from the `npm pack --dry-run` command.
        const packageFiles = (await packlist()).filter((path) => !path.startsWith('dist/'))
        // Move the required files into the `dist` folder.
        await copyFiles(packageFiles, DEST_DIR)
    } catch (e) {
        catcher('Error while copying files')(e)
    }

    try {
        // Update package.json imports.
        await replace({
            ignore: ['dist/scripts/**/*', 'dist/bin/**/*', 'dist/template/**/*'],
            files: ['dist/**/*.js'],
            from: /..\/package.json/g,
            to: 'package.json'
        })

        // Update script to remove `dist` folder in imports.
        await replace({
            files: ['dist/scripts/**/!(prepare-dist.js)'],
            from: /dist\//g,
            to: '',
            // Scripts are optional, don't fail if nothing matches the glob.
            allowEmptyPaths: true
        })
    } catch (e) {
        catcher('Error replacing file references')(e)
    }

    console.log('Successfully prepared!')
}

main()
