/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {BaseStorage, MemoryStorage} from './storage'

const key = 'key'
const value = 'value'

const testCases = [
    {
        description: 'MemoryStorage works without options',
        storageOptions: undefined,
        validate: (storage: BaseStorage) => {
            storage.set(key, value)
            expect(storage.get(key)).toBe(value)
            storage.delete(key)
            expect(storage.get(key)).toBe('')
        }
    },
    {
        description: 'MemoryStorage works with options',
        storageOptions: {
            keyPrefix: 'prefix',
            keyPrefixSeparator: '$'
        },
        validate: (storage: BaseStorage) => {
            storage.set(key, value)
            expect(storage.get(key)).toBe(value)
            // @ts-expect-error private property
            expect([...storage.map.keys()]).toEqual([`prefix$${key}`])
            storage.delete(key)
            expect(storage.get(key)).toBe('')
        }
    },
    {
        description: 'MemoryStorage works with with shared context',
        storageOptions: {
            sharedContext: true
        },
        validate: (storage: BaseStorage) => {
            storage.set(key, value)
            expect(storage.get(key)).toBe(value)
            const secondStore = new MemoryStorage({
                sharedContext: true
            })
            expect(secondStore.get(key)).toBe(value)
        }
    }
]

describe('Storage Classes', () => {
    testCases.forEach(({description, storageOptions, validate}) => {
        test(description, () => {
            const storage = new MemoryStorage(storageOptions)
            validate(storage)
        })
    })
})
