/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import nock from 'nock'
import {
    DEFAULT_TEST_HOST,
    createQueryClient,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess
} from '../../test-utils'
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

const OPTIONS = {
    parameters: {
        productIds: ['sku-a'],
        postalCode: '94105',
        countryCode: 'US'
    }
}
const DELIVERY_ESTIMATES_PATH =
    '/mobify/proxy/api/product/shopper-delivery-estimates/v1/organizations/f_ecom_zzrmy_orgf_001/delivery-estimates'
const RESPONSE = {productDeliveryEstimates: []}

describe('Shopper Delivery Estimates query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })

    test('forwards required parameters and returns estimates', async () => {
        const scope = nock(DEFAULT_TEST_HOST, {
            reqheaders: {authorization: 'Bearer access_token'}
        })
            .get(DELIVERY_ESTIMATES_PATH)
            .query({
                siteId: 'RefArchGlobal',
                productIds: 'sku-a',
                postalCode: '94105',
                countryCode: 'US'
            })
            .reply(200, RESPONSE)
        const {result} = renderHookWithProviders(() => queries.useDeliveryEstimates(OPTIONS))

        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(RESPONSE)
        expect(scope.isDone()).toBe(true)
    })

    test('sets the query display name', async () => {
        const scope = nock(DEFAULT_TEST_HOST)
            .get(DELIVERY_ESTIMATES_PATH)
            .query(true)
            .reply(200, RESPONSE)
        const queryClient = createQueryClient()
        const {result} = renderHookWithProviders(() => queries.useDeliveryEstimates(OPTIONS), {
            queryClient
        })

        await waitAndExpectSuccess(() => result.current)
        expect(queryClient.getQueryCache().getAll()[0].meta?.displayName).toBe(
            'useDeliveryEstimates'
        )
        expect(scope.isDone()).toBe(true)
    })

    test.each(['productIds', 'postalCode', 'countryCode'] as const)(
        'does not request when %s is unset',
        (parameter) => {
            const parameters = {...OPTIONS.parameters, [parameter]: undefined}
            const {result} = renderHookWithProviders(() => {
                return queries.useDeliveryEstimates({parameters})
            })

            expect(result.current.fetchStatus).toBe('idle')
        }
    )

    test('exposes delivery estimate request errors', async () => {
        const scope = nock(DEFAULT_TEST_HOST)
            .get(DELIVERY_ESTIMATES_PATH)
            .query(true)
            .reply(500, {})
        const {result} = renderHookWithProviders(() => queries.useDeliveryEstimates(OPTIONS), {
            queryClient: createQueryClient()
        })

        await waitAndExpectError(() => result.current)
        expect(scope.isDone()).toBe(true)
    })
})
