/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Polyfill TextDecoder/TextEncoder for jsdom environment
// Required for AWS SDK 3.x's @smithy/core CBOR encoding (used by mrt-utilities)
if (typeof global.TextDecoder === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {TextDecoder, TextEncoder} = require('util')
    global.TextDecoder = TextDecoder
    global.TextEncoder = TextEncoder
}
