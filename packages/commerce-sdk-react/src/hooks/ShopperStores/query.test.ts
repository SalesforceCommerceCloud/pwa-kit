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
const searchEndpoint = '/store/shopper-stores/'
// Not all endpoints use all parameters, but unused parameters are safely discarded
const OPTIONS = {parameters: {ids: '12345'}}

/** Map of query name to returned data type */
type DataType<K extends keyof Queries> = NonNullable<ReturnType<Queries[K]>['data']>
type TestMap = {[K in keyof Queries]: DataType<K>}
// This is an object rather than an array to more easily ensure we cover all hooks
const testMap: TestMap = {
    // Type assertion so we don't need to use the full type
    useSearchStores: {} as DataType<'useSearchStores'>,
    useStores: {} as DataType<'useStores'>
}
// Type assertion is necessary because `Object.entries` is limited
const testCases = Object.entries(testMap) as Array<[keyof TestMap, TestMap[keyof TestMap]]>
describe('Shopper Stores query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })
    test.each(testCases)('`%s` returns data on success', async (queryName, data) => {
        mockQueryEndpoint(searchEndpoint, data)
        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(data)
    })

    test.each(testCases)('`%s` has meta.displayName defined', async (queryName, data) => {
        mockQueryEndpoint(searchEndpoint, data)
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
        mockQueryEndpoint(searchEndpoint, {}, 400)
        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectError(() => result.current)
    })
})
