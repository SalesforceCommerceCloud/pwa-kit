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
const packagePath = path.join(process.cwd(), '.', 'package.json')
const pkgJSON = JSON.parse(fs.readFileSync(packagePath))

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
    const isBaseTemplate = !!pkgJSON.ccExtensibility.extendable
    if (isBaseTemplate) {
        const command =
            "formatjs extract 'app/**/*.{js,jsx}' --out-file app/translations/en-US.json --id-interpolation-pattern [sha512:contenthash:base64:6]"
        exec(command, (err, stdout) => {
            if (err) {
                console.error(err)
            }
            console.log('stout', stdout)
        })
        process.exit(1)
    }
    const overridesDir = path.join(process.cwd(), '.', pkgJSON.ccExtensibility?.overridesDir)
    const fileNames = getAllFilesByExtensions(
        path.join(overridesDir, 'app'),
        [],
        ['js', 'jsx', 'ts', 'tsx']
    )
    // files that will be ignored in translation extraction
    const filesToIgnore = fileNames
        .map((path) => {
            const replacedPath = path.replace(
                overridesDir,
                `./node_modules/${pkgJSON.ccExtensibility?.extends}`
            )
            // check if this file does exist in base template
            const isFileExist = fs.existsSync(replacedPath)
            return isFileExist ? `--ignore ${replacedPath}` : ''
        })
        .filter(Boolean)
        .join(' ')
    const extractCommand = `formatjs extract ${pkgJSON.ccExtensibility?.overridesDir}/app/**/*.{js,jsx} ./node_modules/${pkgJSON.ccExtensibility?.extends}/app/pages/**/*.{js,jsx} ${filesToIgnore} --out-file translations/en-US.json --id-interpolation-pattern [sha512:contenthash:base64:6]`
    exec(extractCommand, (err, stdout) => {
        if (err) {
            console.error(err)
        }
        console.log(stdout)
    })
} catch (error) {
    console.error(error)
}
