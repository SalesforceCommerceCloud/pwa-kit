/*
 * Copyright (c) 2024, Salesforce, Inc.
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
    DEFAULT_TEST_CONFIG
} from '../test-utils'
import {useCustomQuery} from './useQuery'

jest.mock('../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

describe('useCustomQuery', () => {
    beforeEach(() => nock.cleanAll())
    afterEach(() => {
        expect(nock.pendingMocks()).toHaveLength(0)
    })
    test('useCustomQuery returns data on success', async () => {
        const mockRes = {data: '123'}
        const apiName = 'hello-world'
        mockQueryEndpoint(apiName, mockRes)
        const {result} = renderHookWithProviders(() => {
            const clientConfig = {
                parameters: {
                    clientId: 'CLIENT_ID',
                    siteId: 'SITE_ID',
                    organizationId: 'ORG_ID',
                    shortCode: 'SHORT_CODE'
                },
                proxy: 'http://localhost:8888/mobify/proxy/api'
            }
            return useCustomQuery({
                options: {
                    method: 'GET',
                    customApiPathParameters: {
                        apiVersion: 'v1',
                        endpointPath: 'test-hello-world',
                        apiName
                    }
                },
                clientConfig,
                rawResponse: false
            })
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(mockRes)
    })
    test('useCustomQuery throws error on failure', async () => {
        const mockRes = {
            title: 'Resource Not Found',
            type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/resource-not-found',
            detail: 'Could not find requested resource'
        }
        const apiName = 'hello-world'
        mockQueryEndpoint(apiName, mockRes, 500)

        const {result} = renderHookWithProviders(() => {
            const clientConfig = {
                parameters: {
                    clientId: 'CLIENT_ID',
                    siteId: 'SITE_ID',
                    organizationId: 'ORG_ID',
                    shortCode: 'SHORT_CODE'
                },
                proxy: 'http://localhost:8888/mobify/proxy/api'
            }
            return useCustomQuery({
                options: {
                    method: 'GET',
                    customApiPathParameters: {
                        apiVersion: 'v1',
                        endpointPath: 'test-hello-world',
                        apiName
                    }
                },
                clientConfig,
                rawResponse: false
            })
        })
        await waitAndExpectError(() => result.current)

        // Validate that we get a `ResponseError` from commerce-sdk-isomorphic. Ideally, we could do
        // `.toBeInstanceOf(ResponseError)`, but the class isn't exported. :\
        expect(result.current.error).toHaveProperty('response')
    })
    test('clientConfig is optional, default to CommerceApiProvider configs', async () => {
        const mockRes = {data: '123'}
        const apiName = 'hello-world'
        const endpointPath = 'test-hello-world'
        mockQueryEndpoint(
            `${apiName}/v1/organizations/${DEFAULT_TEST_CONFIG.organizationId}/${endpointPath}`,
            mockRes
        )
        const {result} = renderHookWithProviders(() => {
            return useCustomQuery({
                options: {
                    method: 'GET',
                    customApiPathParameters: {
                        apiVersion: 'v1',
                        endpointPath,
                        apiName
                    }
                },
                rawResponse: false
            })
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(mockRes)
    })
    test('query defaults to GET request', async () => {
        const mockRes = {data: '123'}
        const apiName = 'hello-world'
        const endpointPath = 'test-hello-world'
        mockQueryEndpoint(
            `${apiName}/v1/organizations/${DEFAULT_TEST_CONFIG.organizationId}/${endpointPath}`,
            mockRes
        )
        const {result} = renderHookWithProviders(() => {
            return useCustomQuery({
                options: {
                    customApiPathParameters: {
                        apiVersion: 'v1',
                        endpointPath,
                        apiName
                    }
                },
                rawResponse: false
            })
        })
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(mockRes)
    })
})
