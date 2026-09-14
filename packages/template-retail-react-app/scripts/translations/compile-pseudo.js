#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint @typescript-eslint/no-var-requires: "off" */
const {execFileSync} = require('child_process')
const {getOutputFolder} = require('./utils')

const runFormatjs = (args) => {
    execFileSync('formatjs', args, {stdio: 'inherit'})
}

const main = () => {
    const inputFile = process.argv[2]
    const locale = 'en-XA'
    const outputFile = `${getOutputFolder()}/${locale}.json`
    console.log('Compiling pseudo translation into the file:', outputFile)
    runFormatjs(['compile', '--ast', inputFile, '--out-file', outputFile, '--pseudo-locale', locale])
}

main()
