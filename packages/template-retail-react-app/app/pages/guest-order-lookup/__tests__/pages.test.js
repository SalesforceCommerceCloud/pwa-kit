/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {MemoryRouter, Route} from 'react-router-dom'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

const mockMutateAsync = jest.fn()
const mockGetTokenWhenReady = jest.fn(() => Promise.resolve('test-access-token'))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useCustomerType: jest.fn(() => ({isRegistered: false, isGuest: true})),
    useShopperOrdersMutation: jest.fn(() => ({
        mutateAsync: mockMutateAsync,
        isLoading: false
    })),
    useAccessToken: jest.fn(() => ({
        token: 'test-token',
        getTokenWhenReady: mockGetTokenWhenReady
    }))
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useCustomerType} from '@salesforce/commerce-sdk-react'
import GuestOrderLookupRequest from '@salesforce/retail-react-app/app/pages/guest-order-lookup/request'
import GuestOrderLookupVerify from '@salesforce/retail-react-app/app/pages/guest-order-lookup/verify'
import GuestOrderLookupOrder from '@salesforce/retail-react-app/app/pages/guest-order-lookup/order'

// Helper to render verify page with router state
const renderVerifyWithState = (state = {orderNo: 'ABC123', email: 'test@example.com'}) => {
    return renderWithProviders(
        <MemoryRouter initialEntries={[{pathname: '/order-lookup/verify', state}]}>
            <Route path="/order-lookup/verify" component={GuestOrderLookupVerify} />
            <Route path="/order-lookup" exact component={GuestOrderLookupRequest} />
            <Route path="/order-lookup/order" render={() => <div>Order Details Page</div>} />
        </MemoryRouter>
    )
}

const guestOrderLookupConfig = {
    ...mockConfig,
    app: {
        ...mockConfig.app,
        guestOrderLookup: {
            enabled: true,
            orderNumberRegex: '^[A-Za-z0-9]{6,20}$'
        }
    }
}

describe('GuestOrderLookupRequest', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockMutateAsync.mockResolvedValue({})
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        getConfig.mockReturnValue(guestOrderLookupConfig)
    })

    test('renders heading and form fields for guest users', () => {
        renderWithProviders(<GuestOrderLookupRequest />)
        expect(screen.getByText('Find Your Order')).toBeInTheDocument()
        expect(screen.getByLabelText('Order Number')).toBeInTheDocument()
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /send access code/i})).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup']}>
                <Route path="/order-lookup" component={GuestOrderLookupRequest} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
        expect(screen.queryByText('Find Your Order')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })

    test('shows validation error when order number is empty', async () => {
        const user = userEvent.setup()
        renderWithProviders(<GuestOrderLookupRequest />)
        await user.click(screen.getByRole('button', {name: /send access code/i}))
        await waitFor(() => {
            expect(screen.getByText('Order number is required')).toBeInTheDocument()
        })
    })

    test('shows validation error when email is empty', async () => {
        const user = userEvent.setup()
        renderWithProviders(<GuestOrderLookupRequest />)
        const orderInput = screen.getByLabelText('Order Number')
        await user.type(orderInput, 'ABC123')
        await user.click(screen.getByRole('button', {name: /send access code/i}))
        await waitFor(() => {
            expect(screen.getByText('Email address is required')).toBeInTheDocument()
        })
    })

    test('shows validation error when order number does not match regex', async () => {
        const user = userEvent.setup()
        renderWithProviders(<GuestOrderLookupRequest />)
        const orderInput = screen.getByLabelText('Order Number')
        await user.type(orderInput, '!!!')
        const emailInput = screen.getByLabelText('Email Address')
        await user.type(emailInput, 'test@example.com')
        await user.click(screen.getByRole('button', {name: /send access code/i}))
        await waitFor(() => {
            expect(screen.getByText('Enter a valid order number')).toBeInTheDocument()
        })
    })

    test('calls mutation with correct args on submit', async () => {
        const user = userEvent.setup()
        renderWithProviders(
            <MemoryRouter>
                <GuestOrderLookupRequest />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Order Number'), 'ABC123')
        await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
        await user.click(screen.getByRole('button', {name: /send access code/i}))
        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {orderNo: 'ABC123'},
                body: {email: 'test@example.com'}
            })
        })
    })

    test('navigates to /order-lookup/verify on successful mutation (202)', async () => {
        mockMutateAsync.mockResolvedValue({})
        const user = userEvent.setup()
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup']}>
                <Route path="/order-lookup" exact component={GuestOrderLookupRequest} />
                <Route
                    path="/order-lookup/verify"
                    render={({location}) => (
                        <div data-testid="verify-page">
                            verify-{location.state?.orderNo}-{location.state?.email}
                        </div>
                    )}
                />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Order Number'), 'ABC123')
        await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
        await user.click(screen.getByRole('button', {name: /send access code/i}))
        await waitFor(() => {
            expect(screen.getByTestId('verify-page')).toBeInTheDocument()
            expect(screen.getByTestId('verify-page').textContent).toContain('ABC123')
            expect(screen.getByTestId('verify-page').textContent).toContain('test@example.com')
        })
    })

    test('anti-enumeration: routes to verify on non-400 error response', async () => {
        mockMutateAsync.mockRejectedValue({response: {status: 500}})
        const user = userEvent.setup()
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup']}>
                <Route path="/order-lookup" exact component={GuestOrderLookupRequest} />
                <Route
                    path="/order-lookup/verify"
                    render={() => <div data-testid="verify-page">verify</div>}
                />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Order Number'), 'ABC123')
        await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
        await user.click(screen.getByRole('button', {name: /send access code/i}))
        await waitFor(() => {
            expect(screen.getByTestId('verify-page')).toBeInTheDocument()
        })
    })

    test('anti-enumeration: routes to verify on 400 error response', async () => {
        mockMutateAsync.mockRejectedValue({response: {status: 400}})
        const user = userEvent.setup()
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup']}>
                <Route path="/order-lookup" exact component={GuestOrderLookupRequest} />
                <Route
                    path="/order-lookup/verify"
                    render={() => <div data-testid="verify-page">verify</div>}
                />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Order Number'), 'ABC123')
        await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
        await user.click(screen.getByRole('button', {name: /send access code/i}))
        await waitFor(() => {
            expect(screen.getByTestId('verify-page')).toBeInTheDocument()
        })
    })
})

