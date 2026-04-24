/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint jest/expect-expect: ['error', {assertFunctionNames: ['validate']}] */
import Cookies from 'js-cookie'
import {BaseStorage, MemoryStorage, CookieStorage} from './storage'

const key = 'key'
const value = 'value'

const testCases = [
    {
        description: 'CookieStorage works',
        storageOptions: undefined,
        StorageClass: CookieStorage,
        validate: (storage: BaseStorage) => {
            // intentionally testing the secure flag
            // If this test failed, a potential reason
            // is that the JSDOM testing environment
            // isn't configured to run in a secure context (https)
            storage.set(key, value, {secure: true})
            expect(storage.get(key)).toBe(value)
            storage.delete(key)
            expect(storage.get(key)).toBe('')
        }
    },
    {
        description: 'CookieStorage passes cookieDomain to set',
        storageOptions: {cookieDomain: '.example.com'},
        StorageClass: CookieStorage,
        validate: (storage: BaseStorage) => {
            const setSpy = jest.spyOn(Cookies, 'set')
            storage.set(key, value)
            expect(setSpy).toHaveBeenCalledWith(
                key,
                value,
                expect.objectContaining({domain: '.example.com'})
            )
            setSpy.mockRestore()
        }
    },
    {
        description: 'CookieStorage passes cookieDomain to delete',
        storageOptions: {cookieDomain: '.example.com'},
        StorageClass: CookieStorage,
        validate: (storage: BaseStorage) => {
            storage.set(key, value)
            const removeSpy = jest.spyOn(Cookies, 'remove')
            storage.delete(key)
            expect(removeSpy).toHaveBeenCalledWith(
                key,
                expect.objectContaining({domain: '.example.com'})
            )
            removeSpy.mockRestore()
        }
    },
    {
        description: 'CookieStorage warns on invalid cookieDomain',
        storageOptions: {cookieDomain: '*.example.com'},
        StorageClass: CookieStorage,
        validate: () => {
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('Invalid cookieDomain')
            )
        }
    },
    {
        description: 'CookieStorage does not set domain when cookieDomain is undefined',
        storageOptions: undefined,
        StorageClass: CookieStorage,
        validate: (storage: BaseStorage) => {
            const setSpy = jest.spyOn(Cookies, 'set')
            storage.set(key, value)
            expect(setSpy).toHaveBeenCalledWith(
                key,
                value,
                expect.not.objectContaining({domain: expect.anything()})
            )
            setSpy.mockRestore()
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
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
        jest.restoreAllMocks()
    })
    testCases.forEach(({description, storageOptions, validate, StorageClass}) => {
        test(`${description}`, () => {
            const storage = new StorageClass(storageOptions)
            validate(storage)
        })
    })
})
