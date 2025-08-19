#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// this script uploads environment variables to mrt
// before using it run 'save-credentials' in retail-react-app
'use strict'
import {
    readCredentials,
    DEFAULT_CLOUD_ORIGIN,
    getCredentialsFile
} from '@salesforce/pwa-kit-dev/utils/script-utils'
import {CloudAPIClientCustom} from '@salesforce/retail-react-app/app/api/adyen/scripts/cloudAPICilent.js'
import dotenv from 'dotenv'
;(async function () {
    const result = dotenv.config()

    if (result.error) {
        throw result.error
    }

    const env = result.parsed
    const envParsed = Object.fromEntries(
        Object.entries(env).map((item) => {
            return [
                item[0],
                {
                    value: item[1]
                }
            ]
        })
    )
    const credentials = await readCredentials(getCredentialsFile(DEFAULT_CLOUD_ORIGIN))
    const opts = {credentials, projectID: env.PROJECT_ID, environmentID: env.ENVIRONMENT_ID}
    const client = new CloudAPIClientCustom(opts)
    const data = await client.pushEnv(envParsed)
    const warnings = data.warnings || []
    warnings.forEach((warn) => console.log(warn))
    console.log('env vars uploaded!')
})()
