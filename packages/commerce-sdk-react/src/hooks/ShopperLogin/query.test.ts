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

// Mock the auth context more comprehensively
jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    mockAuth.prototype.getAccessToken = jest.fn().mockReturnValue('access_token')
    mockAuth.prototype.isTokenExpired = jest.fn().mockReturnValue(false)
    return mockAuth
})

type Queries = typeof queries
// Mock the correct endpoints that the ShopperLogin queries use
const userInfoEndpoint = '/oauth2/userinfo'
const wellKnownEndpoint = '/oauth2/.well-known/openid-configuration'
const jwksEndpoint = '/oauth2/jwks'
// Provide the correct parameters that the ShopperLogin queries require
const OPTIONS = {
    parameters: {
        organizationId: 'test-org-id'
    }
}

/** Map of query name to returned data type */
type TestMap = {[K in keyof Queries]: any}
// This is an object rather than an array to more easily ensure we cover all hooks
const testMap: TestMap = {
    // These endpoints return type `Object`, which isn't helpful, so we just use some mock data
    useJwksUri: {mockJwksUriData: true},
    useUserInfo: {mockUserInfoData: true},
    useWellknownOpenidConfiguration: {mockWellknownData: true}
}
// Type assertion is necessary because `Object.entries` is limited
const testCases = Object.entries(testMap) as Array<[keyof TestMap, TestMap[keyof TestMap]]>
describe('Shopper Login query hooks', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })
    test.each(testCases)('`%s` returns data on success', async (queryName, data) => {
        // Mock the appropriate endpoint based on the query
        if (queryName === 'useUserInfo') {
            mockQueryEndpoint(userInfoEndpoint, data)
        } else if (queryName === 'useWellknownOpenidConfiguration') {
            mockQueryEndpoint(wellKnownEndpoint, data)
        } else if (queryName === 'useJwksUri') {
            mockQueryEndpoint(jwksEndpoint, data)
        }

        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS, {enabled: true})
        })

        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(data)
    })

    test.each(testCases)('`%s` has meta.displayName defined', async (queryName, data) => {
        // Mock the appropriate endpoint based on the query
        if (queryName === 'useUserInfo') {
            mockQueryEndpoint(userInfoEndpoint, data)
        } else if (queryName === 'useWellknownOpenidConfiguration') {
            mockQueryEndpoint(wellKnownEndpoint, data)
        } else if (queryName === 'useJwksUri') {
            mockQueryEndpoint(jwksEndpoint, data)
        }

        const queryClient = createQueryClient()
        const {result} = renderHookWithProviders(
            () => {
                return queries[queryName](OPTIONS, {enabled: true})
            },
            {queryClient}
        )
        await waitAndExpectSuccess(() => result.current)
        expect(queryClient.getQueryCache().getAll()[0].meta?.displayName).toBe(queryName)
    })

    test.each(testCases)('`%s` returns error on error', async (queryName) => {
        // Mock the appropriate endpoint based on the query
        if (queryName === 'useUserInfo') {
            mockQueryEndpoint(userInfoEndpoint, {}, 400)
        } else if (queryName === 'useWellknownOpenidConfiguration') {
            mockQueryEndpoint(wellKnownEndpoint, {}, 400)
        } else if (queryName === 'useJwksUri') {
            mockQueryEndpoint(jwksEndpoint, {}, 400)
        }

        const {result} = renderHookWithProviders(() => {
            return queries[queryName](OPTIONS, {enabled: true})
        })
        await waitAndExpectError(() => result.current)
    })
})
