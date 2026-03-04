/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {uuidv4} from './uuidv4.client'

describe('uuidv4', () => {
    test('returns correct format', () => {
        const uuid = uuidv4()
        // Verify UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        // where y is one of [89ab]
        expect(uuid).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        )
    })

    test('returns unique values', () => {
        const uuid1 = uuidv4()
        const uuid2 = uuidv4()
        expect(uuid1).not.toBe(uuid2)
    })
})
