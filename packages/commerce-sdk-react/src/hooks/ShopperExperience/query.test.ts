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
const experienceEndpoint = '/experience/shopper-experience/'
// Not all endpoints use all parameters, but unused parameters are safely discarded
const OPTIONS = {parameters: {pageId: 'pageId', aspectTypeId: 'aspectTypeId'}}

/** Map of query name to returned data type */
type TestMap = {[K in keyof Queries]: NonNullable<ReturnType<Queries[K]>['data']>}
// This is an object rather than an array to more easily ensure we cover all hooks
const testMap: TestMap = {
    usePage: {id: 'id', typeId: 'typeId'},
    usePages: {data: []}
}
// Type assertion is necessary because `Object.entries` is limited
const testCases = Object.entries(testMap) as Array<[keyof TestMap, TestMap[keyof TestMap]]>
describe('Shopper Experience query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })
    test.each(testCases)('`%s` returns data on success', async (queryName, data) => {
        mockQueryEndpoint(experienceEndpoint, data)
        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(data)
    })

    test.each(testCases)('`%s` has meta.displayName defined', async (queryName, data) => {
        mockQueryEndpoint(experienceEndpoint, data)
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
        mockQueryEndpoint(experienceEndpoint, {}, 400)
        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS)
        })
        await waitAndExpectError(() => result.current)
    })
})

describe('Shopper Experience query hooks with Page Designer params', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })

    test('usePage merges pageDesignerParams from provider config', async () => {
        const pageData = {id: 'testPage', typeId: 'storePage'}
        mockQueryEndpoint(experienceEndpoint, pageData)

        const pageDesignerParams = {
            mode: 'edit' as const,
            pdToken: 'test-pd-token',
            pageId: 'pd-page-id'
        }

        const {result} = renderHookWithProviders(
            () => queries.usePage({parameters: {pageId: 'testPage'}}),
            {pageDesignerParams}
        )

        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(pageData)
    })

    test('usePages merges pageDesignerParams from provider config', async () => {
        const pagesData = {data: [{id: 'page1', typeId: 'storePage'}]}
        mockQueryEndpoint(experienceEndpoint, pagesData)

        const pageDesignerParams = {
            mode: 'edit' as const,
            pdToken: 'test-pd-token'
        }

        const {result} = renderHookWithProviders(
            () => queries.usePages({parameters: {aspectTypeId: 'pdpAspect', categoryId: 'cat1'}}),
            {pageDesignerParams}
        )

        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(pagesData)
    })

    test('usePage works without pageDesignerParams', async () => {
        const pageData = {id: 'testPage', typeId: 'storePage'}
        mockQueryEndpoint(experienceEndpoint, pageData)

        const {result} = renderHookWithProviders(() =>
            queries.usePage({parameters: {pageId: 'testPage'}})
        )

        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(pageData)
    })

    test('usePages works without pageDesignerParams', async () => {
        const pagesData = {data: []}
        mockQueryEndpoint(experienceEndpoint, pagesData)

        const {result} = renderHookWithProviders(() =>
            queries.usePages({parameters: {aspectTypeId: 'pdpAspect', categoryId: 'cat1'}})
        )

        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(pagesData)
    })

    test('usePage with partial pageDesignerParams (only mode)', async () => {
        const pageData = {id: 'testPage', typeId: 'storePage'}
        mockQueryEndpoint(experienceEndpoint, pageData)

        const pageDesignerParams = {
            mode: 'preview' as const
        }

        const {result} = renderHookWithProviders(
            () => queries.usePage({parameters: {pageId: 'testPage'}}),
            {pageDesignerParams}
        )

        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(pageData)
    })
})
