/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This is used for jest to transform the code. Since the jest-config transform rule is "upward"
// we need to use the babel-config from the pwa-kit-dev package.
module.exports = require('@salesforce/pwa-kit-dev/configs/babel/babel-config')
