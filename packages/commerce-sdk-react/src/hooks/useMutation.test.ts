/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import nock from 'nock'
import {act} from '@testing-library/react'
import {
    mockMutationEndpoints,
    renderHookWithProviders,
    waitAndExpectSuccess,
    waitAndExpectError,
    DEFAULT_TEST_CONFIG
} from '../test-utils'
import {useMutation, useCustomMutation} from './useMutation'
import Auth from '../auth'

jest.mock('../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

describe('useCustomMutation', () => {
    beforeEach(() => nock.cleanAll())
    test('useCustomMutation returns data on success', async () => {
        const mockRes = {data: '123'}
        const apiName = 'hello-world'
        mockMutationEndpoints(apiName, mockRes)
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
            return useCustomMutation({
                options: {
                    method: 'POST',
                    customApiPathParameters: {
                        endpointPath: 'test-hello-world',
                        apiName
                    },
                    body: {test: '123'}
                },
                clientConfig,
                rawResponse: false
            })
        })
        expect(result.current.data).toBeUndefined()
        act(() => result.current.mutate())
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(mockRes)
    })
    test('clientConfig is optional, default to CommerceApiProvider configs', async () => {
        const mockRes = {data: '123'}
        const apiName = 'hello-world'
        const endpointPath = 'test-hello-world'
        mockMutationEndpoints(
            `${apiName}/v1/organizations/${DEFAULT_TEST_CONFIG.organizationId}/${endpointPath}`,
            mockRes
        )
        const {result} = renderHookWithProviders(() => {
            return useCustomMutation({
                options: {
                    method: 'POST',
                    customApiPathParameters: {
                        endpointPath: 'test-hello-world',
                        apiName
                    },
                    body: {test: '123'}
                },
                rawResponse: false
            })
        })
        expect(result.current.data).toBeUndefined()
        act(() => result.current.mutate())
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(mockRes)
    })
    test('accepts body as mutate parameter', async () => {
        const mockRes = {data: '123'}
        const apiName = 'hello-world'
        mockMutationEndpoints(apiName, mockRes)
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
            return useCustomMutation({
                options: {
                    method: 'POST',
                    customApiPathParameters: {
                        endpointPath: 'test-hello-world',
                        apiName
                    }
                },
                clientConfig,
                rawResponse: false
            })
        })
        expect(result.current.data).toBeUndefined()
        act(() => result.current.mutate({body: {test: '123'}}))
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toEqual(mockRes)
    })
    test('accepts headers as mutate parameter', async () => {
        const apiName = 'hello-world'
        mockMutationEndpoints(apiName, function () {
            // @ts-expect-error there is no typing for nock request
            return this.req.headers
        })
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
            return useCustomMutation({
                options: {
                    method: 'POST',
                    customApiPathParameters: {
                        endpointPath: 'test-hello-world',
                        apiName
                    }
                },
                clientConfig,
                rawResponse: false
            })
        })
        expect(result.current.data).toBeUndefined()
        const mockHeaders = {test: '123'}
        act(() => result.current.mutate({headers: mockHeaders}))
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toHaveProperty('test')
    })
    // The below test does not work currently because HTTP 400 and above are still flagged as a
    // successful mutation. See https://github.com/TanStack/query/discussions/1385
    test('clear auth state when request uses invalid session', async () => {
        const spy = jest.spyOn(Auth.prototype, 'clearUserAuth')
        const mockRes = {
            title: 'Unauthorized',
            type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/unauthorized',
            detail: 'Customer credentials changed after token was issued.'
        }
        const apiName = 'hello-world'
        mockMutationEndpoints(apiName, mockRes, 401)

        const {result} = renderHookWithProviders(() => {
            return useCustomMutation({
                options: {
                    method: 'POST',
                    customApiPathParameters: {
                        endpointPath: 'test-hello-world',
                        apiName
                    },
                    body: {test: '123'}
                },
                rawResponse: false
            })
        })

        expect(result.current.error).toBeNull()
        act(() => result.current.mutate())
        await waitAndExpectError(() => result.current)
        expect(spy).toHaveBeenCalled()
    })
})

describe('useMutation', () => {
    test('clear auth state when request uses invalid session', async () => {
        const spy = jest.spyOn(Auth.prototype, 'clearUserAuth')

        const mockRes = {
            title: 'Unauthorized',
            type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/unauthorized',
            detail: 'Customer credentials changed after token was issued.'
        }

        const hookConfig = {
            client: {},
            method: () =>
                new Promise((resolve, reject) => {
                    reject({
                        response: {
                            json: () => mockRes
                        }
                    })
                }),
            getCacheUpdates: () => {}
        }

        const {result} = renderHookWithProviders(() => {
            // set hookConfig as any since we're just trying to invoke the method and not an actual query
            return useMutation(hookConfig as any)
        })

        act(() => result.current.mutate({}))

        await waitAndExpectError(() => {
            const a = result.current
            console.log(a)
            return a
        })

        expect(spy).toHaveBeenCalled()
    })
})
