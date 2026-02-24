/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {rest} from 'msw'
import {
    renderWithProviders,
    createPathWithDefaults,
    guestToken,
    registerUserToken,
    clearAllCookies
} from '@salesforce/retail-react-app/app/utils/test-utils'
import Login from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '@salesforce/retail-react-app/app/pages/account'
import Registration from '@salesforce/retail-react-app/app/pages/registration'
import ResetPassword from '@salesforce/retail-react-app/app/pages/reset-password'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {mockedRegisteredCustomer} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useCustomerType} from '@salesforce/commerce-sdk-react'

// Mock getConfig for passkey tests
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

// Allows overriding useCustomerType for tests that need a specific auth
// state (e.g. simulate a user being already authenticated on page load.
jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useCustomerType: jest.fn(actual.useCustomerType)
    }
})

const mockMergedBasket = {
    basketId: 'a10ff320829cb0eef93ca5310a',
    currency: 'USD',
    customerInfo: {
        customerId: 'registeredCustomerId',
        email: 'customer@test.com'
    }
}

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

const MockedComponent = () => {
    const match = {
        params: {pageName: 'profile'}
    }

    return (
        <Router>
            <Login />
            <Route path={createPathWithDefaults('/registration')}>
                <Registration />
            </Route>
            <Route path={createPathWithDefaults('/reset-password')}>
                <ResetPassword />
            </Route>
            <Route path={createPathWithDefaults('/account')}>
                <Account match={match} />
            </Route>
        </Router>
    )
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    // Setup getConfig mock with default config for all tests
    getConfig.mockReturnValue(mockConfig)
    global.server.use(
        rest.post('*/customers', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        }),
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            const {customerId} = req.params
            if (customerId === 'customerId') {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        authType: 'guest',
                        customerId: 'customerid'
                    })
                )
            }
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        })
    )
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
    // Ensures authenticated state from previous tests don't leak into subsequent tests
    clearAllCookies()
})

describe('Logging in tests', function () {
    beforeEach(() => {
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid',
                        access_token: guestToken,
                        refresh_token: 'testrefeshtoken',
                        usid: 'testusid',
                        enc_user_id: 'testEncUserId',
                        id_token: 'testIdToken'
                    })
                )
            ),
            rest.post('*/baskets/actions/merge', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockMergedBasket))
            })
        )
    })

    test('Shows inline error when email is empty', async () => {
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })

        // Only fill password, leave email empty
        await user.type(screen.getByLabelText('Password'), 'Password!1')
        // Try to submit the form
        await user.click(screen.getByRole('button', {name: /sign in/i}))
        expect(await screen.findByText(/Please enter your email address\./i)).toBeInTheDocument()
    })

    test('Shows inline error when password is empty', async () => {
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })
        // Only fill email, leave password empty
        await user.type(screen.getByLabelText('Email'), 'customer@test.com')
        // Try to submit the form
        await user.click(screen.getByRole('button', {name: /sign in/i}))
        expect(await screen.findByText(/Please enter your password\./i)).toBeInTheDocument()
    })

    test('Allows customer to sign in to their account', async () => {
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })

        // enter credentials and submit
        await user.type(screen.getByLabelText('Email'), 'customer@test.com')
        await user.type(screen.getByLabelText('Password'), 'Password!1')
        // login with credentials
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid_1',
                        access_token:
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0._tUrxeXdFYPj6ZoY-GILFRd3-aD1RGPkZX6TqHeS494',
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    })
                )
            )
        )

        await user.click(screen.getByRole('button', {name: /sign in/i}))
        await waitFor(() => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
            expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
        })
    })

    test('allows customer to sign in via Enter key', async () => {
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })

        // enter credentials
        await user.type(screen.getByLabelText('Email'), 'customer@test.com')
        await user.type(screen.getByLabelText('Password'), 'Password!1')

        // mock successful login response
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid_1',
                        access_token:
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0._tUrxeXdFYPj6ZoY-GILFRd3-aD1RGPkZX6TqHeS494',
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    })
                )
            )
        )

        // submit via Enter key
        await user.keyboard('{Enter}')

        await waitFor(() => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
            expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
        })
    })
})

