/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {BaseStorage, MemoryStorage} from './storage'

const {window} = global
const key = 'key'
const value = 'value'

const testCases = [
    {
        description: 'MemoryStorage works without options',
        requiresWindow: false,
        storageOptions: {},
        validate: (storage: BaseStorage) => {
            storage.set(key, value)
            expect(storage.get(key)).toBe(value)
            storage.delete(key)
            expect(storage.get(key)).toBe('')
        }
    },
    {
        description: 'MemoryStorage works with options',
        requiresWindow: false,
        storageOptions: {
            keyPrefix: 'prefix',
            keyPrefixSeperator: '$'
        },
        validate: (storage: BaseStorage) => {
            storage.set(key, value)
            expect(storage.get(key)).toBe(value)
            // @ts-ignore
            expect(Array.from(storage.map.entries())[0][0]).toBe(`prefix$${key}`)
            storage.delete(key)
            expect(storage.get(key)).toBe('')
        }
    }
]

describe('Storage Classes', () => {
    testCases.forEach(({description, requiresWindow, storageOptions, validate}) => {
        test(description, () => {
            if (!requiresWindow) {
                // @ts-ignore
                delete global.window
            }
            const storage = new MemoryStorage(storageOptions)
            validate(storage)

            if (!requiresWindow) {
                global.window = window
            }
        })
    })
})
