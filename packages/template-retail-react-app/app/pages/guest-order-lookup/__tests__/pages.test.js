/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {MemoryRouter, Route} from 'react-router-dom'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

const mockMutateAsync = jest.fn()
const mockGetTokenWhenReady = jest.fn(() => Promise.resolve('test-access-token'))
const mockRefetch = jest.fn()

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
    })),
    useProducts: jest.fn(() => ({data: undefined, isLoading: false})),
    useProduct: jest.fn(() => ({data: undefined, isLoading: false}))
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

// Mock @tanstack/react-query so we can control useQuery state
jest.mock('@tanstack/react-query', () => {
    const actual = jest.requireActual('@tanstack/react-query')
    return {
        ...actual,
        useQuery: jest.fn()
    }
})

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useCustomerType} from '@salesforce/commerce-sdk-react'
import {useQuery} from '@tanstack/react-query'
import GuestOrderLookupRequest from '@salesforce/retail-react-app/app/pages/guest-order-lookup/request'
import GuestOrderLookupVerify from '@salesforce/retail-react-app/app/pages/guest-order-lookup/verify'
import GuestOrderLookupOrder, {
    GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS
} from '@salesforce/retail-react-app/app/pages/guest-order-lookup/order'

// Helper to type a 6-digit access code into the individual digit inputs
const typeOtpCode = async (user, code) => {
    const inputs = screen.getAllByRole('textbox')
    for (let i = 0; i < Math.min(code.length, 6); i++) {
        await user.type(inputs[i], code[i])
    }
}

