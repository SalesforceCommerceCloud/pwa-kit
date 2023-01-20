/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ServerStorage} from './storage'

describe('Server Storage', () => {
    const {window} = global
    const key = 'key'
    const value = 'value'

    beforeAll(() => {
        // @ts-ignore
        delete global.window
    })
    afterAll(() => {
        global.window = window
    })
    test('Works without prefix option', () => {
        const serverStorage = new ServerStorage()

        serverStorage.set(key, value)
        expect(serverStorage.get(key)).toBe(value)
        serverStorage.delete(key)
        expect(serverStorage.get(key)).toBe('')
    })
    test('Works with prefix option', () => {
        const serverStorage = new ServerStorage({keyPrefix: 'prefix'})

        serverStorage.set(key, value)
        expect(serverStorage.get(key)).toBe(value)
        // @ts-ignore
        expect(Array.from(serverStorage.map.entries())[0][0]).toBe(`prefix_${key}`)
        serverStorage.delete(key)
        expect(serverStorage.get(key)).toBe('')
    })
})
