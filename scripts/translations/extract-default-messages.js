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

const getAllFilesByExtensions = (dirPath, arrayOfFiles = [], extensions = []) => {
    const files = fs.readdirSync(dirPath, {withFileTypes: true})

    files.forEach(function (file) {
        const filePath = path.join(dirPath, file.name)
        if (file.isDirectory()) {
            arrayOfFiles = getAllFilesByExtensions(filePath, arrayOfFiles, extensions)
        } else if (extensions.length === 0 || extensions.includes(path.extname(filePath))) {
            arrayOfFiles.push(filePath)
        }
    })

    return arrayOfFiles
}

function extract(locale) {
    const command = [
        'formatjs extract "app/**/*.{js,jsx,ts,tsx}"',
        `--out-file translations/${locale}.json`,
        '--id-interpolation-pattern [sha512:contenthash:base64:6]'
    ].join(' ')

    exec(command, (err) => {
        if (err) {
            console.error(err)
        }
    })
}

try {
    // example usage: node ./scripts/translations/extract-default-messages en-US en-GB
    process.argv.slice(2).forEach(extract)
} catch (error) {
    console.error(error)
}
