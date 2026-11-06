/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {waitFor} from '@testing-library/react'
import {rest} from 'msw'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import Login from '.'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import Account from '@salesforce/retail-react-app/app/pages/account'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {mockedRegisteredCustomer} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {AuthHelpers} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    getRememberedPasswordlessLoginId,
    rememberPasswordlessLoginId
} from '@salesforce/retail-react-app/app/utils/auth-utils'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => mockConfig)
}))

const mockMergedBasket = {
    basketId: 'a10ff320829cb0eef93ca5310a',
    currency: 'USD',
    customerInfo: {
        customerId: 'registeredCustomerId',
        email: 'customer@test.com'
    }
}

const mockAuthHelperFunctions = {
    [AuthHelpers.LoginPasswordlessUser]: {mutateAsync: jest.fn()}
}

const MockedComponent = () => {
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <Login />
            <Route path={createPathWithDefaults('/account')}>
                <Account match={match} />
            </Route>
        </Router>
    )
}

const mockUseRouteMatch = jest.fn(() => ({path: '/'}))

jest.mock('react-router', () => {
    const original = jest.requireActual('react-router')
    return {
        ...original,
        useRouteMatch: () => mockUseRouteMatch()
    }
})

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useAuthHelper: jest
            .fn()
            .mockImplementation((helperType) => mockAuthHelperFunctions[helperType]),
        useCustomerBaskets: () => {
            return {data: mockMergedBasket, isSuccess: true}
        },
        useCustomerType: jest.fn(() => {
            return {isRegistered: true, customerType: 'guest'}
        })
    }
})

// Set up and clean up
beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    getConfig.mockReturnValue(mockConfig)

    // Reset useRouteMatch mock to return path based on window.location.pathname
    mockUseRouteMatch.mockImplementation(() => ({
        path: typeof window !== 'undefined' && window.location ? window.location.pathname : '/'
    }))

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

