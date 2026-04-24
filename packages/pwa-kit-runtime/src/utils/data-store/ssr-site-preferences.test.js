/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DataStore} from '../ssr-server/data-store'
import {resetDataStoreProviderCacheForTests} from './data-store-utils'
import {
    DATA_STORE_BOOTSTRAP_GLOBAL_PREFERENCES_KEY,
    DATA_STORE_BOOTSTRAP_SITE_PREFERENCES_KEY,
    DATA_STORE_WINDOW_GLOBAL
} from './constants'
import {getCustomSitePreferences} from './ssr-site-preferences.client'
import {
    buildCustomSitePreferencesDataStoreKey,
    getCustomSitePreferences as fetchCustomSitePreferencesForSsr
} from './ssr-site-preferences.server'

describe('ssr-site-preferences', () => {
    describe('client', () => {
        afterEach(() => {
            delete window[DATA_STORE_WINDOW_GLOBAL]
        })

        test('getCustomSitePreferences reads nested site payload', () => {
            window[DATA_STORE_WINDOW_GLOBAL] = {
                [DATA_STORE_BOOTSTRAP_SITE_PREFERENCES_KEY]: {flag: true},
                [DATA_STORE_BOOTSTRAP_GLOBAL_PREFERENCES_KEY]: {}
            }
            expect(getCustomSitePreferences()).toEqual({flag: true})
        })

        test('returns {} when __MRT_DATA_STORE__ missing', () => {
            expect(getCustomSitePreferences()).toEqual({})
        })

        test('returns {} when nested site value is not a plain object', () => {
            window[DATA_STORE_WINDOW_GLOBAL] = {
                [DATA_STORE_BOOTSTRAP_SITE_PREFERENCES_KEY]: [1, 2],
                [DATA_STORE_BOOTSTRAP_GLOBAL_PREFERENCES_KEY]: {}
            }
            expect(getCustomSitePreferences()).toEqual({})
        })

        test('returns {} when __MRT_DATA_STORE__ is not an object', () => {
            window[DATA_STORE_WINDOW_GLOBAL] = 'bad'
            expect(getCustomSitePreferences()).toEqual({})
        })
    })

    describe('server', () => {
        describe('buildCustomSitePreferencesDataStoreKey', () => {
            test('returns null for empty site id', () => {
                expect(buildCustomSitePreferencesDataStoreKey()).toBeNull()
                expect(buildCustomSitePreferencesDataStoreKey('')).toBeNull()
            })

            test('returns site-scoped key', () => {
                expect(buildCustomSitePreferencesDataStoreKey('RefArch')).toBe(
                    'RefArch-custom-site-preferences'
                )
            })
        })

        describe('getCustomSitePreferences', () => {
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

            test('returns empty object when site id missing', async () => {
                await expect(fetchCustomSitePreferencesForSsr({})).resolves.toEqual({})
            })

            test('returns empty object when data store unavailable', async () => {
                delete process.env.AWS_REGION
                await expect(
                    fetchCustomSitePreferencesForSsr({siteId: 'RefArch'})
                ).resolves.toEqual({})
            })

            test('returns value object from Data Store', async () => {
                mockSend.mockResolvedValue({Item: {value: {flag: true}}})
                await expect(
                    fetchCustomSitePreferencesForSsr({siteId: 'RefArch'})
                ).resolves.toEqual({
                    flag: true
                })
            })

            test('returns empty object on not found', async () => {
                mockSend.mockResolvedValue({})
                await expect(
                    fetchCustomSitePreferencesForSsr({siteId: 'RefArch'})
                ).resolves.toEqual({})
            })

            test('returns empty object on service error', async () => {
                mockSend.mockRejectedValue(new Error('throttle'))
                await expect(
                    fetchCustomSitePreferencesForSsr({siteId: 'RefArch'})
                ).resolves.toEqual({})
            })

            test('returns empty object when stored value is not a plain object', async () => {
                mockSend.mockResolvedValue({Item: {value: [1, 2]}})
                await expect(
                    fetchCustomSitePreferencesForSsr({siteId: 'RefArch'})
                ).resolves.toEqual({})
                mockSend.mockResolvedValue({Item: {value: 'not-an-object'}})
                await expect(
                    fetchCustomSitePreferencesForSsr({siteId: 'RefArch'})
                ).resolves.toEqual({})
            })

            test('rethrows unexpected errors from getEntry', async () => {
                const store = DataStore.getDataStore()
                jest.spyOn(store, 'getEntry').mockRejectedValue(new Error('unexpected'))
                await expect(fetchCustomSitePreferencesForSsr({siteId: 'RefArch'})).rejects.toThrow(
                    'unexpected'
                )
                store.getEntry.mockRestore()
            })
        })
    })
})
