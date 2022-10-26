/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {uuidv4} from './uuidv4.client'

let originalCrypto

describe('uuidv4', () => {
    beforeEach(() => {
        originalCrypto = global.crypto
    })

    afterEach(() => {
        global.crypto = originalCrypto
    })

    test('returns correct format', () => {
        global.crypto = {
            // we mock the module because crypto.getRandomValues
            // is not available on node v14 (came out in node v15)
            getRandomValues: () => [123]
        }

        expect(uuidv4()).toBe('abbbbbbb-abbb-4bbb-bbbb-abbbbbbbbbbb')
    })
})
