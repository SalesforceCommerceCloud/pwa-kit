/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = function (source) {
    console.log('running loader')
    // Prepend a comment to the JavaScript file
    const comment = '// This file was processed by loader.js'
    console.log('source: ', comment + source)
    return comment + source
}
