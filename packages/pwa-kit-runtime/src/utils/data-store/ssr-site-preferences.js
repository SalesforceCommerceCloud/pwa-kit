/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Conditional export: server bundle fetches from the Data Store; client reads `window.__MRT_DATA_STORE__`.
/* global WEBPACK_TARGET */

/* istanbul ignore next */
if (typeof WEBPACK_TARGET !== 'undefined' && WEBPACK_TARGET === 'web') {
    module.exports = require('./ssr-site-preferences.client.js')
} else {
    module.exports = require('./ssr-site-preferences.server.js')
}