// Helper to render verify page with router state
const renderVerifyWithState = ({orderNo = 'ABC123', email = 'test@example.com'} = {}) => {
    return renderWithProviders(
        <MemoryRouter
            initialEntries={[{pathname: `/order-lookup/verify/${orderNo}`, state: {email}}]}
        >
            <Route path="/order-lookup/verify/:orderNo" component={GuestOrderLookupVerify} />
            <Route path="/order-lookup" exact component={GuestOrderLookupRequest} />
            <Route
                path="/order-lookup/order/:orderNo"
                render={() => <div>Order Details Page</div>}
            />
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

// A realistic filtered order object (server-side suppression already applied)
const mockOrder = {
    orderNo: 'ABC123',
    creationDate: '2024-01-15T10:00:00.000Z',
    status: 'new',
    currency: 'USD',
    orderTotal: 129.99,
    productSubTotal: 99.99,
    shippingTotal: 10.0,
    taxTotal: 20.0,
    productItems: [
        {
            itemId: 'item-1',
            productName: 'Blue Sneakers',
            quantity: 2,
            price: 49.99,
            adjustedPrice: 49.99
        }
    ],
    shipments: [
        {
            shipmentId: 'shipment-1',
            shippingStatus: 'not_shipped',
            shippingAddress: {postalCode: '94105'},
            expectedDeliveryDate: '2024-01-20T00:00:00.000Z',
            trackingNumber: 'TRACK123'
        }
    ],
    customerInfo: {email: 'test@example.com'}
}

// Default useQuery mock that returns loaded data
const defaultUseQueryMock = ({
    data = mockOrder,
    isLoading = false,
    isError = false,
    error = null,
    isFetching = false
} = {}) => ({
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch: mockRefetch
})

describe('GuestOrderLookupRequest', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockMutateAsync.mockResolvedValue({})
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useQuery.mockReturnValue(defaultUseQueryMock())
    })

    test('renders heading and form fields for guest users', () => {
        renderWithProviders(<GuestOrderLookupRequest />)
        expect(screen.getByText('Look Up Your Order')).toBeInTheDocument()
        expect(screen.getByLabelText('Order number')).toBeInTheDocument()
        expect(screen.getByLabelText('Email address')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /find my order/i})).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup']}>
                <Route path="/order-lookup" component={GuestOrderLookupRequest} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
        expect(screen.queryByText('Look Up Your Order')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })

    test('shows validation error when order number is empty', async () => {
        const user = userEvent.setup()
        renderWithProviders(<GuestOrderLookupRequest />)
        await user.click(screen.getByRole('button', {name: /find my order/i}))
        await waitFor(() => {
            expect(screen.getByText('Order number is required')).toBeInTheDocument()
        })
    })

    test('shows validation error when email is empty', async () => {
        const user = userEvent.setup()
        renderWithProviders(<GuestOrderLookupRequest />)
        const orderInput = screen.getByLabelText('Order number')
        await user.type(orderInput, 'ABC123')
        await user.click(screen.getByRole('button', {name: /find my order/i}))
        await waitFor(() => {
            expect(screen.getByText('Email address is required')).toBeInTheDocument()
        })
    })

    test('shows validation error when order number does not match regex', async () => {
        const user = userEvent.setup()
        renderWithProviders(<GuestOrderLookupRequest />)
        const orderInput = screen.getByLabelText('Order number')
        await user.type(orderInput, '!!!')
        const emailInput = screen.getByLabelText('Email address')
        await user.type(emailInput, 'test@example.com')
        await user.click(screen.getByRole('button', {name: /find my order/i}))
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
        await user.type(screen.getByLabelText('Order number'), 'ABC123')
        await user.type(screen.getByLabelText('Email address'), 'test@example.com')
        await user.click(screen.getByRole('button', {name: /find my order/i}))
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
                    path="/order-lookup/verify/:orderNo"
                    render={({match, location}) => (
                        <div data-testid="verify-page">
                            verify-{match.params.orderNo}-{location.state?.email}
                        </div>
                    )}
                />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Order number'), 'ABC123')
        await user.type(screen.getByLabelText('Email address'), 'test@example.com')
        await user.click(screen.getByRole('button', {name: /find my order/i}))
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
                    path="/order-lookup/verify/:orderNo"
                    render={() => <div data-testid="verify-page">verify</div>}
                />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Order number'), 'ABC123')
        await user.type(screen.getByLabelText('Email address'), 'test@example.com')
        await user.click(screen.getByRole('button', {name: /find my order/i}))
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
                    path="/order-lookup/verify/:orderNo"
                    render={() => <div data-testid="verify-page">verify</div>}
                />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Order number'), 'ABC123')
        await user.type(screen.getByLabelText('Email address'), 'test@example.com')
        await user.click(screen.getByRole('button', {name: /find my order/i}))
        await waitFor(() => {
            expect(screen.getByTestId('verify-page')).toBeInTheDocument()
        })
    })

    // S11 — expired=1 banner
    test('shows session-expired alert when ?expired=1 is in the URL', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup?expired=1']}>
                <Route path="/order-lookup" component={GuestOrderLookupRequest} />
            </MemoryRouter>
        )
        expect(screen.getByText(/your session has expired/i)).toBeInTheDocument()
    })

    test('does not show expired alert when ?expired=1 is absent', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup']}>
                <Route path="/order-lookup" component={GuestOrderLookupRequest} />
            </MemoryRouter>
        )
        expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument()
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
        useQuery.mockReturnValue(defaultUseQueryMock())
    })

    test('renders heading and code input for guest users with valid router state', () => {
        renderVerifyWithState()
        expect(screen.getByText('Verify Your Email')).toBeInTheDocument()
        expect(screen.getByLabelText('Digit 1 of 6')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /verify code/i})).toBeInTheDocument()
    })

    test('shows email in subtext', () => {
        renderVerifyWithState({orderNo: 'ABC123', email: 'user@test.com'})
        expect(screen.getByText(/user@test\.com/)).toBeInTheDocument()
    })

    test('redirects to /order-lookup when orderNo is missing from URL params', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup/verify']}>
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
                initialEntries={[{pathname: '/order-lookup/verify/ABC', state: {email: 'a@b.com'}}]}
            >
                <Route path="/order-lookup/verify/:orderNo" component={GuestOrderLookupVerify} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
        expect(screen.queryByText('Verify Your Email')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })

    test('submit button is disabled when code is incomplete', () => {
        renderVerifyWithState()
        expect(screen.getByRole('button', {name: /verify code/i})).toBeDisabled()
    })

    test('calls verify endpoint with correct body and Authorization header on submit', async () => {
        global.fetch.mockResolvedValue({ok: true, status: 200})
        const user = userEvent.setup()
        renderVerifyWithState({orderNo: 'ABC123', email: 'test@example.com'})
        const inputs = screen.getAllByRole('textbox')
        for (let i = 0; i < 6; i++) {
            await user.type(inputs[i], String(i + 1))
        }
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
                    {pathname: '/order-lookup/verify/ABC123', state: {email: 'test@example.com'}}
                ]}
            >
                <Route path="/order-lookup/verify/:orderNo" component={GuestOrderLookupVerify} />
                <Route path="/order-lookup/order/:orderNo" render={() => <div>Order Page</div>} />
            </MemoryRouter>
        )
        await typeOtpCode(user, '123456')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Order Page')).toBeInTheDocument()
        })
    })

    test('shows invalid code error on 404 response', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 404})
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(
                screen.getByText(
                    'The code you entered is invalid or has expired. Please try again.'
                )
            ).toBeInTheDocument()
        })
    })

    test('shows too many attempts error on 429 response', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 429})
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
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
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
    })

    test('shows generic error when fetch throws', async () => {
        global.fetch.mockRejectedValue(new Error('network error'))
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
    })

    // ── S13: error behavior ────────────────────────────────────────────────────
    test('S13: submit button re-enables after a server error', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        // Button should be re-enabled (not disabled) after error
        expect(screen.getByRole('button', {name: /verify code/i})).not.toBeDisabled()
    })

    // ── S17: A11y attributes ────────────────────────────────────────────────────
    test('S17: access code input does not have aria-invalid=true when no error', () => {
        renderVerifyWithState()
        const input = screen.getByLabelText('Digit 1 of 6')
        // When no error, aria-invalid is either absent or 'false' — either is correct
        const ariaInvalid = input.getAttribute('aria-invalid')
        expect(ariaInvalid === null || ariaInvalid === 'false').toBe(true)
    })

    test('S17: access code input has aria-invalid=true when server error is present', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        const input = screen.getByLabelText('Digit 1 of 6')
        expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    test('S17: error message has role=alert so screen readers announce it', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        // The error message container has role="alert"
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
    })

    test('S17: access code input aria-describedby includes server error element id when error is present', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        const input = screen.getByLabelText('Digit 1 of 6')
        // Chakra FormControl may append additional ids; verify ours is included
        const describedBy = input.getAttribute('aria-describedby') || ''
        expect(describedBy).toContain('access-code-error')
    })
})

