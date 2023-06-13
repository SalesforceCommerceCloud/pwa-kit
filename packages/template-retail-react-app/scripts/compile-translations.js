#!/usr/bin/env node
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint @typescript-eslint/no-var-requires: "off" */
const {exec} = require('child_process')
const fs = require('fs')
const path = require('path')

const packagePath = path.join(process.cwd(), 'package.json')
const pkgJSON = JSON.parse(fs.readFileSync(packagePath))

const overridesDir = pkgJSON.ccExtensibility?.overridesDir
const outputFolder = overridesDir
    ? path.join(overridesDir, 'app/static/translations/compiled')
    : 'app/static/translations/compiled'

const inputFolder = process.argv[2]

const main = () => {
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
