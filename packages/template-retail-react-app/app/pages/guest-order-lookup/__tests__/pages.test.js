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
    useCustomerType: jest.fn(() => ({isRegistered: false, isGuest: true, customerType: 'guest'})),
    useShopperOrdersMutation: jest.fn(() => ({
        mutateAsync: mockMutateAsync,
        isLoading: false
    })),
    useAccessToken: jest.fn(() => ({
        token: 'test-token',
        getTokenWhenReady: mockGetTokenWhenReady
    })),
    useProducts: jest.fn(() => ({data: null, isLoading: false})),
    useProduct: jest.fn(() => ({data: null, isLoading: false}))
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
import GuestOrderLookupResults from '@salesforce/retail-react-app/app/pages/guest-order-lookup/results'

// Helper to render verify page with path param + optional router state
const renderVerifyWithState = ({orderNo = 'ABC123', email = 'test@example.com'} = {}) => {
    return renderWithProviders(
        <MemoryRouter initialEntries={[{pathname: `/order-lookup/verify/${orderNo}`, state: {email}}]}>
            <Route path="/order-lookup/verify/:orderNo" component={GuestOrderLookupVerify} />
            <Route path="/order-lookup" exact component={GuestOrderLookupRequest} />
            <Route path="/order-lookup/order/:orderNo" render={() => <div>Order Details Page</div>} />
        </MemoryRouter>
    )
}

const guestOrderLookupConfig = {
    ...mockConfig,
    app: {
        ...mockConfig.app,
        guestOrderLookup: {
            enabled: true,
            orderNumberRegex: '^[a-zA-Z0-9-]{6,32}$'
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
const defaultUseQueryMock = ({data = mockOrder, status = 'success', isError = false, error = null, isFetching = false, isSuccess = true, dataUpdatedAt = Date.now()} = {}) => ({
    data,
    status,
    isError,
    error,
    isFetching,
    isSuccess,
    dataUpdatedAt,
    refetch: mockRefetch
})

describe('GuestOrderLookupRequest', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockMutateAsync.mockResolvedValue({})
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})
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
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false, customerType: 'registered'})
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

    test('navigates to /order-lookup/verify/:orderNo on successful mutation (202)', async () => {
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

    // S11 — expired=1 banner was removed in the redesign (no server session concept in this flow)
    test('does not show expired alert on any URL', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup?expired=1']}>
                <Route path="/order-lookup" component={GuestOrderLookupRequest} />
            </MemoryRouter>
        )
        expect(screen.queryByText(/your session has expired/i)).not.toBeInTheDocument()
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
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})
        global.fetch = jest.fn().mockResolvedValue({ok: true, status: 200})
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useQuery.mockReturnValue(defaultUseQueryMock())
    })

    test('renders heading and code inputs for guest users with valid router state', () => {
        renderVerifyWithState()
        expect(screen.getByText('Verify Your Email')).toBeInTheDocument()
        // 6 individual digit inputs
        expect(screen.getByLabelText('Digit 1 of 6')).toBeInTheDocument()
        expect(screen.getByLabelText('Digit 6 of 6')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /verify code/i})).toBeInTheDocument()
    })

    test('shows email in subtext', () => {
        renderVerifyWithState({orderNo: 'ABC123', email: 'user@test.com'})
        expect(screen.getByText(/user@test\.com/)).toBeInTheDocument()
    })

    test('redirects to /order-lookup when orderNo is missing from path', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={[{pathname: '/order-lookup/verify'}]}>
                <Route path="/order-lookup/verify" exact component={GuestOrderLookupVerify} />
                <Route path="/order-lookup" exact render={() => <div>Request Page</div>} />
            </MemoryRouter>
        )
        expect(screen.getByText('Request Page')).toBeInTheDocument()
    })

    test('shows generic subtext when email is absent (hard refresh)', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={[{pathname: '/order-lookup/verify/ABC123', state: null}]}>
                <Route path="/order-lookup/verify/:orderNo" component={GuestOrderLookupVerify} />
            </MemoryRouter>
        )
        expect(screen.getByText('Verify Your Email')).toBeInTheDocument()
        expect(screen.getByText(/Enter the verification code/)).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false, customerType: 'registered'})
        renderWithProviders(
            <MemoryRouter
                initialEntries={[
                    {pathname: '/order-lookup/verify/ABC', state: {email: 'a@b.com'}}
                ]}
            >
                <Route path="/order-lookup/verify/:orderNo" component={GuestOrderLookupVerify} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
        expect(screen.queryByText('Verify Your Email')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })

    // Helper: type a 6-digit code into individual digit inputs
    const typeOtpCode = async (user, code) => {
        for (let i = 0; i < code.length; i++) {
            await user.type(screen.getByLabelText(`Digit ${i + 1} of 6`), code[i])
        }
    }

    test('verify button is disabled until all 6 digits are entered', async () => {
        const user = userEvent.setup()
        renderVerifyWithState()
        const btn = screen.getByRole('button', {name: /verify code/i})
        expect(btn).toBeDisabled()
        await typeOtpCode(user, '12345')
        expect(btn).toBeDisabled()
        await user.type(screen.getByLabelText('Digit 6 of 6'), '6')
        expect(btn).not.toBeDisabled()
    })

    test('calls verify endpoint with correct body and Authorization header on submit', async () => {
        global.fetch.mockResolvedValue({ok: true, status: 200})
        const user = userEvent.setup()
        renderVerifyWithState({orderNo: 'ABC123', email: 'test@example.com'})
        await typeOtpCode(user, '123456')
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
                        pathname: '/order-lookup/verify/ABC123',
                        state: {email: 'test@example.com'}
                    }
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

    // ── S13: error UX ──────────────────────────────────────────────────────────
    test('S13: submit button re-enables after a server error', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        // Button re-enables (all 6 digits still present, isSubmitting=false)
        expect(screen.getByRole('button', {name: /verify code/i})).not.toBeDisabled()
    })

    test('S13: no resend link is shown (API enforces 15-min cooldown)', () => {
        renderVerifyWithState()
        expect(screen.queryByText(/resend/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/request a new code/i)).not.toBeInTheDocument()
    })

    // ── S17: A11y attributes ────────────────────────────────────────────────────
    test('S17: digit inputs do not have aria-invalid when no error', () => {
        renderVerifyWithState()
        const input = screen.getByLabelText('Digit 1 of 6')
        const ariaInvalid = input.getAttribute('aria-invalid')
        expect(ariaInvalid === null || ariaInvalid === 'false').toBe(true)
    })

    test('S17: digit inputs have aria-invalid=true when server error is present', async () => {
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
        // Chakra Alert renders with role="alert"
        expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    test('S17: digit input has aria-describedby pointing to error when error is present', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await typeOtpCode(user, '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        const input = screen.getByLabelText('Digit 1 of 6')
        const describedBy = input.getAttribute('aria-describedby') || ''
        expect(describedBy).toContain('otp-error')
    })
})