describe('Passwordless landing tests', function () {
    test('does not run passwordless login when landing path does not match', async () => {
        const token = '11111111'
        const invalidLoginPath = '/invalid-passwordless-login-landing'

        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(`${invalidLoginPath}?token=${token}`)
        )
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        await waitFor(() => {
            expect(
                mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
            ).not.toHaveBeenCalled()
        })
    })

    test('redirects to account page when redirect url is not passed', async () => {
        const token = '12345678'
        const loginId = 'shopper@example.com'
        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(
                `/passwordless-login-landing?token=${token}&login_id=${encodeURIComponent(loginId)}`
            )
        )
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        expect(
            mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
        ).toHaveBeenCalledWith({
            pwdlessLoginToken: token,
            login_id: loginId,
            channel_id: 'site-1'
        })

        await waitFor(() => {
            expect(window.location.pathname).toBe('/uk/en-GB/account')
        })
    })

    test('redirects to redirectUrl when passed as param', async () => {
        const token = '12345678'
        const loginId = 'shopper@example.com'
        const redirectUrl = '/womens-tops'
        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(
                `/passwordless-login-landing?token=${token}&login_id=${encodeURIComponent(
                    loginId
                )}&redirect_url=${redirectUrl}`
            )
        )
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        expect(
            mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
        ).toHaveBeenCalledWith({
            pwdlessLoginToken: token,
            login_id: loginId,
            channel_id: 'site-1'
        })

        await waitFor(() => {
            expect(window.location.pathname).toBe('/uk/en-GB/womens-tops')
        })
    })

    test('detects landing path when at the end of path', async () => {
        const token = '33333333'
        const loginId = 'shopper@example.com'
        const loginPath = '/global/en-GB/passwordless-login-landing'
        // mockRouteMatch.mockReturnValue({path: loginPath})
        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(
                `${loginPath}?token=${token}&login_id=${encodeURIComponent(loginId)}`
            )
        )
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'global',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        await waitFor(() => {
            expect(
                mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
            ).toHaveBeenCalledWith({
                pwdlessLoginToken: token,
                login_id: loginId,
                channel_id: 'site-1'
            })
        })

        expect(
            mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
        ).toHaveBeenCalledWith({
            pwdlessLoginToken: token,
            login_id: loginId,
            channel_id: 'site-1'
        })
    })

    test('uses the email remembered at authorize time when the link has no login_id', async () => {
        const token = '77777777'
        const loginId = 'Shopper+Tag@example.com'
        rememberPasswordlessLoginId(loginId)
        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(`/passwordless-login-landing?token=${token}`)
        )
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        await waitFor(() => {
            expect(
                mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
            ).toHaveBeenCalledWith({
                pwdlessLoginToken: token,
                login_id: loginId,
                channel_id: 'site-1'
            })
        })
        await waitFor(() => {
            expect(getRememberedPasswordlessLoginId()).toBeNull()
        })
    })

    test('restores a "+" in a login_id query param that was not URL-encoded', async () => {
        const token = '88888888'
        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(
                `/passwordless-login-landing?token=${token}&login_id=shopper+tag@example.com`
            )
        )
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        await waitFor(() => {
            expect(
                mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
            ).toHaveBeenCalledWith({
                pwdlessLoginToken: token,
                login_id: 'shopper+tag@example.com',
                channel_id: 'site-1'
            })
        })
    })

    test('asks the shopper to confirm their email when none is remembered, then logs in', async () => {
        const token = '55555555'
        const loginId = 'shopper@example.com'
        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(`/passwordless-login-landing?token=${token}`)
        )
        const {user, findByTestId, getByLabelText, getByRole} = renderWithProviders(
            <MockedComponent />,
            {
                wrapperProps: {
                    siteAlias: 'uk',
                    locale: {id: 'en-GB'},
                    appConfig: mockConfig.app
                }
            }
        )

        expect(await findByTestId('confirm-passwordless-email')).toBeInTheDocument()
        expect(
            mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
        ).not.toHaveBeenCalled()

        await user.type(getByLabelText('Email'), ` ${loginId} `)
        await user.click(getByRole('button', {name: /continue/i}))

        await waitFor(() => {
            expect(
                mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
            ).toHaveBeenCalledWith({
                pwdlessLoginToken: token,
                login_id: loginId,
                channel_id: 'site-1'
            })
        })
    })

    test('shows an error when passwordless login fails on the landing page', async () => {
        const token = '66666666'
        const loginId = 'shopper@example.com'
        mockAuthHelperFunctions[
            AuthHelpers.LoginPasswordlessUser
        ].mutateAsync.mockRejectedValueOnce(
            Object.assign(new Error('Too many requests'), {response: {status: 429}})
        )
        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(
                `/passwordless-login-landing?token=${token}&login_id=${encodeURIComponent(loginId)}`
            )
        )
        const {findByText} = renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfig.app
            }
        })

        expect(await findByText(/You reached the limit for login attempts/i)).toBeInTheDocument()
    })

    test('landing path changes based on config', async () => {
        const token = '44444444'
        const loginId = 'shopper@example.com'
        const customLandingPath = '/custom-passwordless-login-landing'
        const mockConfigWithCustomLandingPath = {
            ...mockConfig,
            app: {
                ...mockConfig.app,
                login: {
                    ...mockConfig.app.login,
                    passwordless: {
                        ...mockConfig.app.login.passwordless,
                        enabled: true,
                        landingPath: customLandingPath
                    }
                }
            }
        }

        getConfig.mockReturnValue(mockConfigWithCustomLandingPath)

        window.history.pushState(
            {},
            'Passwordless Login Landing',
            createPathWithDefaults(
                `${customLandingPath}?token=${token}&login_id=${encodeURIComponent(loginId)}`
            )
        )
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {
                siteAlias: 'uk',
                locale: {id: 'en-GB'},
                appConfig: mockConfigWithCustomLandingPath.app
            }
        })

        expect(
            mockAuthHelperFunctions[AuthHelpers.LoginPasswordlessUser].mutateAsync
        ).toHaveBeenCalledWith({
            pwdlessLoginToken: token,
            login_id: loginId,
            channel_id: 'site-1'
        })
    })
})
