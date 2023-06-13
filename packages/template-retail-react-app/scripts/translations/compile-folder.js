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
    const inputFolder = process.argv[2]
    const outputFolder = getOutputFolder()
    const command = `formatjs compile-folder --ast ${inputFolder} ${outputFolder}`

    console.log('Compiling translations into the folder:', outputFolder)
    exec(command, (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
}

main()
