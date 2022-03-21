/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// NOTE: This condition works coincidentally, the logic needs to be hardend up.

const currentTarget = typeof TARGET !== 'undefined' ? TARGET : 'node'

console.log('TARGET: ', currentTarget)

// const isClient = typeof process === 'undefined' || (typeof TARGET !== 'undefined' && TARGET === 'web ')
// if (isClient) {

if (currentTarget === 'web') {
    console.log('USING CLIENT IMPLEMENTATION')
    module.exports = require('./ssr-config.client.js');
} else {
    console.log('USING SERVER IMPLEMENTATION')
    // const {cosmiconfigSync} = require('cosmiconfig')
    // console.log('cosmiconfigSync: ', typeof cosmiconfigSync)
    module.exports = require('./ssr-config.server.js');
}