describe('Error while logging in', function () {
    beforeEach(() => {
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid',
                        access_token: guestToken,
                        refresh_token: 'testrefeshtoken',
                        usid: 'testusid',
                        enc_user_id: 'testEncUserId',
                        id_token: 'testIdToken'
                    })
                )
            ),
            rest.post('*/baskets/actions/merge', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockMergedBasket))
            })
        )
    })

    // TODO: Fix flaky/broken test
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('Renders error when given incorrect log in credentials', async () => {
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })

        // enter credentials and submit
        await user.type(screen.getByLabelText('Email'), 'foo@test.com')
        await user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')

        // mock failed auth request
        global.server.use(
            rest.post('*/oauth2/login', (req, res, ctx) =>
                res(ctx.delay(0), ctx.status(401), ctx.json({message: 'Unauthorized Credentials.'}))
            ),
            rest.post('*/customers', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(404), ctx.json({message: 'Not Found.'}))
            })
        )

        await user.click(screen.getByText(/sign in/i))
        // wait for login error alert to appear
        expect(
            await screen.findByText(/Incorrect username or password, please try again./i)
        ).toBeInTheDocument()
    })
})

describe('Passkey login', () => {
    let mockCredentialsGet
    let mockPublicKeyCredential
    let mockAppConfig

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks()

        // Override getConfig to return config with passkey enabled
        mockAppConfig = {
            ...mockConfig.app,
            login: {
                ...mockConfig.app.login,
                passkey: {enabled: true}
            }
        }

        getConfig.mockReturnValue({
            ...mockConfig,
            app: mockAppConfig
        })

        // Mock WebAuthn API - default to never resolving (simulating no user action)
        mockCredentialsGet = jest.fn().mockImplementation(() => new Promise(() => {}))
        mockPublicKeyCredential = {
            parseRequestOptionsFromJSON: jest.fn(),
            isConditionalMediationAvailable: jest.fn().mockResolvedValue(true),
            isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true)
        }

        global.PublicKeyCredential = mockPublicKeyCredential
        global.window.PublicKeyCredential = mockPublicKeyCredential
        global.navigator.credentials = {
            get: mockCredentialsGet
        }

        // Mock parseRequestOptionsFromJSON to return mock options
        mockPublicKeyCredential.parseRequestOptionsFromJSON.mockReturnValue({
            challenge: 'mock-challenge',
            allowCredentials: []
        })

        // Clear localStorage
        localStorage.clear()

        // Setup MSW handlers for WebAuthn API endpoints
        global.server.use(
            rest.post('*/oauth2/webauthn/authenticate/start', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({
                        publicKey: {
                            challenge: 'mock-challenge-data',
                            rpId: 'example.com',
                            allowCredentials: [],
                            timeout: 60000
                        }
                    })
                )
            }),
            rest.post('*/oauth2/webauthn/authenticate/finish', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({
                        tokenResponse: {
                            customer_id: 'customerid_passkey',
                            access_token:
                                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0._tUrxeXdFYPj6ZoY-GILFRd3-aD1RGPkZX6TqHeS494',
                            refresh_token: 'testrefeshtoken_passkey',
                            usid: 'testusid_passkey',
                            enc_user_id: 'testEncUserId_passkey',
                            id_token: 'testIdToken_passkey'
                        }
                    })
                )
            })
        )
    })

    afterEach(() => {
        delete global.PublicKeyCredential
        delete global.window.PublicKeyCredential
    })

    test('Sets up conditional mediation on page load when passkey enabled', async () => {
        // Mock that conditional mediation starts but user doesn't select
        mockCredentialsGet.mockImplementation(
            () =>
                new Promise(() => {
                    // Never resolves - simulating conditional mediation waiting
                })
        )

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Wait for component to mount and setup conditional mediation
        await waitFor(() => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument()
        })

        // Conditional mediation should be initiated
        await waitFor(
            () => {
                expect(mockCredentialsGet).toHaveBeenCalledWith(
                    expect.objectContaining({
                        mediation: 'conditional'
                    })
                )
            },
            {timeout: 2000}
        )
    })

    test('Does not trigger passkey when passkey is disabled', async () => {
        const mockAppConfig = {
            ...mockConfig.app,
            login: {
                ...mockConfig.app.login,
                passkey: {enabled: false}
            }
        }

        // Override getConfig to return config with passkey disabled
        getConfig.mockReturnValue({
            ...mockConfig,
            app: mockAppConfig
        })

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        await waitFor(() => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument()
        })

        // Give it a moment for any async effects to run
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Should not call credentials API when passkey is disabled
        expect(mockCredentialsGet).not.toHaveBeenCalled()
    })

    test('Does not trigger passkey when user is already signed in', async () => {
        // Simulates a user being already authenticated on page load
        const realUseCustomerType = useCustomerType.getMockImplementation()
        useCustomerType.mockReturnValue({
            isRegistered: true,
            customerType: 'registered',
            isGuest: false,
            isExternal: false
        })
        try {
            renderWithProviders(<MockedComponent />, {
                wrapperProps: {
                    siteAlias: 'uk',
                    locale: {id: 'en-GB'},
                    appConfig: mockAppConfig,
                    bypassAuth: true,
                    isGuest: false
                }
            })

            await waitFor(() => {
                expect(screen.getByTestId('login-page')).toBeInTheDocument()
            })

            // Give it a moment for any async effects to run
            await new Promise((resolve) => setTimeout(resolve, 100))

            // Rendering the login page should not trigger navigator.credentials.get when user is already registered
            expect(mockCredentialsGet).not.toHaveBeenCalled()
        } finally {
            useCustomerType.mockImplementation(realUseCustomerType)
        }
    })

    test('Successfully logs in with passkey', async () => {
        const mockCredential = {
            id: 'mock-credential-id',
            rawId: new ArrayBuffer(32),
            type: 'public-key',
            response: {
                authenticatorData: new ArrayBuffer(37),
                clientDataJSON: new ArrayBuffer(128),
                signature: new ArrayBuffer(64),
                userHandle: new ArrayBuffer(16)
            },
            getClientExtensionResults: jest.fn().mockReturnValue({}),
            toJSON: jest.fn().mockReturnValue({
                id: 'mock-credential-id',
                rawId: 'mock-raw-id',
                type: 'public-key',
                response: {
                    authenticatorData: 'mock-auth-data',
                    clientDataJSON: 'mock-client-data',
                    signature: 'mock-signature',
                    userHandle: 'mock-user-handle'
                }
            })
        }

        mockCredentialsGet.mockResolvedValue(mockCredential)

        // Mock customer as registered after passkey login
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid_1',
                        access_token:
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0._tUrxeXdFYPj6ZoY-GILFRd3-aD1RGPkZX6TqHeS494',
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    })
                )
            )
        )

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Wait for passkey flow to be triggered when modal opens
        await waitFor(
            () => {
                expect(mockCredentialsGet).toHaveBeenCalled()
            },
            {timeout: 5000}
        )

        // login successfully and navigate to account page
        await waitFor(() => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
            expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
        })
    })

    test('User can select other login method when passkey login is cancelled', async () => {
        // User cancels passkey selection
        const notAllowedError = new Error('User cancelled')
        notAllowedError.name = 'NotAllowedError'
        mockCredentialsGet.mockRejectedValue(notAllowedError)

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Login form should be shown
        await waitFor(() => {
            expect(mockCredentialsGet).toHaveBeenCalled()
            expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
            expect(screen.getByLabelText('Email')).toBeInTheDocument()
            expect(screen.getByLabelText('Password')).toBeInTheDocument()
            expect(screen.getByRole('button', {name: /sign in/i})).toBeInTheDocument()
            expect(screen.getByTestId('login-page')).toBeInTheDocument()
        })
    })

    test('Shows error when passkey authentication fails with error from the browser', async () => {
        // Simulate error in navigator.credentials.get hook
        mockCredentialsGet.mockRejectedValue(new Error('Authentication failed'))

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Should show error - passkey error should be caught and handled
        await waitFor(() => {
            expect(mockCredentialsGet).toHaveBeenCalled()
            expect(screen.getByText(/Something went wrong. Try again!/i)).toBeInTheDocument()
        })
    })

    test('Shows error when passkey authentication fails with error from the WebAuthn API', async () => {
        // Simulate error in WebAuthn API
        global.server.use(
            rest.post('*/oauth2/webauthn/authenticate/start', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(401),
                    ctx.json({message: 'Authentication failed'})
                )
            })
        )

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Should show error - 401 error from WebAuthn API should be caught and converted to user-friendly message
        await waitFor(() => {
            expect(screen.getByText(/Something went wrong. Try again!/i)).toBeInTheDocument()
        })
    })

    test('Passkey prompt is aborted when user logs in with password', async () => {
        // Capture the abort signal passed to credentials.get
        let capturedSignal = null

        // Mock credentials.get to capture the abort signal and stay pending
        mockCredentialsGet.mockImplementation(({signal}) => {
            capturedSignal = signal
            return new Promise(() => {
                // Never resolve - simulates passkey prompt staying open
            })
        })

        // Successful email/password login
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid_1',
                        access_token:
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLWV4cGVyaWVuY2Ugc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjhlODgzOTczLTY4ZWItNDFmZS1hM2M1LTc1NjIzMjY1MmZmNSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY3ODgzNDI3MSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86ZWNvbTo6dXBuOmtldjVAdGVzdC5jb206OnVpZG46a2V2aW4gaGU6OmdjaWQ6YWJtZXMybWJrM2xYa1JsSEZKd0dZWWt1eEo6OnJjaWQ6YWJVTXNhdnBEOVk2alcwMGRpMlNqeEdDTVU6OmNoaWQ6UmVmQXJjaEdsb2JhbCIsImV4cCI6MjY3ODgzNjEwMSwiaWF0IjoxNjc4ODM0MzAxLCJqdGkiOiJDMkM0ODU2MjAxODYwLTE4OTA2Nzg5MDM0ODA1ODMyNTcwNjY2NTQyIn0._tUrxeXdFYPj6ZoY-GILFRd3-aD1RGPkZX6TqHeS494',
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    })
                )
            ),
            rest.post('*/baskets/actions/merge', (req, res, ctx) =>
                res(ctx.delay(0), ctx.json(mockMergedBasket))
            )
        )

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Wait for passkey conditional mediation to start and capture the signal
        await waitFor(() => {
            expect(mockCredentialsGet).toHaveBeenCalledWith(
                expect.objectContaining({
                    mediation: 'conditional',
                    signal: expect.any(AbortSignal)
                })
            )
            expect(capturedSignal).not.toBeNull()
        })

        // Verify signal is not yet aborted
        expect(capturedSignal.aborted).toBe(false)

        // User logs in with password while passkey prompt is still open
        await user.type(screen.getByLabelText('Email'), 'customer@test.com')
        await user.type(screen.getByLabelText('Password'), 'Password!1')
        await user.click(screen.getByRole('button', {name: /sign in/i}))

        // Wait for successful login and navigation to account page
        await waitFor(
            () => {
                expect(window.location.pathname).toBe('/uk/en-GB/account')
                expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
            },
            {timeout: 3000}
        )

        // Verify the signal was aborted when user logs in with password
        expect(capturedSignal.aborted).toBe(true)
    })

    test('Passkey prompt is aborted when navigating away from login page', async () => {
        // Capture the abort signal passed to credentials.get
        let capturedSignal = null

        // Mock credentials.get to capture the abort signal and stay pending
        mockCredentialsGet.mockImplementation(({signal}) => {
            capturedSignal = signal
            return new Promise(() => {
                // Never resolve - simulates passkey prompt staying open
            })
        })

        const {unmount} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Wait for passkey conditional mediation to start and capture the signal
        await waitFor(() => {
            expect(mockCredentialsGet).toHaveBeenCalledWith(
                expect.objectContaining({
                    mediation: 'conditional',
                    signal: expect.any(AbortSignal)
                })
            )
            expect(capturedSignal).not.toBeNull()
        })

        // Verify signal is not yet aborted
        expect(capturedSignal.aborted).toBe(false)

        // Simulate navigating away from the login page by unmounting
        unmount()

        // Verify the signal was aborted when component unmounted
        expect(capturedSignal.aborted).toBe(true)
    })
})

