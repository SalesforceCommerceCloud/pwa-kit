/*
 * Copyright (c) 2025, Salesforce, Inc.
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
const paymentsEndpoint = '/organizations/'
// All parameters are required for getPaymentConfiguration
const OPTIONS: Argument<Queries[keyof Queries]> = {
    parameters: {
        organizationId: 'f_ecom_zzrmy_orgf_001',
        siteId: 'RefArchGlobal',
        currency: 'USD',
        countryCode: 'US'
    }
}

// Mock data for payment configuration
const mockPaymentConfigurationData = {
    paymentMethods: [
        {
            id: 'CREDIT_CARD',
            name: 'Credit Card'
        }
    ],
    paymentMethodSetAccounts: []
}

describe('Shopper Payments query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })

    test('`usePaymentConfiguration` has meta.displayName defined', async () => {
        mockQueryEndpoint(paymentsEndpoint, mockPaymentConfigurationData)
        const queryClient = createQueryClient()
        const {result} = renderHookWithProviders(
            () => {
                return queries.usePaymentConfiguration(OPTIONS)
            },
            {queryClient}
        )
        await waitAndExpectSuccess(() => result.current)
        expect(queryClient.getQueryCache().getAll()[0].meta?.displayName).toBe(
            'usePaymentConfiguration'
        )
    })

    test('`usePaymentConfiguration` returns data on success', async () => {
        mockQueryEndpoint(paymentsEndpoint, mockPaymentConfigurationData)
        const {result} = renderHookWithProviders(() => {
            return queries.usePaymentConfiguration(OPTIONS)
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(mockPaymentConfigurationData)
    })

    test('`usePaymentConfiguration` returns error on error', async () => {
        mockQueryEndpoint(paymentsEndpoint, {}, 400)
        const {result} = renderHookWithProviders(() => {
            return queries.usePaymentConfiguration(OPTIONS)
        })
        await waitAndExpectError(() => result.current)
    })

    test('`usePaymentConfiguration` handles 500 server error', async () => {
        mockQueryEndpoint(paymentsEndpoint, {}, 500)
        const {result} = renderHookWithProviders(() => {
            return queries.usePaymentConfiguration(OPTIONS)
        })
        await waitAndExpectError(() => result.current)
    })
})
