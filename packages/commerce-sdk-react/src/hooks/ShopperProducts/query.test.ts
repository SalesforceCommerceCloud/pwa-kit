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
    waitAndExpectSuccess
} from '../../test-utils'
import * as queries from './query'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

type Queries = typeof queries
const productsEndpoint = '/product/shopper-products/'
// Not all endpoints use all parameters, but unused parameters are safely discarded
const OPTIONS = {parameters: {id: 'id', ids: 'ids'}}

/** Map of query name to returned data type */
type TestMap = {[K in keyof Queries]: NonNullable<ReturnType<Queries[K]>['data']>}
// This is an object rather than an array to more easily ensure we cover all hooks
const testMap: TestMap = {
    useCategories: {data: [], limit: 0, total: 0},
    useCategory: {id: 'categoryId'},
    useProduct: {id: 'productId'},
    useProducts: {data: [], limit: 0, total: 0}
}
// Type assertion is necessary because `Object.entries` is limited
const testCases = Object.entries(testMap) as Array<[keyof TestMap, TestMap[keyof TestMap]]>
describe('Shopper Products query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })
    test.each(testCases)('`%s` returns data on success', async (queryName, data) => {
        mockQueryEndpoint(productsEndpoint, data)
        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(data)
    })

    test.each(testCases)('`%s` returns error on error', async (queryName) => {
        mockQueryEndpoint(productsEndpoint, {}, 400)
        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectError(() => result.current)
    })
})

describe('global useQuery checks', () => {
    test('setting retry / retryOnMount to true is automatically disabled on the server', async () => {
        // NOTE: the jest mock execution context is a `node` runtime, so `onClient()`
        // returns false, which means attempting to set retry / retryOnMount to true
        // should be impossible in a jest execution context, we verify that's true here
        mockQueryEndpoint(productsEndpoint, {}, 400)
        const {result, rerender, ...rest} = renderHookWithProviders(
            () => {
                return queries['useProducts'](OPTIONS)
            },
            {retry: true, retryOnMount: true}
        )
        await waitAndExpectError(() => result.current)
        expect(result?.current?.failureCount).toBe(1)
        // we are about to re-render a number of times to be sure retries are disabled
        await rerender()
        expect(result?.current?.failureCount).toBe(1)
        await rerender()
        expect(result?.current?.failureCount).toBe(1)
        await rerender()
        expect(result?.current?.failureCount).toBe(1)
    })
})
