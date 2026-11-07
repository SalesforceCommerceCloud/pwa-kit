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
    DEFAULT_TEST_CONFIG,
    DEFAULT_TEST_HOST
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
    test('clear auth state when request uses invalid session', async () => {
        const spy = jest.spyOn(Auth.prototype, 'logout')
        jest.spyOn(Auth.prototype, 'loginGuestUser').mockImplementation(jest.fn())
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

    test('preserves the SCAPI error body on a non-token 400 so the caller can still read the details (regression for #3885)', async () => {
        // An SFRA hook returning dw.system.Status.ERROR surfaces as a 400 whose body carries the
        // error details. handleInvalidToken inspects the body to detect token errors but must not
        // drain it, so the error surfaced to the caller still exposes those details.
        // Regression test for https://github.com/SalesforceCommerceCloud/pwa-kit/issues/3885
        const errorBody = {
            title: 'Bad Request',
            type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/bad-request',
            detail: 'Custom SFRA hook returned an error.'
        }
        const apiName = 'hello-world'
        mockMutationEndpoints(apiName, errorBody, 400)

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

        // The body must not have been consumed by handleInvalidToken: reading it still succeeds
        // and returns the SFRA hook details.
        const error = result.current.error as {response: Response}
        await expect(error.response.json()).resolves.toEqual(errorBody)
    })
})

describe('useCustomMutation request forwarding', () => {
    beforeEach(() => nock.cleanAll())

    const apiName = 'hello-world'
    const customApiPathParameters = {endpointPath: 'test-hello-world', apiName}

    // Echoes what actually reached the endpoint, so the tests assert on the outgoing request.
    const mockEchoEndpoint = () =>
        mockMutationEndpoints(apiName, (uri: string, requestBody: any) => {
            const query: Record<string, string> = {}
            new URL(uri, DEFAULT_TEST_HOST).searchParams.forEach((value, key) => {
                query[key] = value
            })
            return {query, requestBody}
        })

    test('sends the body passed to mutate', async () => {
        mockEchoEndpoint()
        const {result} = renderHookWithProviders(() =>
            useCustomMutation({options: {method: 'POST', customApiPathParameters}})
        )
        act(() => result.current.mutate({body: {test: '123'}}))
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toMatchObject({requestBody: {test: '123'}})
    })
    test('sends the query parameters passed to mutate', async () => {
        mockEchoEndpoint()
        const {result} = renderHookWithProviders(() =>
            useCustomMutation({options: {method: 'POST', customApiPathParameters}})
        )
        act(() => result.current.mutate({parameters: {additional: 'value'}}))
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toMatchObject({
            query: {additional: 'value', siteId: DEFAULT_TEST_CONFIG.siteId}
        })
    })
    test('mutate args take priority over the hook options and keep the other parameters', async () => {
        mockEchoEndpoint()
        const {result} = renderHookWithProviders(() =>
            useCustomMutation({
                options: {
                    method: 'POST',
                    customApiPathParameters,
                    body: {source: 'hook'},
                    parameters: {fromHook: 'kept', overridden: 'hook'}
                }
            })
        )
        act(() =>
            result.current.mutate({
                body: {source: 'mutate'},
                parameters: {overridden: 'mutate'}
            })
        )
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toMatchObject({
            query: {fromHook: 'kept', overridden: 'mutate'},
            requestBody: {source: 'mutate'}
        })
    })
    test('does not re-encode a body that is already a string', async () => {
        mockEchoEndpoint()
        const {result} = renderHookWithProviders(() =>
            useCustomMutation({options: {method: 'POST', customApiPathParameters}})
        )
        act(() => result.current.mutate({body: JSON.stringify({test: '123'})}))
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toMatchObject({requestBody: {test: '123'}})
    })
    test('falls back to the hook options when mutate is called without args', async () => {
        mockEchoEndpoint()
        const {result} = renderHookWithProviders(() =>
            useCustomMutation({
                options: {
                    method: 'POST',
                    customApiPathParameters,
                    body: {source: 'hook'},
                    parameters: {fromHook: 'kept'}
                }
            })
        )
        act(() => result.current.mutate())
        await waitAndExpectSuccess(() => result.current)
        expect(result.current.data).toMatchObject({
            query: {fromHook: 'kept'},
            requestBody: {source: 'hook'}
        })
    })
})

describe('useMutation', () => {
    test('clear auth state when request uses invalid session', async () => {
        const spy = jest.spyOn(Auth.prototype, 'logout')
        jest.spyOn(Auth.prototype, 'loginGuestUser').mockImplementation(jest.fn())

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
                            status: 401,
                            // A real fetch Response body is single-use; handleInvalidToken reads
                            // it via clone(), so the mock must expose clone() too.
                            json: () => mockRes,
                            clone: () => ({json: () => mockRes})
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
            return result.current
        })

        expect(spy).toHaveBeenCalled()
    })
})
