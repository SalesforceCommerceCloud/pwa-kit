/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Allows us to use a single babel config at the root to be shared across
// packages. See: https://babeljs.io/docs/en/config-files#jest

/* eslint-env node */

const babelJest = require('babel-jest')

// TODO: change to use .default after upgrading jest for internal-lib-build
module.exports = babelJest.createTransformer({
    rootMode: 'upward'
})
