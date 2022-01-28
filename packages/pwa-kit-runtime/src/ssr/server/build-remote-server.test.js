/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {once} from './build-remote-server'

describe('the once function', () => {
    test('should prevent a function being called more than once', () => {
        const fn = jest.fn(() => ({test: 'test'}))
        const wrapped = once(fn)
        expect(fn.mock.calls.length).toBe(0)
        const v1 = wrapped()
        expect(fn.mock.calls.length).toBe(1)
        const v2 = wrapped()
        expect(fn.mock.calls.length).toBe(1)
        expect(v1).toBe(v2) // The exact same instance
    })
})
