#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint @typescript-eslint/no-var-requires: "off" */

/**
 * This script will extract messages from base template and extended app and output all translations in the extended app
 * If a file is overridden, it won't extract messages from that file in the base template
 */
const {exec} = require('child_process')
const fs = require('fs')
const path = require('path')
const packagePath = path.join(process.cwd(), 'package.json')
const pkgJSON = JSON.parse(fs.readFileSync(packagePath))
const locale = process.argv[2]

const getAllFilesByExtensions = (dirPath, arrayOfFiles = [], extensions = []) => {
    const files = fs.readdirSync(dirPath)

    files.forEach(function (file) {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFilesByExtensions(
                path.join(dirPath, file),
                arrayOfFiles,
                extensions
            )
        } else {
            arrayOfFiles.push(path.join(dirPath, file))
        }
    })
    if (extensions.length) {
        return arrayOfFiles.filter((filePath) => {
            const getExtension = path.extname(filePath).replace('.', '')
            return extensions.includes(getExtension)
        })
    }

    return arrayOfFiles
}

try {
    const overridesDir = pkgJSON.ccExtensibility?.overridesDir
    if (!overridesDir) {
        const command = `formatjs extract "app/**/*.{js,jsx,ts,tsx}" --out-file translations/${locale}.json --id-interpolation-pattern [sha512:contenthash:base64:6]`
        exec(command, (err) => {
            if (err) {
                console.error(err)
            }
        })
    } else {
        const overridesPath = path.join(process.cwd(), pkgJSON.ccExtensibility?.overridesDir)
        // get all the files in extended app
        const files = getAllFilesByExtensions(
            path.join(overridesPath, 'app'),
            [],
            ['js', 'jsx', 'ts', 'tsx']
        )
        // get the file names that are overridden in base template
        const overriddenFiles = files
            .map((path) => {
                const replacedPath = path.replace(
                    overridesDir,
                    `node_modules/${pkgJSON.ccExtensibility?.extends}`
                )
                // check if this file does exist in base template
                const isFileExist = fs.existsSync(replacedPath)
                return isFileExist ? replacedPath : ''
            })
            .filter(Boolean)
        // rename the files needs to ignore to have .ignore extensions so it won't be recognized by formatjs
        overriddenFiles.forEach((filePath) => {
            fs.rename(filePath, `${filePath}.ignore`, (err) => err && console.error(err))
        })

        const extractCommand = `formatjs extract "./node_modules/${pkgJSON.ccExtensibility?.extends}/app/**/*.{js,jsx,ts,tsx}" "${pkgJSON.ccExtensibility?.overridesDir}/app/**/*.{js,jsx,ts,tsx}" --out-file translations/${locale}.json --id-interpolation-pattern [sha512:contenthash:base64:6]`
        exec(extractCommand, (err) => {
            if (err) {
                console.error(err)
            }
            // restore file names
            overriddenFiles.forEach((filePath) => {
                fs.rename(`${filePath}.ignore`, filePath, (err) => err && console.error(err))
            })
        })
    }
} catch (error) {
    console.error(error)
}