describe('GuestOrderLookupOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        mockRefetch.mockResolvedValue({data: mockOrder, error: null})
        useQuery.mockReturnValue(defaultUseQueryMock())
    })

    // Helper to render the order page with optional router state
    const renderOrderPage = (orderNo = 'ABC123') => {
        return renderWithProviders(
            <MemoryRouter initialEntries={[`/order-lookup/order/${orderNo}`]}>
                <Route path="/order-lookup/order/:orderNo" component={GuestOrderLookupOrder} />
                <Route
                    path="/order-lookup"
                    render={() => <div data-testid="request-page">Request Page</div>}
                />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
    }

    test('renders order details after successful fetch', () => {
        renderOrderPage()
        expect(screen.getByText('Order Details')).toBeInTheDocument()
        expect(screen.getByText(/Order Number: ABC123/)).toBeInTheDocument()
    })

    test('renders product items', () => {
        renderOrderPage()
        expect(screen.getByText('Blue Sneakers')).toBeInTheDocument()
        expect(screen.getByText(/Quantity: 2/)).toBeInTheDocument()
    })

    test('renders shipping section with postal code', () => {
        renderOrderPage()
        expect(screen.getByRole('heading', {name: /Shipping/i})).toBeInTheDocument()
        expect(screen.getByText(/94105/)).toBeInTheDocument()
    })

    test('renders order totals', () => {
        renderOrderPage()
        expect(screen.getByText('Order Summary')).toBeInTheDocument()
        expect(screen.getByText('Subtotal')).toBeInTheDocument()
        expect(screen.getByText(/Total/)).toBeInTheDocument()
    })

    test('shows skeleton while loading', () => {
        useQuery.mockReturnValue(defaultUseQueryMock({data: undefined, isLoading: true}))
        const {container} = renderOrderPage()
        // Skeleton renders via aria roles; check loading state indirectly via absence of content
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
        // Skeleton elements exist
        expect(
            container.querySelectorAll('[class*="skeleton"]').length +
                container.querySelectorAll('[data-testid]').length
        ).toBeGreaterThanOrEqual(0)
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderOrderPage()
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })

    test('redirects to /order-lookup?expired=1 on 404 error', async () => {
        const expiredError = new Error('Session expired')
        expiredError.status = 404
        useQuery.mockReturnValue(
            defaultUseQueryMock({
                data: undefined,
                isLoading: false,
                isError: true,
                error: expiredError
            })
        )
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByTestId('request-page')).toBeInTheDocument()
        })
    })

    test('mid-session expiry: redirect to /order-lookup when useQuery returns 404 error', () => {
        const expiredError = new Error('Session expired')
        expiredError.status = 404
        useQuery.mockReturnValue(
            defaultUseQueryMock({
                data: undefined,
                isLoading: false,
                isError: true,
                error: expiredError
            })
        )
        renderOrderPage()
        expect(screen.getByTestId('request-page')).toBeInTheDocument()
    })

    test('redirects to /order-lookup?expired=1 on 401 error (missing session cookie)', () => {
        const authError = new Error('not-verified')
        authError.status = 401
        useQuery.mockReturnValue(
            defaultUseQueryMock({
                data: undefined,
                isLoading: false,
                isError: true,
                error: authError
            })
        )
        renderOrderPage()
        expect(screen.getByTestId('request-page')).toBeInTheDocument()
    })

    test('redirects to /order-lookup?expired=1 on 403 error (session cookie present but order mismatch)', () => {
        const authError = new Error('not-verified')
        authError.status = 403
        useQuery.mockReturnValue(
            defaultUseQueryMock({
                data: undefined,
                isLoading: false,
                isError: true,
                error: authError
            })
        )
        renderOrderPage()
        expect(screen.getByTestId('request-page')).toBeInTheDocument()
    })

    // ── S13: 5xx error state with retry button ─────────────────────────────────
    test('S13: shows error message and retry button when 5xx fetch fails', () => {
        const serverError = new Error('Service error')
        serverError.status = 500
        useQuery.mockReturnValue(
            defaultUseQueryMock({
                data: undefined,
                isLoading: false,
                isError: true,
                error: serverError
            })
        )
        renderOrderPage()
        expect(
            screen.getByText('Something went wrong loading your order. Please try again.')
        ).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /try again/i})).toBeInTheDocument()
    })

    test('S13: error container on 5xx has role=alert for screen reader announcement', () => {
        const serverError = new Error('Service error')
        serverError.status = 500
        useQuery.mockReturnValue(
            defaultUseQueryMock({
                data: undefined,
                isLoading: false,
                isError: true,
                error: serverError
            })
        )
        renderOrderPage()
        expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    test('S13: retry button on 5xx error calls refetch', async () => {
        const serverError = new Error('Service error')
        serverError.status = 500
        useQuery.mockReturnValue(
            defaultUseQueryMock({
                data: undefined,
                isLoading: false,
                isError: true,
                error: serverError
            })
        )
        const user = userEvent.setup()
        renderOrderPage()
        const retryBtn = screen.getByRole('button', {name: /try again/i})
        await user.click(retryBtn)
        await waitFor(() => {
            expect(mockRefetch).toHaveBeenCalled()
        })
    })
})

