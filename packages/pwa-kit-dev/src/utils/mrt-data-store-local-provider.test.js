/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createLocalMrtDataStoreProvider} from './mrt-data-store-local-provider'

describe('createLocalMrtDataStoreProvider', () => {
    const originalEnv = process.env

    beforeEach(() => {
        process.env = {...originalEnv}
        jest.restoreAllMocks()
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it('returns values from provided defaults', async () => {
        const provider = createLocalMrtDataStoreProvider({
            defaults: {
                'custom-global-preferences': {featureFlag: true}
            }
        })

        await expect(provider.getEntry('custom-global-preferences')).resolves.toEqual({
            value: {featureFlag: true}
        })
    })

    it('reads defaults from PWAKIT_MRT_DATA_STORE_DEFAULTS', async () => {
        process.env.PWAKIT_MRT_DATA_STORE_DEFAULTS = JSON.stringify({
            'custom-site-preferences': {theme: 'dark'}
        })

        const provider = createLocalMrtDataStoreProvider()

        await expect(provider.getEntry('custom-site-preferences')).resolves.toEqual({
            value: {theme: 'dark'}
        })
    })

    it('warns once when a key is missing', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const provider = createLocalMrtDataStoreProvider()

        await provider.getEntry('missing-key')
        await provider.getEntry('missing-key')

        expect(warnSpy).toHaveBeenCalledTimes(1)
        expect(warnSpy).toHaveBeenCalledWith(
            "Local MRT Data Store provider did not find 'missing-key'. Returning an empty object for development."
        )
    })

    it('silences missing-key warnings when PWAKIT_MRT_DATA_STORE_WARN_ON_MISSING=false', async () => {
        process.env.PWAKIT_MRT_DATA_STORE_WARN_ON_MISSING = 'false'
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

        const provider = createLocalMrtDataStoreProvider()
        await provider.getEntry('missing-key')

        expect(warnSpy).not.toHaveBeenCalled()
    })

    it('warns and falls back when defaults JSON is invalid', async () => {
        process.env.PWAKIT_MRT_DATA_STORE_DEFAULTS = '{not:json}'
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

        const provider = createLocalMrtDataStoreProvider()
        await expect(provider.getEntry('custom-global-preferences')).resolves.toEqual({value: {}})

        expect(warnSpy).toHaveBeenCalledWith(
            'Failed to parse PWAKIT_MRT_DATA_STORE_DEFAULTS JSON.',
            expect.any(Error)
        )
    })
})
