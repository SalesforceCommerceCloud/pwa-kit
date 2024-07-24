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
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

type Queries = typeof queries
const customersEndpoint = '/customer/shopper-customers/'
// Not all endpoints use all parameters, but unused parameters are safely discarded
const OPTIONS = {
    parameters: {
        externalId: 'externalId',
        authenticationProviderId: 'authenticationProviderId',
        customerId: 'customerId',
        addressName: 'addressName',
        paymentInstrumentId: 'paymentInstrumentId',
        listId: 'listId',
        itemId: 'itemId'
    }
}

/** Map of query name to returned data type */
type TestMap = {[K in keyof Queries]: NonNullable<ReturnType<Queries[K]>['data']>}
// This is an object rather than an array to more easily ensure we cover all hooks
const testMap: TestMap = {
    useCustomer: {customerId: 'customerId'},
    useCustomerAddress: {addressId: 'addressId', lastName: 'Human', countryCode: 'CA'},
    useCustomerBaskets: {total: 0, baskets: []},
    useCustomerOrders: {total: 0, data: [], limit: 0, offset: 0},
    useCustomerPaymentInstrument: {
        paymentBankAccount: {},
        paymentCard: {cardType: 'fake'},
        paymentInstrumentId: 'paymentInstrumentId',
        paymentMethodId: 'paymentMethodId'
    },
    useCustomerProductList: {},
    useCustomerProductListItem: {priority: 9000, public: false, quantity: 0},
    useCustomerProductLists: {data: [], limit: 0, total: 0},
    // TODO: Re-implement test when the endpoint exits closed beta.
    // useExternalProfile: {
    //     authenticationProviderId: 'squirrel',
    //     customerId: 'customerId',
    //     externalId: 'external'
    // },
    useProductListItem: {id: 'id', priority: 0, type: 'thing'},
    usePublicProductList: {id: 'id', public: true, type: 'other'},
    usePublicProductListsBySearchTerm: {data: [], limit: 0, total: 0}
}
// Type assertion is necessary because `Object.entries` is limited
const testCases = Object.entries(testMap) as Array<[keyof TestMap, TestMap[keyof TestMap]]>
describe('Shopper Customers query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })
    test.each(testCases)('`%s` returns data on success', async (queryName, data) => {
        mockQueryEndpoint(customersEndpoint, data)
        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(data)
    })

    test.each(testCases)('`%s` has meta.displayName defined', async (queryName, data) => {
        mockQueryEndpoint(customersEndpoint, data)
        const queryClient = createQueryClient()
        const {result} = renderHookWithProviders(
            () => {
                return queries[queryName](OPTIONS)
            },
            {queryClient}
        )
        await waitAndExpectSuccess(() => result.current)
        expect(queryClient.getQueryCache().getAll()[0].meta?.displayName).toBe(queryName)
    })

    test.each(testCases)('`%s` returns error on error', async (queryName) => {
        mockQueryEndpoint(customersEndpoint, {}, 400)
        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectError(() => result.current)
    })
})