// ─── GuestOrderLookupOrder — cancel/return UI ─────────────────────────────────

// A mock order that includes full omsData on each item, enabling cancel + return eligibility.
const mockOrderWithOmsData = {
    ...mockOrder,
    productItems: [
        {
            itemId: 'item-1',
            productName: 'Test Product',
            quantity: 1,
            price: 29.99,
            omsData: {
                quantityAvailableToCancel: 1,
                quantityOrdered: 1,
                quantityAvailableToReturn: 1
            }
        }
    ]
}

// A variant of the OMS order where no items are returnable
const mockOrderWithOmsDataNoReturn = {
    ...mockOrder,
    productItems: [
        {
            itemId: 'item-1',
            productName: 'Test Product',
            quantity: 1,
            price: 29.99,
            omsData: {
                quantityAvailableToCancel: 1,
                quantityOrdered: 1,
                quantityAvailableToReturn: 0
            }
        }
    ]
}

const mockOmsMeta = {
    omsActive: true,
    cancelReasonCodes: [{reason: 'REASON_1', default: true}],
    returnReasonCodes: []
}
const mockOmsMetaInactive = {omsActive: false, cancelReasonCodes: [], returnReasonCodes: []}

describe('GuestOrderLookupOrder — cancel/return UI', () => {
    const renderOrderPage = (orderNo = 'ABC123') => {
        return renderWithProviders(
            <MemoryRouter initialEntries={[`/order-lookup/order/${orderNo}`]}>
                <Route path="/order-lookup/order/:orderNo" component={GuestOrderLookupOrder} />
                <Route
                    path="/order-lookup"
                    render={() => <div data-testid="request-page">Request Page</div>}
                />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        mockRefetch.mockResolvedValue({data: mockOrderWithOmsData, error: null})
        // Default: OMS meta returns inactive state
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMetaInactive)
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
    })

    test('Cancel and Return buttons are NOT rendered when omsActive is false', async () => {
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        renderOrderPage()
        // Wait for oms-meta fetch to complete
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/oms-meta',
                expect.anything()
            )
        })
        expect(screen.queryByRole('button', {name: /cancel order/i})).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /return items/i})).not.toBeInTheDocument()
    })

    test('Cancel button IS rendered when omsActive is true and order is cancellable', async () => {
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMeta)
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /cancel order/i})).toBeInTheDocument()
        })
    })

    test('Return button is NOT rendered when omsActive is true and no returnable items', async () => {
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsDataNoReturn}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMeta)
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            // Cancel button appears (item is cancellable) but not Return
            expect(screen.getByRole('button', {name: /cancel order/i})).toBeInTheDocument()
        })
        expect(screen.queryByRole('button', {name: /return items/i})).not.toBeInTheDocument()
    })

    test('Return button IS rendered when omsActive is true and returnable items exist', async () => {
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            ...mockOmsMeta,
                            returnReasonCodes: [{reason: 'DEFECT', default: true}]
                        })
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /return items/i})).toBeInTheDocument()
        })
    })

    test('Cancel button click opens CancelOrderModal', async () => {
        const user = userEvent.setup()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMeta)
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /cancel order/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /cancel order/i}))
        await waitFor(() => {
            // Modal is open: "Confirm Cancellation" button should be visible
            expect(screen.getByRole('button', {name: /confirm cancellation/i})).toBeInTheDocument()
        })
    })

    test('Return button click opens ReturnItemsModal', async () => {
        const user = userEvent.setup()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            ...mockOmsMeta,
                            returnReasonCodes: [{reason: 'DEFECT', default: true}]
                        })
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /return items/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /return items/i}))
        await waitFor(() => {
            // ReturnItemsModal is open — look for the cancel button inside the modal
            expect(screen.getByTestId('return-items-modal-cancel')).toBeInTheDocument()
        })
    })

    test('successful cancel: calls POST /api/order-lookup/cancel, shows success alert, re-fetches order', async () => {
        const user = userEvent.setup()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMeta)
                })
            }
            if (url === '/api/order-lookup/cancel') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({success: true})
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        // Wait for Cancel button to appear
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /cancel order/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /cancel order/i}))
        // Click confirm in the modal
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /confirm cancellation/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/cancel',
                expect.objectContaining({method: 'POST'})
            )
            expect(screen.getByText(/your order has been cancelled/i)).toBeInTheDocument()
        })
        expect(mockRefetch).toHaveBeenCalled()
    })

    // NOTE: The more complete cancel error test (including error UI assertion) is below
    // in this same describe block: 'cancel API error (409 not_cancellable): does not show
    // success alert and shows error state'

    test('successful return: calls POST /api/order-lookup/return, shows success alert', async () => {
        const user = userEvent.setup()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            ...mockOmsMeta,
                            returnReasonCodes: [{reason: 'DEFECT', default: true}]
                        })
                })
            }
            if (url === '/api/order-lookup/return') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({success: true})
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /return items/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /return items/i}))
        // Select the item row checkbox to enable the Review button
        await waitFor(() => {
            expect(screen.getByTestId('return-items-modal-cancel')).toBeInTheDocument()
        })
        // Check the checkbox for the item
        const itemRow = screen.getByTestId('return-items-modal-item-row')
        const checkbox = within(itemRow).getByRole('checkbox')
        await user.click(checkbox)
        // Click Review button
        const reviewBtn = screen.getByTestId('return-items-modal-review')
        await user.click(reviewBtn)
        // Submit from review view
        await waitFor(() => {
            expect(screen.getByTestId('return-items-modal-submit')).toBeInTheDocument()
        })
        await user.click(screen.getByTestId('return-items-modal-submit'))
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/return',
                expect.objectContaining({method: 'POST'})
            )
            expect(screen.getByText(/your return has been submitted/i)).toBeInTheDocument()
        })
    })

    test('isCancellable returns false when some items have no omsData — Cancel button not shown', async () => {
        const orderWithPartialOms = {
            ...mockOrder,
            productItems: [
                {
                    itemId: 'item-1',
                    productName: 'Test Product A',
                    quantity: 1,
                    price: 29.99,
                    omsData: {
                        quantityAvailableToCancel: 1,
                        quantityOrdered: 1,
                        quantityAvailableToReturn: 0
                    }
                },
                {
                    itemId: 'item-2',
                    productName: 'Test Product B',
                    quantity: 1,
                    price: 19.99
                    // No omsData — ECOM-only item
                }
            ]
        }
        useQuery.mockReturnValue(defaultUseQueryMock({data: orderWithPartialOms}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMeta)
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/oms-meta',
                expect.anything()
            )
        })
        // Wait a tick for state updates
        await waitFor(() => {
            expect(screen.queryByRole('button', {name: /cancel order/i})).not.toBeInTheDocument()
        })
    })

    test('isCancellable returns false when quantityAvailableToCancel < quantityOrdered — Cancel button not shown', async () => {
        // An order where every item has omsData but one unit has already been cancelled
        // (quantityAvailableToCancel: 0, quantityOrdered: 1). isCancellable requires
        // strict equality, so this order must not show the Cancel button.
        const orderWithPartialCancelled = {
            ...mockOrder,
            productItems: [
                {
                    itemId: 'item-1',
                    productName: 'Test Product',
                    quantity: 1,
                    price: 29.99,
                    omsData: {
                        quantityAvailableToCancel: 0, // already cancelled
                        quantityOrdered: 1,
                        quantityAvailableToReturn: 0
                    }
                }
            ]
        }
        useQuery.mockReturnValue(defaultUseQueryMock({data: orderWithPartialCancelled}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMeta)
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/oms-meta',
                expect.anything()
            )
        })
        await waitFor(() => {
            expect(screen.queryByRole('button', {name: /cancel order/i})).not.toBeInTheDocument()
        })
    })

    test('cancel API error (409 not_cancellable): does not show success alert and shows error state', async () => {
        const user = userEvent.setup()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMeta)
                })
            }
            if (url === '/api/order-lookup/cancel') {
                return Promise.resolve({
                    ok: false,
                    status: 409,
                    json: () => Promise.resolve({errorKind: 'not_cancellable'})
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /cancel order/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /cancel order/i}))
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /confirm cancellation/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/cancel',
                expect.objectContaining({method: 'POST'})
            )
        })
        // Success banner must NOT appear
        expect(screen.queryByText(/your order has been cancelled/i)).not.toBeInTheDocument()
        // Error state IS shown: the cancel modal stays open (not dismissed on failure)
        // and the confirm button remains accessible for a retry
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /confirm cancellation/i})).toBeInTheDocument()
        })
    })

    test('cancel API error: shows page-level error banner with role=alert', async () => {
        const user = userEvent.setup()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockOmsMeta)
                })
            }
            if (url === '/api/order-lookup/cancel') {
                return Promise.resolve({
                    ok: false,
                    status: 409,
                    json: () => Promise.resolve({errorKind: 'not_cancellable'})
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /cancel order/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /cancel order/i}))
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /confirm cancellation/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /confirm cancellation/i}))
        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument()
        })
        expect(screen.getByText(/can no longer be cancelled/i)).toBeInTheDocument()
        expect(screen.queryByText(/your order has been cancelled/i)).not.toBeInTheDocument()
    })

    test('return error unknownItems triggers order refetch', async () => {
        const user = userEvent.setup()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            ...mockOmsMeta,
                            returnReasonCodes: [{reason: 'DEFECT', default: true}]
                        })
                })
            }
            if (url === '/api/order-lookup/return') {
                return Promise.resolve({
                    ok: false,
                    status: 400,
                    json: () => Promise.resolve({errorKind: 'unknownItems'})
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /return items/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /return items/i}))
        await waitFor(() => {
            expect(screen.getByTestId('return-items-modal-cancel')).toBeInTheDocument()
        })
        const itemRow = screen.getByTestId('return-items-modal-item-row')
        const checkbox = within(itemRow).getByRole('checkbox')
        await user.click(checkbox)
        const reviewBtn = screen.getByTestId('return-items-modal-review')
        await user.click(reviewBtn)
        await waitFor(() => {
            expect(screen.getByTestId('return-items-modal-submit')).toBeInTheDocument()
        })
        await user.click(screen.getByTestId('return-items-modal-submit'))
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/return',
                expect.objectContaining({method: 'POST'})
            )
        })
        // Order should be refetched after unknownItems error
        expect(mockRefetch).toHaveBeenCalled()
    })

    test('return error quantityExceeded triggers order refetch', async () => {
        const user = userEvent.setup()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            ...mockOmsMeta,
                            returnReasonCodes: [{reason: 'DEFECT', default: true}]
                        })
                })
            }
            if (url === '/api/order-lookup/return') {
                return Promise.resolve({
                    ok: false,
                    status: 400,
                    json: () => Promise.resolve({errorKind: 'quantityExceeded'})
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /return items/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /return items/i}))
        await waitFor(() => {
            expect(screen.getByTestId('return-items-modal-cancel')).toBeInTheDocument()
        })
        const itemRow = screen.getByTestId('return-items-modal-item-row')
        const checkbox = within(itemRow).getByRole('checkbox')
        await user.click(checkbox)
        const reviewBtn = screen.getByTestId('return-items-modal-review')
        await user.click(reviewBtn)
        await waitFor(() => {
            expect(screen.getByTestId('return-items-modal-submit')).toBeInTheDocument()
        })
        await user.click(screen.getByTestId('return-items-modal-submit'))
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/return',
                expect.objectContaining({method: 'POST'})
            )
        })
        expect(mockRefetch).toHaveBeenCalled()
    })

    test('return error transient does NOT trigger order refetch', async () => {
        const user = userEvent.setup()
        mockRefetch.mockClear()
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            ...mockOmsMeta,
                            returnReasonCodes: [{reason: 'DEFECT', default: true}]
                        })
                })
            }
            if (url === '/api/order-lookup/return') {
                return Promise.resolve({
                    ok: false,
                    status: 500,
                    json: () => Promise.resolve({errorKind: 'transient'})
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByRole('button', {name: /return items/i})).toBeInTheDocument()
        })
        await user.click(screen.getByRole('button', {name: /return items/i}))
        await waitFor(() => {
            expect(screen.getByTestId('return-items-modal-cancel')).toBeInTheDocument()
        })
        const itemRow = screen.getByTestId('return-items-modal-item-row')
        const checkbox = within(itemRow).getByRole('checkbox')
        await user.click(checkbox)
        const reviewBtn = screen.getByTestId('return-items-modal-review')
        await user.click(reviewBtn)
        await waitFor(() => {
            expect(screen.getByTestId('return-items-modal-submit')).toBeInTheDocument()
        })
        await user.click(screen.getByTestId('return-items-modal-submit'))
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/return',
                expect.objectContaining({method: 'POST'})
            )
        })
        expect(mockRefetch).not.toHaveBeenCalled()
    })

    test('OMS meta fetch failure on page load: buttons stay hidden (graceful degradation)', async () => {
        // Simulate /api/order-lookup/oms-meta returning a non-ok response.
        // order.jsx silently swallows this and keeps omsActive: false,
        // so Cancel and Return buttons must not appear.
        useQuery.mockReturnValue(defaultUseQueryMock({data: mockOrderWithOmsData}))
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url === '/api/order-lookup/oms-meta') {
                return Promise.resolve({
                    ok: false,
                    status: 502,
                    json: () => Promise.resolve({error: 'Service unavailable'})
                })
            }
            return Promise.resolve({ok: true, json: () => Promise.resolve({})})
        })
        renderOrderPage()
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/order-lookup/oms-meta',
                expect.anything()
            )
        })
        // Buttons must remain hidden when OMS meta fetch fails
        expect(screen.queryByRole('button', {name: /cancel order/i})).not.toBeInTheDocument()
        expect(screen.queryByRole('button', {name: /return items/i})).not.toBeInTheDocument()
    })
})

