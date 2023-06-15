#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint @typescript-eslint/no-var-requires: "off" */
const {exec} = require('child_process')
const {getOutputFolder} = require('./utils')

const main = () => {
    const inputFile = process.argv[2]
    const locale = 'en-XA'
    const outputFile = `${getOutputFolder()}/${locale}.json`
    const command = `formatjs compile --ast ${inputFile} --out-file ${outputFile} --pseudo-locale ${locale}`

    console.log('Compiling pseudo translation into the file:', outputFile)
    exec(command, (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
}

main()
