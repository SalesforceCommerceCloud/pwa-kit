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
    guestToken
} from '@salesforce/retail-react-app/app/utils/test-utils'
import Login from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '@salesforce/retail-react-app/app/pages/account'
import Registration from '@salesforce/retail-react-app/app/pages/registration'
import ResetPassword from '@salesforce/retail-react-app/app/pages/reset-password'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {mockedRegisteredCustomer} from '@salesforce/retail-react-app/app/mocks/mock-data'

const mockMergedBasket = {
    basketId: 'a10ff320829cb0eef93ca5310a',
    currency: 'USD',
    customerInfo: {
        customerId: 'registeredCustomerId',
        email: 'customer@test.com'
    }
}

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
    let mockStartWebauthnAuthentication
    let mockFinishWebauthnAuthentication
    let mockCredentialsGet
    let mockPublicKeyCredential

    beforeEach(() => {
        // Mock WebAuthn API
        mockCredentialsGet = jest.fn()
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

        // Clear localStorage
        localStorage.clear()
    })

    afterEach(() => {
        delete global.PublicKeyCredential
        delete global.window.PublicKeyCredential
    })

    test('Sets up conditional mediation on page load when passkey enabled', async () => {
        const mockAppConfig = {
            ...mockConfig.app,
            login: {
                ...mockConfig.app.login,
                passkey: {enabled: true}
            }
        }

        const mockPublicKeyOptions = {
            challenge: 'mock-challenge',
            allowCredentials: []
        }

        mockPublicKeyCredential.parseRequestOptionsFromJSON.mockReturnValue(mockPublicKeyOptions)

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

    test('Successfully logs in with passkey in passwordless mode on login page', async () => {
        const mockAppConfig = {
            ...mockConfig.app,
            login: {
                ...mockConfig.app.login,
                passwordless: {enabled: true},
                passkey: {enabled: true}
            }
        }

        const mockPublicKeyOptions = {
            challenge: 'mock-challenge',
            allowCredentials: []
        }

        mockPublicKeyCredential.parseRequestOptionsFromJSON.mockReturnValue(mockPublicKeyOptions)

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

        // Mock successful auth after passkey
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

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Enter email (don't enter password for passwordless)
        await user.type(screen.getByLabelText('Email'), 'test@salesforce.com')
        await user.click(screen.getByRole('button', {name: /sign in/i}))

        // Should redirect to account page after successful passkey login
        await waitFor(
            () => {
                expect(localStorage.getItem('hasPasskey')).toBe('true')
            },
            {timeout: 5000}
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

        // Should not call credentials API when passkey is disabled
        expect(mockCredentialsGet).not.toHaveBeenCalled()
    })

    test('Handles passkey login cancellation gracefully', async () => {
        const mockAppConfig = {
            ...mockConfig.app,
            login: {
                ...mockConfig.app.login,
                passwordless: {enabled: true},
                passkey: {enabled: true}
            }
        }

        mockPublicKeyCredential.parseRequestOptionsFromJSON.mockReturnValue({
            challenge: 'mock-challenge',
            allowCredentials: []
        })

        // User cancels passkey selection
        const notAllowedError = new Error('User cancelled')
        notAllowedError.name = 'NotAllowedError'
        mockCredentialsGet.mockRejectedValue(notAllowedError)

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Enter email without password for passwordless
        await user.type(screen.getByLabelText('Email'), 'test@salesforce.com')
        await user.click(screen.getByRole('button', {name: /sign in/i}))

        // Should not show error for cancelled passkey
        // Page should remain on login page
        await waitFor(() => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument()
        })
    })

    test('Shows passkey registration prompt after successful login when passkey enabled and not registered', async () => {
        const mockAppConfig = {
            ...mockConfig.app,
            login: {
                ...mockConfig.app.login,
                passkey: {enabled: true}
            }
        }

        mockPublicKeyCredential.parseRequestOptionsFromJSON.mockReturnValue({
            challenge: 'mock-challenge',
            allowCredentials: []
        })

        // Don't set hasPasskey flag
        localStorage.removeItem('hasPasskey')

        const {user} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockAppConfig,
                bypassAuth: false
            }
        })

        // Login with regular credentials
        await user.type(screen.getByLabelText('Email'), 'customer@test.com')
        await user.type(screen.getByLabelText('Password'), 'Password!1')

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

        // After successful login, should navigate to account page
        await waitFor(
            () => {
                expect(window.location.pathname).toBe('/uk/en-GB/account')
            },
            {timeout: 5000}
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
