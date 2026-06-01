/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DataStore} from '../ssr-server/data-store'
import {resetDataStoreProviderCacheForTests} from './data-store-utils'
import {CUSTOM_GLOBAL_PREFERENCES_DATA_STORE_KEY, DATA_STORE_WINDOW_GLOBAL} from './constants'
import {getCustomGlobalPreferences} from './ssr-global-preferences.client'
import {
    buildCustomGlobalPreferencesDataStoreKey,
    getCustomGlobalPreferences as fetchCustomGlobalPreferencesForSsr
} from './ssr-global-preferences.server'

describe('ssr-global-preferences', () => {
    describe('client', () => {
        afterEach(() => {
            delete window[DATA_STORE_WINDOW_GLOBAL]
        })

        test('getCustomGlobalPreferences reads using DAL key', async () => {
            window[DATA_STORE_WINDOW_GLOBAL] = {
                'RefArch-custom-site-preferences': {},
                'custom-global-preferences': {org: 1}
            }
            expect(await getCustomGlobalPreferences()).toEqual({org: 1})
        })

        test('returns {} when __MRT_DATA_STORE__ missing', async () => {
            expect(await getCustomGlobalPreferences()).toEqual({})
        })

        test('returns {} when nested global value is not a plain object', async () => {
            window[DATA_STORE_WINDOW_GLOBAL] = {
                'RefArch-custom-site-preferences': {},
                'custom-global-preferences': 'x'
            }
            expect(await getCustomGlobalPreferences()).toEqual({})
        })

        test('returns {} when __MRT_DATA_STORE__ is not an object', async () => {
            window[DATA_STORE_WINDOW_GLOBAL] = 'bad'
            expect(await getCustomGlobalPreferences()).toEqual({})
        })
    })

    describe('server', () => {
        describe('buildCustomGlobalPreferencesDataStoreKey', () => {
            test('returns fixed global key', () => {
                expect(buildCustomGlobalPreferencesDataStoreKey()).toBe(
                    CUSTOM_GLOBAL_PREFERENCES_DATA_STORE_KEY
                )
            })
        })

        describe('getCustomGlobalPreferences', () => {
            const originalEnv = {...process.env}
            let mockSend

            beforeEach(() => {
                resetDataStoreProviderCacheForTests()
                process.env.AWS_REGION = 'us-east-1'
                process.env.MOBIFY_PROPERTY_ID = 'proj'
                process.env.DEPLOY_TARGET = 'production'
                DataStore._instance = null
                DataStore._testDocumentClient = null
                mockSend = jest.fn()
                DataStore._testDocumentClient = {send: mockSend}
            })

            afterEach(() => {
                process.env = originalEnv
                DataStore._instance = null
                DataStore._testDocumentClient = null
                resetDataStoreProviderCacheForTests()
            })

            test('returns empty object when data store unavailable', async () => {
                delete process.env.AWS_REGION
                await expect(fetchCustomGlobalPreferencesForSsr()).resolves.toEqual({})
            })

            test('returns value object from Data Store', async () => {
                mockSend.mockResolvedValue({Item: {value: {orgFlag: true}}})
                await expect(fetchCustomGlobalPreferencesForSsr()).resolves.toEqual({
                    orgFlag: true
                })
            })

            test('returns empty object on not found', async () => {
                mockSend.mockResolvedValue({})
                await expect(fetchCustomGlobalPreferencesForSsr()).resolves.toEqual({})
            })

            test('returns empty object on service error', async () => {
                mockSend.mockRejectedValue(new Error('throttle'))
                await expect(fetchCustomGlobalPreferencesForSsr()).resolves.toEqual({})
            })

            test('returns empty object when stored value is not a plain object', async () => {
                mockSend.mockResolvedValue({Item: {value: [1, 2]}})
                await expect(fetchCustomGlobalPreferencesForSsr()).resolves.toEqual({})
            })

            test('rethrows unexpected errors from getEntry', async () => {
                const store = DataStore.getDataStore()
                jest.spyOn(store, 'getEntry').mockRejectedValue(new Error('unexpected'))
                await expect(fetchCustomGlobalPreferencesForSsr()).rejects.toThrow('unexpected')
                store.getEntry.mockRestore()
            })
        })
    })
})
