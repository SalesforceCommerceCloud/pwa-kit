/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// NOTE: This conditional export by default exports the named export `uuidv4`
// for use in node environments. If specified by the `WEBPACK_TARGET` global
// this module will export a browser safe version.

/* istanbul ignore next */
// eslint-disable-next-line no-undef
if (typeof WEBPACK_TARGET !== 'undefined' && WEBPACK_TARGET === 'web') {
    console.log('client uuid.........................')
    module.exports = require('./uuidv4.client.js')
} else {
    console.log('server uuid-----------------------------')
    module.exports = require('./uuidv4.server.js')
}
