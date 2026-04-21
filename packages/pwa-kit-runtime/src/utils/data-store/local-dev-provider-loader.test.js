/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    isMrtDataStoreLocalProviderAllowed,
    loadLocalMrtDataStoreProvider
} from './local-dev-provider-loader'

describe('local-dev-provider-loader', () => {
    const originalEnv = {...process.env}

    afterEach(() => {
        process.env = {...originalEnv}
    })

    describe('isMrtDataStoreLocalProviderAllowed', () => {
        it('is true when PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL=true', () => {
            process.env.NODE_ENV = 'production'
            process.env.PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL = 'true'
            expect(isMrtDataStoreLocalProviderAllowed()).toBe(true)
        })

        it('is true when CI=true', () => {
            process.env.NODE_ENV = 'production'
            delete process.env.PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL
            process.env.CI = 'true'
            expect(isMrtDataStoreLocalProviderAllowed()).toBe(true)
        })

        it('is false in production without allow or CI', () => {
            process.env.NODE_ENV = 'production'
            delete process.env.PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL
            delete process.env.CI
            expect(isMrtDataStoreLocalProviderAllowed()).toBe(false)
        })

        it('is true when NODE_ENV is not production', () => {
            process.env.NODE_ENV = 'test'
            delete process.env.PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL
            delete process.env.CI
            expect(isMrtDataStoreLocalProviderAllowed()).toBe(true)
        })
    })

    describe('loadLocalMrtDataStoreProvider', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'test'
            delete process.env.PWAKIT_MRT_DATA_STORE_ALLOW_LOCAL
            delete process.env.CI
        })

        it('returns a provider with getEntry from PWAKIT_MRT_DATA_STORE_DEFAULTS', async () => {
            process.env.PWAKIT_MRT_DATA_STORE_DEFAULTS = JSON.stringify({
                'dal-key-one': {flag: true}
            })
            const provider = await loadLocalMrtDataStoreProvider()
            await expect(provider.getEntry('dal-key-one')).resolves.toEqual({value: {flag: true}})
        })
    })
})