describe('Passkey Registration', () => {
    let mockPublicKeyCredential

    beforeEach(() => {
        mockPublicKeyCredential = {
            parseRequestOptionsFromJSON: jest.fn(),
            isConditionalMediationAvailable: jest.fn().mockResolvedValue(true),
            isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true)
        }

        global.PublicKeyCredential = mockPublicKeyCredential
        global.window.PublicKeyCredential = mockPublicKeyCredential
    })

    afterEach(() => {
        delete global.PublicKeyCredential
        delete global.window.PublicKeyCredential
    })

    test('Displays Create passkey toast after successful login when passkey is enabled', async () => {
        // Successful email/password login
        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid_1',
                        access_token: registerUserToken,
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    })
                )
            ),
            rest.post('*/baskets/actions/merge', (req, res, ctx) =>
                res(ctx.delay(0), ctx.json(mockMergedBasket))
            )
        )

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                bypassAuth: false
            }
        })

        // Wait for login form after passkey is cancelled
        await waitFor(() => {
            expect(screen.getByLabelText('Email')).toBeInTheDocument()
            expect(screen.getByLabelText('Password')).toBeInTheDocument()
        })

        await user.type(screen.getByLabelText('Email'), 'customer@test.com')
        await user.type(screen.getByLabelText('Password'), 'Password!1')
        await user.click(screen.getByRole('button', {name: /sign in/i}))

        // Create passkey toast is shown after successful login when passkey is enabled and WebAuthn is supported
        await waitFor(
            () => {
                expect(screen.getByRole('button', {name: /Create Passkey/i})).toBeInTheDocument()
            },
            {timeout: 3000}
        )
    })
})

