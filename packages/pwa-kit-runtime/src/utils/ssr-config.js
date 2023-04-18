/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// NOTE: This conditional export by default exports the named export `getConfig`
// for use in node environments. If specified by the `WEBPACK_TARGET` global
// this module will export a browser safe version.
/* global WEBPACK_TARGET */

/* istanbul ignore next */
if (typeof WEBPACK_TARGET !== 'undefined' && WEBPACK_TARGET === 'web') {
    module.exports = require('./ssr-config.client.js')
} else {
    module.exports = require('./ssr-config.server.js')
}
