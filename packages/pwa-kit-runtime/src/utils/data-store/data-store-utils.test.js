/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DataStore, DataStoreNotFoundError, DataStoreServiceError} from '../ssr-server/data-store'
import {DATA_STORE_WINDOW_GLOBAL} from './constants'
import {
    getDataStore,
    getPlainObjectForDataStoreKey,
    hasMrtEnvironment,
    initializeDataStore,
    isMrtDataStoreEnabled,
    resetDataStoreProviderCacheForTests,
    warnIfMrtDataStoreBootstrapMissing
} from './data-store-utils'

const baseOptions = () => ({
    logNamespace: 'data-store-utils-test',
    serviceErrorMessage: 'Test Data Store request failed'
})

describe('data-store-utils', () => {
    describe('isMrtDataStoreEnabled', () => {
        const originalMrtEnv = process.env.PWAKIT_MRT_DATA_STORE_ENABLED

        afterEach(() => {
            if (originalMrtEnv === undefined) {
                delete process.env.PWAKIT_MRT_DATA_STORE_ENABLED
            } else {
                process.env.PWAKIT_MRT_DATA_STORE_ENABLED = originalMrtEnv
            }
        })

        it('is false when config is missing', () => {
            expect(isMrtDataStoreEnabled(undefined)).toBe(false)
        })

        it('is false when app.mrtDataStore is missing', () => {
            expect(isMrtDataStoreEnabled({app: {}})).toBe(false)
        })

        it('is false when app.mrtDataStore.enabled is false', () => {
            expect(isMrtDataStoreEnabled({app: {mrtDataStore: {enabled: false}}})).toBe(false)
        })

        it('is true when app.mrtDataStore.enabled is true', () => {
            expect(isMrtDataStoreEnabled({app: {mrtDataStore: {enabled: true}}})).toBe(true)
        })

        describe('PWAKIT_MRT_DATA_STORE_ENABLED', () => {
            it('true overrides config off', () => {
                process.env.PWAKIT_MRT_DATA_STORE_ENABLED = 'true'
                expect(isMrtDataStoreEnabled({app: {mrtDataStore: {enabled: false}}})).toBe(true)
            })

            it('false overrides config on', () => {
                process.env.PWAKIT_MRT_DATA_STORE_ENABLED = 'false'
                expect(isMrtDataStoreEnabled({app: {mrtDataStore: {enabled: true}}})).toBe(false)
            })

            it.each(['1', 'yes', 'on', 'TRUE'])('treats %s as enabled', (v) => {
                process.env.PWAKIT_MRT_DATA_STORE_ENABLED = v
                expect(isMrtDataStoreEnabled({app: {}})).toBe(true)
            })

            it.each(['0', 'no', 'off'])('treats %s as disabled', (v) => {
                process.env.PWAKIT_MRT_DATA_STORE_ENABLED = v
                expect(isMrtDataStoreEnabled({app: {mrtDataStore: {enabled: true}}})).toBe(false)
            })

            it('ignores invalid env and uses config', () => {
                process.env.PWAKIT_MRT_DATA_STORE_ENABLED = 'maybe'
                expect(isMrtDataStoreEnabled({app: {mrtDataStore: {enabled: true}}})).toBe(true)
                expect(isMrtDataStoreEnabled({app: {}})).toBe(false)
            })

            it('empty string falls through to config', () => {
                process.env.PWAKIT_MRT_DATA_STORE_ENABLED = '   '
                expect(isMrtDataStoreEnabled({app: {mrtDataStore: {enabled: true}}})).toBe(true)
            })
        })
    })

    describe('hasMrtEnvironment', () => {
        const originalEnv = {...process.env}

        afterEach(() => {
            process.env = {...originalEnv}
        })

        it('is true when AWS_REGION, MOBIFY_PROPERTY_ID, and DEPLOY_TARGET are set', () => {
            process.env.AWS_REGION = 'us-east-1'
            process.env.MOBIFY_PROPERTY_ID = 'p'
            process.env.DEPLOY_TARGET = 'production'
            expect(hasMrtEnvironment()).toBe(true)
        })

        it('is false when any of the trio is missing', () => {
            process.env.AWS_REGION = 'us-east-1'
            process.env.MOBIFY_PROPERTY_ID = 'p'
            delete process.env.DEPLOY_TARGET
            expect(hasMrtEnvironment()).toBe(false)
        })
    })

    describe('getDataStore / initializeDataStore', () => {
        const originalEnv = {...process.env}

        beforeEach(() => {
            resetDataStoreProviderCacheForTests()
        })

        afterEach(() => {
            resetDataStoreProviderCacheForTests()
            process.env = {...originalEnv}
        })

        it('returns the same provider when awaited twice (cached)', async () => {
            delete process.env.AWS_REGION
            delete process.env.MOBIFY_PROPERTY_ID
            delete process.env.DEPLOY_TARGET
            process.env.NODE_ENV = 'test'
            const first = await getDataStore()
            const second = await getDataStore()
            expect(first).toBe(second)
        })

        it('initializeDataStore warms the same cached provider', async () => {
            delete process.env.AWS_REGION
            delete process.env.MOBIFY_PROPERTY_ID
            delete process.env.DEPLOY_TARGET
            process.env.NODE_ENV = 'test'
            await initializeDataStore()
            const afterInit = await getDataStore()
            expect(afterInit).toBe(await getDataStore())
        })
    })

    describe('getPlainObjectForDataStoreKey', () => {
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
            resetDataStoreProviderCacheForTests()
            process.env = originalEnv
            DataStore._instance = null
            DataStore._testDocumentClient = null
        })

        test('returns {} when dataStoreKey is null', async () => {
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: null})
            ).resolves.toEqual({})
        })

        test('returns {} when dataStoreKey is empty string', async () => {
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: ''})
            ).resolves.toEqual({})
        })

        test('returns {} for a missing key when MRT env is incomplete (local path, no defaults)', async () => {
            delete process.env.AWS_REGION
            delete process.env.MOBIFY_PROPERTY_ID
            delete process.env.DEPLOY_TARGET
            delete process.env.PWAKIT_MRT_DATA_STORE_DEFAULTS
            process.env.NODE_ENV = 'test'
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'any-key'})
            ).resolves.toEqual({})
        })

        test('returns local defaults when MRT env is incomplete and NODE_ENV is not production', async () => {
            delete process.env.AWS_REGION
            delete process.env.MOBIFY_PROPERTY_ID
            delete process.env.DEPLOY_TARGET
            process.env.NODE_ENV = 'test'
            process.env.PWAKIT_MRT_DATA_STORE_DEFAULTS = JSON.stringify({
                'my-dal-key': {fromLocal: true}
            })
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-dal-key'})
            ).resolves.toEqual({fromLocal: true})
        })

        test('returns local defaults in production when PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL=true', async () => {
            delete process.env.AWS_REGION
            delete process.env.MOBIFY_PROPERTY_ID
            delete process.env.DEPLOY_TARGET
            process.env.NODE_ENV = 'production'
            process.env.PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL = 'true'
            process.env.PWAKIT_MRT_DATA_STORE_DEFAULTS = JSON.stringify({
                'my-dal-key': {fromLocal: true}
            })
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-dal-key'})
            ).resolves.toEqual({fromLocal: true})
        })

        test('returns {} when MRT env is incomplete, production, and local provider is not allowed', async () => {
            delete process.env.AWS_REGION
            delete process.env.MOBIFY_PROPERTY_ID
            delete process.env.DEPLOY_TARGET
            process.env.NODE_ENV = 'production'
            delete process.env.CI
            delete process.env.PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL
            process.env.PWAKIT_MRT_DATA_STORE_DEFAULTS = JSON.stringify({
                'my-dal-key': {fromLocal: true}
            })
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-dal-key'})
            ).resolves.toEqual({})
        })

        test('returns {} when MRT env is complete but Data Store is not available', async () => {
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
            const store = DataStore.getDataStore()
            jest.spyOn(store, 'isDataStoreAvailable').mockReturnValue(false)
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-key'})
            ).resolves.toEqual({})
            expect(warn).toHaveBeenCalledWith(
                expect.stringMatching(
                    /data-store-provider WARN.*MRT Data Store client is not available/
                )
            )
            warn.mockRestore()
            store.isDataStoreAvailable.mockRestore()
        })

        test('returns plain object value from Data Store', async () => {
            mockSend.mockResolvedValue({Item: {value: {a: 1, nested: {b: 2}}}})
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-key'})
            ).resolves.toEqual({a: 1, nested: {b: 2}})
        })

        test('returns {} when entry is not found', async () => {
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
            mockSend.mockResolvedValue({})
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'missing'})
            ).resolves.toEqual({})
            expect(warn).toHaveBeenCalledTimes(1)
            expect(String(warn.mock.calls[0][0])).toMatch(
                /data-store-provider WARN.*MRT Data Store (entry not found|has no usable plain-object value)/
            )
            warn.mockRestore()
        })

        test('returns {} on DataStoreServiceError (e.g. DynamoDB failure)', async () => {
            mockSend.mockRejectedValue(new Error('throttle'))
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-key'})
            ).resolves.toEqual({})
        })

        test('returns {} when stored value is not a plain object', async () => {
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
            mockSend.mockResolvedValue({Item: {value: [1, 2]}})
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-key'})
            ).resolves.toEqual({})
            mockSend.mockResolvedValue({Item: {value: 'scalar'}})
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-key'})
            ).resolves.toEqual({})
            expect(
                warn.mock.calls.filter((call) =>
                    String(call[0]).includes('MRT Data Store has no usable plain-object value')
                )
            ).toHaveLength(2)
            warn.mockRestore()
        })

        test('returns {} when getEntry throws DataStoreNotFoundError', async () => {
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
            const store = DataStore.getDataStore()
            jest.spyOn(store, 'getEntry').mockRejectedValue(new DataStoreNotFoundError('gone'))
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-key'})
            ).resolves.toEqual({})
            expect(warn).toHaveBeenCalledWith(
                expect.stringMatching(/data-store-provider WARN.*MRT Data Store entry not found/)
            )
            warn.mockRestore()
            store.getEntry.mockRestore()
        })

        test('returns {} when getEntry throws DataStoreServiceError', async () => {
            const store = DataStore.getDataStore()
            jest.spyOn(store, 'getEntry').mockRejectedValue(
                new DataStoreServiceError('unavailable')
            )
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-key'})
            ).resolves.toEqual({})
            store.getEntry.mockRestore()
        })

        test('rethrows unexpected errors from getEntry', async () => {
            const store = DataStore.getDataStore()
            jest.spyOn(store, 'getEntry').mockRejectedValue(new Error('unexpected'))
            await expect(
                getPlainObjectForDataStoreKey({...baseOptions(), dataStoreKey: 'my-key'})
            ).rejects.toThrow('unexpected')
            store.getEntry.mockRestore()
        })
    })

    describe('warnIfMrtDataStoreBootstrapMissing', () => {
        const originalEnv = process.env.NODE_ENV

        afterEach(() => {
            process.env.NODE_ENV = originalEnv
            delete window[DATA_STORE_WINDOW_GLOBAL]
        })

        it('does not warn when __MRT_DATA_STORE__ is present', () => {
            process.env.NODE_ENV = 'development'
            window[DATA_STORE_WINDOW_GLOBAL] = {}
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
            warnIfMrtDataStoreBootstrapMissing()
            expect(warn).not.toHaveBeenCalled()
            warn.mockRestore()
        })

        it('warns on each call in development when key is missing', () => {
            process.env.NODE_ENV = 'development'
            delete window[DATA_STORE_WINDOW_GLOBAL]
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
            warnIfMrtDataStoreBootstrapMissing()
            warnIfMrtDataStoreBootstrapMissing()
            expect(warn).toHaveBeenCalledTimes(2)
            expect(warn.mock.calls[0][0]).toContain('__MRT_DATA_STORE__')
            warn.mockRestore()
        })

        it('does not warn in test env when key is missing', () => {
            process.env.NODE_ENV = 'test'
            delete window[DATA_STORE_WINDOW_GLOBAL]
            const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
            warnIfMrtDataStoreBootstrapMissing()
            expect(warn).not.toHaveBeenCalled()
            warn.mockRestore()
        })
    })
})
