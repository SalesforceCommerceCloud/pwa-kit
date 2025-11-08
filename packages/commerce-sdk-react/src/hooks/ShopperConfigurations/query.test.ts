/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nock from 'nock'
import {
    mockQueryEndpoint,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess,
    createQueryClient
} from '../../test-utils'

import {Argument} from '../types'
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

type Queries = typeof queries
const configurationsEndpoint = '/organizations/'
// Not all endpoints use all parameters, but unused parameters are safely discarded
const OPTIONS: Argument<Queries[keyof Queries]> = {
    parameters: {organizationId: 'f_ecom_zzrmy_orgf_001'}
}

// Mock data for configurations
const mockConfigurationsData = {
    configurations: [
        {
            id: 'gcp',
            value: 'test-gcp-api-key'
        },
        {
            id: 'einstein',
            value: 'test-einstein-api-key'
        }
    ]
}

describe('Shopper Configurations query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })

    test('`useConfigurations` has meta.displayName defined', async () => {
        mockQueryEndpoint(configurationsEndpoint, mockConfigurationsData)
        const queryClient = createQueryClient()
        const {result} = renderHookWithProviders(
            () => {
                return queries.useConfigurations(OPTIONS)
            },
            {queryClient}
        )
        await waitAndExpectSuccess(() => result.current)
        expect(queryClient.getQueryCache().getAll()[0].meta?.displayName).toBe('useConfigurations')
    })

    test('`useConfigurations` returns data on success', async () => {
        mockQueryEndpoint(configurationsEndpoint, mockConfigurationsData)
        const {result} = renderHookWithProviders(() => {
            return queries.useConfigurations(OPTIONS)
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(mockConfigurationsData)
    })

    test('`useConfigurations` returns error on error', async () => {
        mockQueryEndpoint(configurationsEndpoint, {}, 400)
        const {result} = renderHookWithProviders(() => {
            return queries.useConfigurations(OPTIONS)
        })
        await waitAndExpectError(() => result.current)
    })

    test('`useConfigurations` handles 500 server error', async () => {
        mockQueryEndpoint(configurationsEndpoint, {}, 500)
        const {result} = renderHookWithProviders(() => {
            return queries.useConfigurations(OPTIONS)
        })
        await waitAndExpectError(() => result.current)
    })
})
