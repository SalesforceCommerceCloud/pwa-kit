/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint jest/expect-expect: ['error', {assertFunctionNames: ['validate']}] */
import {BaseStorage, MemoryStorage, CookieStorage} from './storage'

const key = 'key'
const value = 'value'

const testCases = [
    {
        description: 'CookieStorage works',
        storageOptions: undefined,
        StorageClass: CookieStorage,
        validate: (storage: BaseStorage) => {
            storage.set(key, value)
            expect(storage.get(key)).toBe(value)
            storage.delete(key)
            expect(storage.get(key)).toBe('')
        }
    },
    {
        // Important: There is a bug with our testing setup at the moment!!
        // Setting secure cookie in jsdom env doesn't work and this is likely due
        // to the jsdom being configured to run in a HTTP context (not HTTPS)
        // We can't find a way to reconfigure jsdom to run in HTTPS. :(
        description: 'CookieStorage secure flag does NOT work in current jsdom environment',
        storageOptions: undefined,
        StorageClass: CookieStorage,
        validate: (storage: BaseStorage) => {
            storage.set(key, value, {secure: true})
            expect(storage.get(key)).toBe('')
            storage.delete(key)
            expect(storage.get(key)).toBe('')
        }
    },
    {
        description: 'MemoryStorage works without options',
        storageOptions: undefined,
        StorageClass: MemoryStorage,
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
            keySuffix: 'suffix'
        },
        StorageClass: MemoryStorage,
        validate: (storage: BaseStorage) => {
            storage.set(key, value)
            expect(storage.get(key)).toBe(value)
            // @ts-expect-error private property
            expect([...storage.map.keys()]).toEqual([`${key}_suffix`])
            storage.delete(key)
            expect(storage.get(key)).toBe('')
        }
    },
    {
        description: 'MemoryStorage works with with shared context',
        storageOptions: {
            sharedContext: true
        },
        StorageClass: MemoryStorage,
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
    testCases.forEach(({description, storageOptions, validate, StorageClass}) => {
        test(`${description}`, () => {
            const storage = new StorageClass(storageOptions)
            validate(storage)
        })
    })
})