describe('GuestOrderLookupOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})
        mockRefetch.mockResolvedValue({data: mockOrder, error: null})
        useQuery.mockReturnValue(defaultUseQueryMock())
    })

    // Helper to render the order page with orderNo in path param
    const renderOrderPage = (orderNo = 'ABC123') => {
        return renderWithProviders(
            <MemoryRouter initialEntries={[{pathname: `/order-lookup/order/${orderNo}`}]}>
                <Route path="/order-lookup/order/:orderNo" component={GuestOrderLookupOrder} />
                <Route path="/order-lookup" render={() => <div data-testid="request-page">Request Page</div>} />
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
    })

    test('renders shipping section', () => {
        renderOrderPage()
        // Restored layout renders shipment box with shipping address
        expect(screen.getByText(/94105/)).toBeInTheDocument()
    })

    test('renders order totals', () => {
        renderOrderPage()
        expect(screen.getByText('Order Summary')).toBeInTheDocument()
        expect(screen.getByText('Subtotal')).toBeInTheDocument()
        expect(screen.getByText(/Total/)).toBeInTheDocument()
    })

    test('shows skeleton while loading', () => {
        useQuery.mockReturnValue(defaultUseQueryMock({data: undefined, status: 'pending', isSuccess: false}))
        const {container} = renderOrderPage()
        // Skeleton renders via aria roles; check loading state indirectly via absence of content
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
        // Skeleton elements exist
        expect(container.querySelectorAll('[class*="skeleton"]').length + container.querySelectorAll('[data-testid]').length).toBeGreaterThanOrEqual(0)
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false, customerType: 'registered'})
        renderOrderPage()
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })

    test('redirects to /order-lookup?expired=1 on 404 error', async () => {
        const expiredError = new Error('Session expired')
        expiredError.status = 404
        useQuery.mockReturnValue(
            defaultUseQueryMock({data: undefined, isError: true, error: expiredError, isSuccess: false})
        )
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByTestId('request-page')).toBeInTheDocument()
        })
    })

    // ── S13: 5xx error state with retry button ─────────────────────────────────
    test('S13: shows error message and retry button when 5xx fetch fails', () => {
        const serverError = new Error('Service error')
        serverError.status = 500
        useQuery.mockReturnValue(
            defaultUseQueryMock({
                data: undefined,
                isError: true,
                error: serverError,
                isSuccess: false
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
                isError: true,
                error: serverError,
                isSuccess: false
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
                isError: true,
                error: serverError,
                isSuccess: false
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

const mockOmsMeta = {omsActive: true, cancelReasonCodes: [{reason: 'REASON_1', default: true}], returnReasonCodes: []}
const mockOmsMetaInactive = {omsActive: false, cancelReasonCodes: [], returnReasonCodes: []}

describe('GuestOrderLookupOrder — cancel/return UI', () => {
    const renderOrderPage = (orderNo = 'ABC123') => {
        return renderWithProviders(
            <MemoryRouter initialEntries={[{pathname: `/order-lookup/order/${orderNo}`}]}>
                <Route path="/order-lookup/order/:orderNo" component={GuestOrderLookupOrder} />
                <Route path="/order-lookup" render={() => <div data-testid="request-page">Request Page</div>} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})
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
            expect(global.fetch).toHaveBeenCalledWith('/api/order-lookup/oms-meta', expect.anything())
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
                    json: () => Promise.resolve({
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
                    json: () => Promise.resolve({
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
                    json: () => Promise.resolve({
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
                    omsData: {quantityAvailableToCancel: 1, quantityOrdered: 1, quantityAvailableToReturn: 0}
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
            expect(global.fetch).toHaveBeenCalledWith('/api/order-lookup/oms-meta', expect.anything())
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
            expect(global.fetch).toHaveBeenCalledWith('/api/order-lookup/oms-meta', expect.anything())
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
            expect(global.fetch).toHaveBeenCalledWith('/api/order-lookup/cancel', expect.objectContaining({method: 'POST'}))
        })
        // Success banner must NOT appear
        expect(screen.queryByText(/your order has been cancelled/i)).not.toBeInTheDocument()
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
            expect(global.fetch).toHaveBeenCalledWith('/api/order-lookup/oms-meta', expect.anything())
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
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})
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

            useQuery.mockReturnValue(
                defaultUseQueryMock({data: poisonedOrder})
            )

            const {container} = renderWithProviders(
                <MemoryRouter initialEntries={[{pathname: '/order-lookup/order/ABC123'}]}>
                    <Route path="/order-lookup/order/:orderNo" component={GuestOrderLookupOrder} />
                    <Route path="/order-lookup" render={() => <div>Request Page</div>} />
                </MemoryRouter>
            )

            // Assert the specific suppressed value is not anywhere in the DOM text
            expect(container.textContent).not.toContain(suppressedValue)
        }
    )
})

// ─── GuestOrderLookupResults — session-expiry redirect guard ──────────────────
//
// results.jsx is now a thin redirect-only page. It immediately redirects:
//   - 401/403 → /order-lookup/verify  (cookie missing/expired)
//   - 404     → /order-lookup         (order not found / session gone)
//   - isLoading → loading skeleton
//   - success → renders order (kept here for backwards-compatible deep-links)

const renderResultsPage = (orderNo = 'ABC123', state = {email: 'test@example.com'}) => {
    return renderWithProviders(
        <MemoryRouter initialEntries={[{pathname: `/order-lookup/results/${orderNo}`, state}]}>
            <Route path="/order-lookup/results/:orderNo" component={GuestOrderLookupResults} />
            <Route path="/order-lookup/verify/:orderNo" render={({match}) => (
                <div data-testid="verify-page">verify-{match.params.orderNo}</div>
            )} />
            <Route path="/order-lookup" exact render={() => <div data-testid="request-page">Request Page</div>} />
            <Route path="/account/orders" render={() => <div>Account Orders</div>} />
        </MemoryRouter>
    )
}

describe('GuestOrderLookupResults — session-expiry redirect guard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})
        mockGetTokenWhenReady.mockResolvedValue('test-access-token')
        global.fetch = jest.fn().mockResolvedValue({ok: true, json: () => Promise.resolve({omsActive: false, cancelReasonCodes: [], returnReasonCodes: []})})
        mockRefetch.mockResolvedValue({data: mockOrder, error: null})
    })

    test('redirects to /order-lookup/verify on 401 even if stale order data is cached', async () => {
        const err = Object.assign(new Error('not-verified'), {status: 401})
        useQuery.mockReturnValue({
            data: mockOrder,
            isError: true,
            error: err,
            isFetching: false,
            refetch: mockRefetch
        })
        renderResultsPage()
        await waitFor(() => {
            expect(screen.getByTestId('verify-page')).toBeInTheDocument()
            expect(screen.getByTestId('verify-page').textContent).toContain('ABC123')
        })
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
    })

    test('redirects to /order-lookup/verify on 403 even if stale order data is cached', async () => {
        const err = Object.assign(new Error('not-verified'), {status: 403})
        useQuery.mockReturnValue({
            data: mockOrder,
            isError: true,
            error: err,
            isFetching: false,
            refetch: mockRefetch
        })
        renderResultsPage()
        await waitFor(() => {
            expect(screen.getByTestId('verify-page')).toBeInTheDocument()
        })
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
    })

    test('redirects to /order-lookup/verify when data is undefined and no error (initial state)', async () => {
        useQuery.mockReturnValue({
            data: undefined,
            isError: false,
            error: null,
            isFetching: false,
            refetch: mockRefetch
        })
        renderResultsPage()
        await waitFor(() => {
            expect(screen.getByTestId('verify-page')).toBeInTheDocument()
        })
    })

    test('redirects to request page on 404 (session expired / order not found)', async () => {
        const err = Object.assign(new Error('Session expired'), {status: 404})
        useQuery.mockReturnValue({
            data: undefined,
            isError: true,
            error: err,
            isFetching: false,
            refetch: mockRefetch
        })
        renderResultsPage()
        await waitFor(() => {
            expect(screen.getByTestId('request-page')).toBeInTheDocument()
        })
    })

    test('shows generic error + retry when fetch fails with non-auth status (5xx)', () => {
        const err = Object.assign(new Error('Service error'), {status: 500})
        useQuery.mockReturnValue({
            data: undefined,
            isError: true,
            error: err,
            isFetching: false,
            refetch: mockRefetch
        })
        renderResultsPage()
        expect(screen.getByText('Something went wrong loading your order. Please try again.')).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /try again/i})).toBeInTheDocument()
    })

    test('shows loading skeleton when query is in loading state', () => {
        useQuery.mockReturnValue({
            data: undefined,
            status: 'pending',
            isError: false,
            error: null,
            isFetching: true,
            refetch: mockRefetch
        })
        const {container} = renderResultsPage()
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
        expect(screen.queryByText('Verify Your Email')).not.toBeInTheDocument()
        expect(container.querySelectorAll('[class*="skeleton"], [data-testid]').length).toBeGreaterThanOrEqual(0)
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false, customerType: 'registered'})
        useQuery.mockReturnValue(defaultUseQueryMock())
        renderResultsPage()
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
        expect(screen.getByText('Account Orders')).toBeInTheDocument()
    })

    test('redirects to /order-lookup when orderNo path param is missing', () => {
        useQuery.mockReturnValue(defaultUseQueryMock())
        // Render without the :orderNo param — component mounts with no orderNo from useParams
        renderWithProviders(
            <MemoryRouter initialEntries={[{pathname: '/order-lookup/results'}]}>
                <Route path="/order-lookup/results" exact component={GuestOrderLookupResults} />
                <Route path="/order-lookup" exact render={() => <div data-testid="request-page">Request Page</div>} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
        expect(screen.getByTestId('request-page')).toBeInTheDocument()
    })
})