describe('GuestOrderLookupVerify', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockMutateAsync.mockResolvedValue({})
        mockGetTokenWhenReady.mockResolvedValue('test-access-token')
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        global.fetch = jest.fn().mockResolvedValue({ok: true, status: 200})
        getConfig.mockReturnValue(guestOrderLookupConfig)
    })

    test('renders heading and code input for guest users with valid router state', () => {
        renderVerifyWithState()
        expect(screen.getByText('Enter Your Access Code')).toBeInTheDocument()
        expect(screen.getByLabelText('Access Code')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /verify code/i})).toBeInTheDocument()
    })

    test('shows email in subtext', () => {
        renderVerifyWithState({orderNo: 'ABC123', email: 'user@test.com'})
        expect(screen.getByText(/user@test\.com/)).toBeInTheDocument()
    })

    test('redirects to /order-lookup when router state is missing', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={[{pathname: '/order-lookup/verify', state: null}]}>
                <Route path="/order-lookup/verify" component={GuestOrderLookupVerify} />
                <Route path="/order-lookup" exact render={() => <div>Request Page</div>} />
            </MemoryRouter>
        )
        expect(screen.getByText('Request Page')).toBeInTheDocument()
    })

    test('redirects to /order-lookup when orderNo is missing from state', () => {
        renderWithProviders(
            <MemoryRouter
                initialEntries={[{pathname: '/order-lookup/verify', state: {email: 'a@b.com'}}]}
            >
                <Route path="/order-lookup/verify" component={GuestOrderLookupVerify} />
                <Route path="/order-lookup" exact render={() => <div>Request Page</div>} />
            </MemoryRouter>
        )
        expect(screen.getByText('Request Page')).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter
                initialEntries={[
                    {pathname: '/order-lookup/verify', state: {orderNo: 'ABC', email: 'a@b.com'}}
                ]}
            >
                <Route path="/order-lookup/verify" component={GuestOrderLookupVerify} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
        expect(screen.queryByText('Enter Your Access Code')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })

    test('shows validation error when code is empty', async () => {
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Access code is required')).toBeInTheDocument()
        })
    })

    test('shows validation error when code is not 6 digits', async () => {
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '123')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Enter the 6-digit code from your email')).toBeInTheDocument()
        })
    })

    test('calls verify endpoint with correct body and Authorization header on submit', async () => {
        global.fetch.mockResolvedValue({ok: true, status: 200})
        const user = userEvent.setup()
        renderVerifyWithState({orderNo: 'ABC123', email: 'test@example.com'})
        await user.type(screen.getByLabelText('Access Code'), '123456')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/verify',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-access-token'
                    }),
                    body: JSON.stringify({
                        orderNo: 'ABC123',
                        email: 'test@example.com',
                        accessCode: '123456'
                    })
                })
            )
        })
    })

    test('navigates to /order-lookup/order on 200 response', async () => {
        global.fetch.mockResolvedValue({ok: true, status: 200})
        const user = userEvent.setup()
        renderWithProviders(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/order-lookup/verify',
                        state: {orderNo: 'ABC123', email: 'test@example.com'}
                    }
                ]}
            >
                <Route path="/order-lookup/verify" component={GuestOrderLookupVerify} />
                <Route path="/order-lookup/order" render={() => <div>Order Page</div>} />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Access Code'), '123456')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Order Page')).toBeInTheDocument()
        })
    })

    test('shows invalid code error on 404 response', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 404})
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(
                screen.getByText('Code invalid or expired. Please try again or request a new code.')
            ).toBeInTheDocument()
        })
    })

    test('shows too many attempts error on 429 response', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 429})
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(
                screen.getByText('Too many attempts. Please wait a moment and try again.')
            ).toBeInTheDocument()
        })
    })

    test('shows generic error on 500 response', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
    })

    test('shows generic error when fetch throws', async () => {
        global.fetch.mockRejectedValue(new Error('network error'))
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
    })

    test('resend code fires mutation with correct args', async () => {
        const user = userEvent.setup()
        renderVerifyWithState({orderNo: 'ABC123', email: 'test@example.com'})
        await user.click(screen.getByText('Resend code'))
        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {orderNo: 'ABC123'},
                body: {email: 'test@example.com'}
            })
        })
    })

    test('resend code briefly disables the link to prevent rapid-fire clicks', async () => {
        const user = userEvent.setup()
        renderVerifyWithState()
        const resendLink = screen.getByText('Resend code')
        await user.click(resendLink)
        await waitFor(() => {
            expect(resendLink).toHaveAttribute('aria-disabled', 'true')
        })
    })
})

describe('GuestOrderLookupOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue(guestOrderLookupConfig)
    })

    test('renders heading for guest users', () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<GuestOrderLookupOrder />)
        expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup/order']}>
                <Route path="/order-lookup/order" component={GuestOrderLookupOrder} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })
})
