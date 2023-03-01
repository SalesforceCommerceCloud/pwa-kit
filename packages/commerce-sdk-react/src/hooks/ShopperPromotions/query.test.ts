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
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: 'access_token'})
    }))
})

type Queries = typeof queries
const promotionsEndpoint = '/pricing/shopper-promotions/'
// Not all endpoints use all parameters, but unused parameters are safely discarded
const OPTIONS = {parameters: {campaignId: 'campaignId', ids: 'a,b'}}

/** Map of query name to returned data type */
type TestMap = {[K in keyof Queries]: NonNullable<ReturnType<Queries[K]>['data']>}
// This is an object rather than an array to more easily ensure we cover all hooks
const testMap: TestMap = {
    usePromotions: {count: 0, data: [], total: 0},
    usePromotionsForCampaign: {count: 0, data: [], total: 0}
}
// Type assertion is necessary because `Object.entries` is limited
const testCases = Object.entries(testMap) as Array<[keyof TestMap, TestMap[keyof TestMap]]>
describe('Shopper Promotions query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks().length).toBe(0)
    })
    test.each(testCases)('`%s` returns data on success', async (queryName, data) => {
        mockQueryEndpoint(promotionsEndpoint, data)
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectSuccess(wait, () => result.current)
        expect(result.current.data).toEqual(data)
    })
    test.each(testCases)('`%s` returns error on error', async (queryName) => {
        mockQueryEndpoint(promotionsEndpoint, {}, 400)
        const {result, waitForValueToChange: wait} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectError(wait, () => result.current)
    })
})