describe('Navigate away from login page tests', function () {
    test('should navigate to sign up page when the user clicks Create Account', async () => {
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                isGuest: true
            }
        })
        await user.click(await screen.findByText(/Create Account/i))

        await waitFor(async () => {
            // wait for sign up page to appear
            expect(await screen.findByText(/Let's get started/i)).toBeInTheDocument()
        })
    })
    test('should navigate to reset password page when the user clicks Forgot Password', async () => {
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                isGuest: true
            }
        })
        await user.click(screen.getByText(/forgot password/i))

        // wait for sign up page to appear
        expect(
            await screen.findByText(
                /Enter your email to receive instructions on how to reset your password/i
            )
        ).toBeInTheDocument()
    })
})

describe('Passwordless login tests', () => {
    beforeEach(() => {
        getConfig.mockReturnValue({
            app: {
                ...mockConfig.app,
                login: {
                    passwordless: {
                        enabled: true,
                        mode: 'email'
                    }
                }
            }
        })
        global.server.use(
            rest.post('*/oauth2/passwordless/login', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json({}))
            }),
            rest.post('*/oauth2/passwordless/token', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json({
                        customer_id: 'customerid_1',
                        access_token: registerUserToken,
                        refresh_token: 'testrefeshtoken_1',
                        usid: 'testusid_1',
                        enc_user_id: 'testEncUserId_1',
                        id_token: 'testIdToken_1'
                    })
                )
            })
        )
    })

    test('allows passwordless login', async () => {
        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app,
                bypassAuth: false
            }
        })

        // enter credentials
        const testEmail = 'customer@test.com'
        await user.type(screen.getByLabelText('Email'), testEmail)

        // Click the submit button
        await user.click(screen.getByRole('button', {name: /Continue/i}))

        // check that OTP auth modal is open
        await waitFor(() => {
            expect(
                screen.getByText(/To log in to your account, enter the code/i)
            ).toBeInTheDocument()
        })

        // resend the email
        await user.click(screen.getByText(/Resend Code/i))

        // enter the code manually
        const code = '12345678'
        const otpInputs = screen.getAllByRole('textbox')
        for (let i = 0; i < 8; i++) {
            await user.type(otpInputs[i], code[i])
        }

        await waitFor(() => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
            expect(screen.getByText(/My Profile/i)).toBeInTheDocument()
        })
    })

    test.each([
        [
            "callback_uri doesn't match the registered callbacks",
            'This feature is not currently available.'
        ],
        [
            'PasswordLess Permissions Error for clientId:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'This feature is not currently available.'
        ],
        ['client secret is not provided', 'This feature is not currently available.'],
        ['unexpected error message', 'Something went wrong. Try again!']
    ])(
        'displays correct error message when passwordless login fails with "%s"',
        async (apiErrorMessage, expectedMessage) => {
            global.server.use(
                rest.post('*/oauth2/passwordless/login', (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.status(400), ctx.json({message: apiErrorMessage}))
                })
            )
            const {user} = renderWithProviders(<MockedComponent />, {
                wrapperProps: {
                    siteAlias: 'uk',
                    locale: {id: 'en-GB'},
                    appConfig: mockConfig.app,
                    bypassAuth: false
                }
            })
            await user.type(screen.getByLabelText('Email'), 'customer@test.com')
            await user.click(screen.getByRole('button', {name: /Continue/i}))
            expect(screen.getByText(expectedMessage)).toBeInTheDocument()
        }
    )
})