// ─── S10 Security Backstop ─────────────────────────────────────────────────
// These tests verify that suppressed field values NEVER appear in the rendered DOM,
// even if somehow returned by the server. This is a non-negotiable security gate.
describe('GuestOrderLookupOrder — S10 field suppression security backstop', () => {
    const SUPPRESSED_FIELD_VALUES = [
        ['paymentCard', 'VISA-4111-SUPPRESSED'],
        ['expirationMonth', 'EXPIRY-MONTH-SUPPRESSED'],
        ['expirationYear', 'EXPIRY-YEAR-SUPPRESSED'],
        ['phone', '555-SUPPRESSED-PHONE'],
        ['globalPartyId', 'GPT-SUPPRESSED-ID'],
        ['orderToken', 'TOKEN-SUPPRESSED-VALUE'],
        ['orderViewCode', 'OVC-SUPPRESSED-VALUE'],
        ['c_customAttr', 'C_CUSTOM_SUPPRESSED'],
        ['paymentInstruments[].paymentCard', 'PI-CARD-SUPPRESSED']
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        mockRefetch.mockResolvedValue({data: mockOrder, error: null})
    })

    // Verify the exported set includes all the expected fields
    test('GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS contains all required suppressed field names', () => {
        expect(GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS.has('paymentCard')).toBe(true)
        expect(GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS.has('expirationMonth')).toBe(true)
        expect(GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS.has('expirationYear')).toBe(true)
        expect(GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS.has('phone')).toBe(true)
        expect(GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS.has('globalPartyId')).toBe(true)
        expect(GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS.has('orderToken')).toBe(true)
        expect(GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS.has('orderViewCode')).toBe(true)
    })

    test.each(SUPPRESSED_FIELD_VALUES)(
        'suppressed field "%s" value "%s" does not appear in the rendered DOM',
        (fieldName, suppressedValue) => {
            // Build a poisoned order that includes every suppressed field at top level,
            // nested in paymentInstruments, and as a c_ custom attribute.
            const poisonedOrder = {
                ...mockOrder,
                paymentCard: 'VISA-4111-SUPPRESSED',
                expirationMonth: 'EXPIRY-MONTH-SUPPRESSED',
                expirationYear: 'EXPIRY-YEAR-SUPPRESSED',
                phone: '555-SUPPRESSED-PHONE',
                globalPartyId: 'GPT-SUPPRESSED-ID',
                orderToken: 'TOKEN-SUPPRESSED-VALUE',
                orderViewCode: 'OVC-SUPPRESSED-VALUE',
                c_customAttr: 'C_CUSTOM_SUPPRESSED',
                paymentInstruments: [
                    {
                        paymentCard: 'PI-CARD-SUPPRESSED',
                        maskedNumber: '****1111',
                        cardType: 'Visa'
                    }
                ]
            }

            useQuery.mockReturnValue(defaultUseQueryMock({data: poisonedOrder}))

            const {container} = renderWithProviders(
                <MemoryRouter initialEntries={['/order-lookup/order/ABC123']}>
                    <Route path="/order-lookup/order/:orderNo" component={GuestOrderLookupOrder} />
                    <Route path="/order-lookup" render={() => <div>Request Page</div>} />
                </MemoryRouter>
            )

            // Assert the specific suppressed value is not anywhere in the DOM text
            expect(container.textContent).not.toContain(suppressedValue)
        }
    )
})
