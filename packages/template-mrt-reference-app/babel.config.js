/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('@salesforce/pwa-kit-dev/configs/babel/babel-config').default

module.exports = {
    ...base,
    exclude: ['./app/ssr.js', './app/ssr.test.js']
}
