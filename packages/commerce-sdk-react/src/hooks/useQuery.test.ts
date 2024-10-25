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
import {useQuery, useCustomQuery} from './useQuery'
import Auth from '../auth'
import {omitNullableParameters} from './utils'

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
    test('clear auth state when request uses invalid session', async () => {
        const spy = jest.spyOn(Auth.prototype, 'clearUserAuth')
        const mockRes = {
            title: 'Unauthorized',
            type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/unauthorized',
            detail: 'Customer credentials changed after token was issued.'
        }
        const apiName = 'hello-world'
        const endpointPath = 'test-hello-world'

        mockQueryEndpoint(
            `${apiName}/v1/organizations/${DEFAULT_TEST_CONFIG.organizationId}/${endpointPath}`,
            mockRes,
            401
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

        await waitAndExpectError(() => result.current)
        expect(spy).toHaveBeenCalled()
    })
})

describe('useQuery', () => {
    test('clear auth state when request uses invalid session', async () => {
        const spy = jest.spyOn(Auth.prototype, 'clearUserAuth')

        const mockRes = {
            title: 'Unauthorized',
            type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/unauthorized',
            detail: 'Customer credentials changed after token was issued.'
        }
        const apiName = 'hello-world'
        const endpointPath = 'test-hello-world'
        const queryKey = `queryKey`

        const options = omitNullableParameters({
            headers: {},
            body: {},
            parameters: {
                apiVersion: 'v1',
                endpointPath,
                apiName
            },
            rawResponse: false
        })
        const hookConfig = {
            method: () =>
                new Promise((resolve, reject) => {
                    reject({
                        response: {
                            json: () => mockRes
                        }
                    })
                }),
            queryKey: [queryKey],
            requiredParameters: []
        }

        const {result} = renderHookWithProviders(() => {
            // set hookConfig as any since we're just trying to invoke the method and not an actual query
            return useQuery(options, {}, hookConfig as any)
        })

        await waitAndExpectError(() => result.current)

        expect(spy).toHaveBeenCalled()
    })
})
