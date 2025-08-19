#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// this script helps load environment variables when running the retail-react-app on local
'use strict'
import spawn from 'cross-spawn'
import dotenv from 'dotenv'
import minimist from 'minimist'
const argv = minimist(process.argv.slice(2))
;(async function () {
    // load the env variables. pass custom env file with -e flag. eg."npm run dot-env -- -e='.env.local'"
    const envPath = argv.e || '.env'
    const result = dotenv.config({path: envPath})
    if (result.error) {
        throw result.error
    }
    Object.assign(process.env, result.parsed)
    if (argv.p) {
        // run the npm command in a new child process
        const command = spawn(argv.p, argv._)

        command.stdout.on('data', (data) => {
            console.log(data.toString())
        })

        command.stderr.on('data', (data) => {
            console.error(data.toString())
        })

        command.on('exit', (code) => {
            console.log(`Child exited with code ${code}`)
        })
    }
})()
