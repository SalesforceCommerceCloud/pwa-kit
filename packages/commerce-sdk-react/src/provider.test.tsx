/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import useCommerceApi from './hooks/useCommerceApi'
import useConfig from './hooks/useConfig'
import {renderWithProviders} from './test-utils'
import Auth from './auth'

jest.mock('./auth/index.ts')

describe('provider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('api clients optional config are passed properly', () => {
        const Component = () => {
            const api = useCommerceApi()
            return (
                <ul>
                    <li>{api?.shopperSearch?.clientConfig?.headers?.['correlation-id']}</li>
                    <li>{api?.shopperSearch?.clientConfig?.fetchOptions?.timeout}</li>
                </ul>
            )
        }
        const config = {
            headers: {'correlation-id': '373a3f80-6bbb-4157-a617-63d27fb15769'},
            fetchOptions: {
                timeout: 50
            }
        }
        renderWithProviders(<Component />, config)
        expect(screen.getByText(config.headers['correlation-id'])).toBeInTheDocument()
        expect(screen.getByText(config.fetchOptions.timeout)).toBeInTheDocument()
    })

    test('Auth is initialized by invoking ready()', () => {
        renderWithProviders(<h1>I can render with no problem!</h1>)
        expect(screen.getByText('I can render with no problem!')).toBeInTheDocument()
        expect(Auth).toHaveBeenCalledTimes(1)
        const authInstance = (Auth as jest.Mock).mock.instances[0]
        expect(authInstance.ready).toHaveBeenCalledTimes(1)
    })

    test('Auth, if initialized with `fetchedToken` short circuits auth.ready()', () => {
        renderWithProviders(<h1>I can render with no problem!</h1>)
        expect(screen.getByText('I can render with no problem!')).toBeInTheDocument()
        expect(Auth).toHaveBeenCalledTimes(1)
        const authInstance = (Auth as jest.Mock).mock.instances[0]
        expect(authInstance.ready).toHaveBeenCalledTimes(1)
    })

    test('shopper login api client uses private proxy when enabled', () => {
        const Component = () => {
            const api = useCommerceApi()
            return (
                <ul>
                    <li data-testid="proxy-value">{api?.shopperLogin?.clientConfig?.proxy}</li>
                </ul>
            )
        }
        const config = {
            enablePWAKitPrivateClient: true,
            privateClientProxyEndpoint: 'http://localhost:3000/mobify/slas/private'
        }
        renderWithProviders(<Component />, config)
        const element = screen.getByTestId('proxy-value')
        expect(element).toBeInTheDocument()
        expect(element.textContent?.includes('/mobify/slas/private')).toBeTruthy()
    })

    test('does not call Auth.ready() when disableAuthInit is true', () => {
        renderWithProviders(<h1>Auth not initialized!</h1>, {disableAuthInit: true})
        expect(screen.getByText('Auth not initialized!')).toBeInTheDocument()
        expect(Auth).toHaveBeenCalledTimes(1)
        const authInstance = (Auth as jest.Mock).mock.instances[0]
        expect(authInstance.ready).toHaveBeenCalledTimes(0)
    })

    test('calls Auth.ready() when disableAuthInit is false', () => {
        renderWithProviders(<h1>Auth initialized!</h1>, {disableAuthInit: false})
        expect(screen.getByText('Auth initialized!')).toBeInTheDocument()
        expect(Auth).toHaveBeenCalledTimes(1)
        const authInstance = (Auth as jest.Mock).mock.instances[0]
        expect(authInstance.ready).toHaveBeenCalledTimes(1)
    })

    test('passes cookieDomain to Auth constructor', () => {
        renderWithProviders(<h1>test</h1>, {
            cookieDomain: '.example.com'
        })
        expect(Auth).toHaveBeenCalledTimes(1)
        expect(Auth).toHaveBeenCalledWith(
            expect.objectContaining({
                cookieDomain: '.example.com'
            })
        )
    })

    test('passes enableHttpOnlySessionCookies to Auth constructor', () => {
        renderWithProviders(<h1>HttpOnly cookies enabled!</h1>, {
            enableHttpOnlySessionCookies: true
        })
        expect(screen.getByText('HttpOnly cookies enabled!')).toBeInTheDocument()
        expect(Auth).toHaveBeenCalledTimes(1)
        expect(Auth).toHaveBeenCalledWith(
            expect.objectContaining({
                enableHttpOnlySessionCookies: true
            })
        )
    })

    test('defaults fetchOptions.credentials to same-origin when enableHttpOnlySessionCookies is true', () => {
        renderWithProviders(<h1>test</h1>, {
            enableHttpOnlySessionCookies: true
        })
        expect(Auth).toHaveBeenCalledWith(
            expect.objectContaining({
                fetchOptions: expect.objectContaining({credentials: 'same-origin'})
            })
        )
    })

    test('overrides fetchOptions.credentials from omit to same-origin when enableHttpOnlySessionCookies is true', () => {
        renderWithProviders(<h1>test</h1>, {
            enableHttpOnlySessionCookies: true,
            fetchOptions: {credentials: 'omit'}
        })
        expect(Auth).toHaveBeenCalledWith(
            expect.objectContaining({
                fetchOptions: expect.objectContaining({credentials: 'same-origin'})
            })
        )
    })

    test('keeps fetchOptions.credentials as include when enableHttpOnlySessionCookies is true', () => {
        renderWithProviders(<h1>test</h1>, {
            enableHttpOnlySessionCookies: true,
            fetchOptions: {credentials: 'include'}
        })
        expect(Auth).toHaveBeenCalledWith(
            expect.objectContaining({
                fetchOptions: expect.objectContaining({credentials: 'include'})
            })
        )
    })

    test('does not modify fetchOptions.credentials when enableHttpOnlySessionCookies is false', () => {
        renderWithProviders(<h1>test</h1>, {
            enableHttpOnlySessionCookies: false,
            fetchOptions: {credentials: 'omit'}
        })
        expect(Auth).toHaveBeenCalledWith(
            expect.objectContaining({
                fetchOptions: expect.objectContaining({credentials: 'omit'})
            })
        )
    })

    describe('resolveHeaders', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {resolveHeaders} = require('./provider')

        test('string values pass through unchanged', () => {
            expect(resolveHeaders({'correlation-id': 'static-value'})).toEqual({
                'correlation-id': 'static-value'
            })
        })

        test('callable values are invoked and their return value is used', () => {
            const getTraceparent = jest.fn(() => '00-trace-span-01')
            const result = resolveHeaders({traceparent: getTraceparent})
            expect(getTraceparent).toHaveBeenCalledTimes(1)
            expect(result).toEqual({traceparent: '00-trace-span-01'})
        })

        test('callable returning undefined is excluded from the result', () => {
            const result = resolveHeaders({
                'correlation-id': 'keep-me',
                traceparent: () => undefined
            })
            expect(result).toEqual({'correlation-id': 'keep-me'})
            expect(result).not.toHaveProperty('traceparent')
        })

        test('callable returning empty string is excluded from the result', () => {
            const result = resolveHeaders({
                'correlation-id': 'keep-me',
                traceparent: () => ''
            })
            expect(result).toEqual({'correlation-id': 'keep-me'})
            expect(result).not.toHaveProperty('traceparent')
        })
    })

    describe('callable header resolution (resolved to string at construction)', () => {
        // During SSR the provider is constructed inside the active server span, so
        // resolving the callable to a string at construction captures the request's
        // trace id. The SDK never invokes function-valued headers, so a raw callable
        // must NOT be left in clientConfig.headers — it is resolved to a string first.
        test('callable header is resolved to a string in client config', () => {
            const getTraceparent = jest.fn(() => '00-trace-span-01')
            const Component = () => {
                const api = useCommerceApi()
                const stored = api?.shopperSearch?.clientConfig?.headers?.['traceparent']
                return (
                    <>
                        <span data-testid="stored-type">{typeof stored}</span>
                        <span data-testid="stored-value">{String(stored)}</span>
                    </>
                )
            }
            renderWithProviders(<Component />, {
                headers: {traceparent: getTraceparent} as any
            })
            // A raw function must never reach the SDK's clientConfig.headers.
            expect(screen.getByTestId('stored-type').textContent).toBe('string')
            expect(screen.getByTestId('stored-value').textContent).toBe('00-trace-span-01')
        })

        test('callable returning undefined yields no header in client config', () => {
            const Component = () => {
                const api = useCommerceApi()
                const has = 'traceparent' in (api?.shopperSearch?.clientConfig?.headers ?? {})
                return <span data-testid="has-header">{String(has)}</span>
            }
            renderWithProviders(<Component />, {
                headers: {traceparent: () => undefined} as any
            })
            expect(screen.getByTestId('has-header').textContent).toBe('false')
        })

        test('ConfigContext exposes resolved (string) headers, not the raw callable', () => {
            // generateCustomEndpointOptions spreads config.headers (from this context)
            // straight onto outbound requests, so a raw function would be sent as
            // `[Function]`. The context must expose resolved strings.
            const getTraceparent = jest.fn(() => '00-trace-span-01')
            const Component = () => {
                const config = useConfig()
                const val = config?.headers?.['traceparent']
                return (
                    <>
                        <span data-testid="cfg-type">{typeof val}</span>
                        <span data-testid="cfg-value">{String(val)}</span>
                    </>
                )
            }
            renderWithProviders(<Component />, {
                headers: {traceparent: getTraceparent} as any
            })
            expect(screen.getByTestId('cfg-type').textContent).toBe('string')
            expect(screen.getByTestId('cfg-value').textContent).toBe('00-trace-span-01')
        })
    })

    describe('outbound integration: traceparent reaches the wire', () => {
        test('a callable traceparent header is resolved and sent on an outbound SCAPI request', async () => {
            const nock = require('nock')
            const {renderHookWithProviders, DEFAULT_TEST_HOST} = require('./test-utils')
            const queries = require('./hooks/ShopperSearch/query')

            nock.cleanAll()
            let sentTraceparent: string | string[] | undefined
            nock(DEFAULT_TEST_HOST)
                .get((uri: string) => uri.includes('/search/shopper-search/'))
                .reply(function (this: any) {
                    sentTraceparent = this.req.headers['traceparent']
                    return [200, {query: 'pants'}]
                })

            // Auth.ready resolves to a token so the query proceeds to the SCAPI call.
            ;(Auth as jest.Mock).mockImplementation(() => ({
                ready: jest.fn().mockResolvedValue({access_token: 'access_token'}),
                get: jest.fn(),
                getAccessToken: jest.fn().mockReturnValue('access_token')
            }))

            const {result} = renderHookWithProviders(
                () => queries.useProductSearch({parameters: {q: 'something'}}),
                {headers: {traceparent: () => '00-abc123-def456-01'} as any}
            )

            const {waitFor} = require('@testing-library/react')
            await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))

            // nock exposes a header as either a string or a single-element array.
            const sent = Array.isArray(sentTraceparent) ? sentTraceparent[0] : sentTraceparent
            expect(sent).toBe('00-abc123-def456-01')
        })
    })
})
