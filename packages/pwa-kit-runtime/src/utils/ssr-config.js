/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// NOTE: This export defaults to the `server` implementation unless explicitly set.
// We do this to ensure the code doesn't break when executed without webpack.
// eslint-disable-next-line no-undef
if (typeof WEBPACK_TARGET !== 'undefined' && WEBPACK_TARGET === 'web') {
    module.exports = require('./ssr-config.client.js')
} else {
    module.exports = require('./ssr-config.server.js')
}
