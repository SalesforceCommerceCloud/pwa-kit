#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const fs = require('fs')
const isEmail = require('validator/lib/isEmail')
const argv = require('yargs')
    .usage('Usage: $0 -u user@mail.com -k my_api_key')
    .option('u', {
        alias: 'user',
        demand: true,
        describe: 'the e-mail address you used to register with Managed Runtime',
        type: 'string'
    })
    .option('k', {
        alias: 'key',
        demand: true,
        describe: 'find your API key at https://runtime.commercecloud.com/account/settings',
        type: 'string'
    })
    .help('h')
    .alias('h', 'help').argv

if (!isEmail(argv.u)) {
    console.error(`[Error: "${argv.u}" is not a valid e-mail address.]`)
    process.exit(0)
}

const settingsPath = require('../scripts/utils').getSettingsPath()

try {
    fs.writeFileSync(settingsPath, JSON.stringify({username: argv.u, api_key: argv.k}, null, 4))
    console.log(`Saved Managed Runtime credentials to "${settingsPath}".`)
} catch (e) {
    console.error('Failed to save credentials.')
    console.error(e)
}
