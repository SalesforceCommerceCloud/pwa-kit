/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import useCommerceApi from './hooks/useCommerceApi'
import {renderWithProviders} from './test-utils'
import Auth from './auth'
import {DWSID_COOKIE_NAME, SERVER_AFFINITY_HEADER_KEY} from './constant'

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

    // Regression test for W-23089490: the server-affinity header (sfdc_dwsid) must not go
    // stale. Previously the `updatedClients` useMemo omitted `dwsid` from its dependency
    // array, so when only the dwsid cookie changed (e.g. guest-to-logged-in, session bridge,
    // re-auth) the memoized SCAPI clients kept sending the OLD sfdc_dwsid header.
    describe('server-affinity header (sfdc_dwsid) stays in sync with the dwsid cookie', () => {
        const readAffinityHeader = () => screen.getByTestId('affinity-header').textContent

        const AffinityProbe = () => {
            const api = useCommerceApi()
            return (
                <div data-testid="affinity-header">
                    {api?.shopperSearch?.clientConfig?.headers?.[SERVER_AFFINITY_HEADER_KEY] ?? ''}
                </div>
            )
        }

        test('default client path rebuilds clients with the new sfdc_dwsid when dwsid changes', () => {
            const authGet = jest.spyOn(Auth.prototype, 'get').mockImplementation((name) => {
                if (name === DWSID_COOKIE_NAME) return 'OLD_DWSID'
                return undefined as never
            })

            const {rerender} = renderWithProviders(<AffinityProbe />)
            expect(readAffinityHeader()).toBe('OLD_DWSID')

            // Only the dwsid changes; every provider prop stays identical.
            authGet.mockImplementation((name) => {
                if (name === DWSID_COOKIE_NAME) return 'NEW_DWSID'
                return undefined as never
            })
            rerender(<AffinityProbe />)

            expect(readAffinityHeader()).toBe('NEW_DWSID')
        })

        test('does not rebuild the SCAPI clients when dwsid is unchanged across renders', () => {
            jest.spyOn(Auth.prototype, 'get').mockImplementation((name) => {
                if (name === DWSID_COOKIE_NAME) return 'STABLE_DWSID'
                return undefined as never
            })

            let capturedClient: unknown
            const IdentityProbe = () => {
                const api = useCommerceApi()
                capturedClient = api?.shopperSearch
                return <div>identity probe</div>
            }

            const {rerender} = renderWithProviders(<IdentityProbe />)
            const firstClient = capturedClient

            // Re-render with everything identical — the memo must return the same client instance
            // so request deduplication and auth init are not disturbed (W-23089490 AC).
            rerender(<IdentityProbe />)

            expect(capturedClient).toBe(firstClient)
        })
    })
})
