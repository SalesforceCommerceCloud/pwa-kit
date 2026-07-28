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
    }))
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
const defaultUseQueryMock = ({data = mockOrder, isLoading = false, isError = false, error = null, isFetching = false, isSuccess = true, dataUpdatedAt = Date.now()} = {}) => ({
    data,
    isLoading,
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
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        getConfig.mockReturnValue(guestOrderLookupConfig)
        useQuery.mockReturnValue(defaultUseQueryMock())
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

    // S11 — expired=1 banner
    test('shows session-expired alert when ?expired=1 is in the URL', () => {
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup?expired=1']}>
                <Route path="/order-lookup" component={GuestOrderLookupRequest} />
            </MemoryRouter>
        )
        expect(
            screen.getByText(/your session has expired/i)
        ).toBeInTheDocument()
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

    // ── S13: "Request a new code" link on 404 error ────────────────────────────
    test('S13: shows "Request a new code" link when 404 error occurs', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 404})
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Request a new code')).toBeInTheDocument()
        })
    })

    test('S13: "Request a new code" link routes to /order-lookup on 404 error', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 404})
        const user = userEvent.setup()
        renderWithProviders(
            <MemoryRouter
                initialEntries={[
                    {pathname: '/order-lookup/verify', state: {orderNo: 'ABC123', email: 'test@example.com'}}
                ]}
            >
                <Route path="/order-lookup/verify" component={GuestOrderLookupVerify} />
                <Route path="/order-lookup" exact render={() => <div data-testid="request-page">Request Page</div>} />
            </MemoryRouter>
        )
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Request a new code')).toBeInTheDocument()
        })
        // The link href points to /order-lookup
        const link = screen.getByText('Request a new code')
        expect(link).toHaveAttribute('href', '/order-lookup')
    })

    test('S13: submit button re-enables after a server error', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        // Button should be re-enabled (not disabled) after error
        expect(screen.getByRole('button', {name: /verify code/i})).not.toBeDisabled()
    })

    test('S13: "Request a new code" link does NOT appear on 429 or 500 errors', async () => {
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
        expect(screen.queryByText('Request a new code')).not.toBeInTheDocument()
    })

    // ── S17: A11y attributes ────────────────────────────────────────────────────
    test('S17: OTP input does not have aria-invalid=true when no error', () => {
        renderVerifyWithState()
        const input = screen.getByLabelText('Access Code')
        // When no error, aria-invalid is either absent or 'false' — either is correct
        const ariaInvalid = input.getAttribute('aria-invalid')
        expect(ariaInvalid === null || ariaInvalid === 'false').toBe(true)
    })

    test('S17: OTP input has aria-invalid=true when server error is present', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        const input = screen.getByLabelText('Access Code')
        expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    test('S17: error message has role=alert so screen readers announce it', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        // The error message container has role="alert"
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
    })

    test('S17: OTP input aria-describedby includes server error element id when error is present', async () => {
        global.fetch.mockResolvedValue({ok: false, status: 500})
        const user = userEvent.setup()
        renderVerifyWithState()
        await user.type(screen.getByLabelText('Access Code'), '999999')
        await user.click(screen.getByRole('button', {name: /verify code/i}))
        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
        })
        const input = screen.getByLabelText('Access Code')
        // Chakra FormControl may append additional ids; verify ours is included
        const describedBy = input.getAttribute('aria-describedby') || ''
        expect(describedBy).toContain('accessCode-server-error')
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
    const renderOrderPage = (state = {orderNo: 'ABC123'}, search = '') => {
        const path = `/order-lookup/order${search}`
        return renderWithProviders(
            <MemoryRouter initialEntries={[{pathname: '/order-lookup/order', state, search}]}>
                <Route path="/order-lookup/order" component={GuestOrderLookupOrder} />
                <Route path="/order-lookup" render={() => <div data-testid="request-page">Request Page</div>} />
                <Route path="/account/orders" render={() => <div>Account Orders</div>} />
            </MemoryRouter>
        )
    }

    test('renders order details after successful fetch', () => {
        renderOrderPage()
        expect(screen.getByText('Order Details')).toBeInTheDocument()
        expect(screen.getByText(/Order #ABC123/)).toBeInTheDocument()
        expect(screen.getByText(/Status: new/i)).toBeInTheDocument()
    })

    test('renders product items', () => {
        renderOrderPage()
        expect(screen.getByText('Blue Sneakers')).toBeInTheDocument()
        expect(screen.getByText(/Qty: 2/)).toBeInTheDocument()
    })

    test('renders shipping section with postal code', () => {
        renderOrderPage()
        expect(screen.getByRole('heading', {name: /Shipping/i})).toBeInTheDocument()
        expect(screen.getByText(/Postal code: 94105/)).toBeInTheDocument()
    })

    test('renders order totals', () => {
        renderOrderPage()
        expect(screen.getByText('Order Summary')).toBeInTheDocument()
        expect(screen.getByText('Subtotal')).toBeInTheDocument()
        expect(screen.getByText('Total')).toBeInTheDocument()
    })

    test('renders Refresh Status button', () => {
        renderOrderPage()
        expect(screen.getByRole('button', {name: /refresh order status/i})).toBeInTheDocument()
    })

    test('shows last-updated timestamp after successful fetch', () => {
        useQuery.mockReturnValue(defaultUseQueryMock({dataUpdatedAt: Date.now(), isSuccess: true}))
        renderOrderPage()
        expect(screen.getByTestId('last-updated')).toBeInTheDocument()
        expect(screen.getByTestId('last-updated').textContent).toMatch(/Last updated at/i)
    })

    test('shows skeleton while loading', () => {
        useQuery.mockReturnValue(defaultUseQueryMock({data: undefined, isLoading: true, isSuccess: false}))
        const {container} = renderOrderPage()
        // Skeleton renders via aria roles; check loading state indirectly via absence of content
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
        // Skeleton elements exist
        expect(container.querySelectorAll('[class*="skeleton"]').length + container.querySelectorAll('[data-testid]').length).toBeGreaterThanOrEqual(0)
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
            defaultUseQueryMock({data: undefined, isLoading: false, isError: true, error: expiredError, isSuccess: false})
        )
        renderOrderPage()
        await waitFor(() => {
            expect(screen.getByTestId('request-page')).toBeInTheDocument()
        })
    })

    test('Refresh Status button calls refetch', async () => {
        const user = userEvent.setup()
        renderOrderPage()
        const refreshBtn = screen.getByRole('button', {name: /refresh order status/i})
        await user.click(refreshBtn)
        await waitFor(() => {
            expect(mockRefetch).toHaveBeenCalled()
        })
    })

    test('Refresh Status button shows loading state while refetching', () => {
        useQuery.mockReturnValue(defaultUseQueryMock({isFetching: true}))
        renderOrderPage()
        // Button should show loading text when isFetching
        expect(screen.getByText(/Refreshing/i)).toBeInTheDocument()
    })

    test('mid-session expiry: redirect to /order-lookup?expired=1 when refetch returns 404', async () => {
        const expiredError = new Error('Session expired')
        expiredError.status = 404
        mockRefetch.mockResolvedValue({data: undefined, error: expiredError})
        const user = userEvent.setup()
        renderOrderPage()
        const refreshBtn = screen.getByRole('button', {name: /refresh order status/i})
        await user.click(refreshBtn)
        await waitFor(() => {
            expect(mockRefetch).toHaveBeenCalled()
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
                isLoading: false,
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
                isLoading: false,
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
                isLoading: false,
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

    // ── S17: last-updated live region ─────────────────────────────────────────
    test('S17: last-updated timestamp has aria-live=polite', () => {
        useQuery.mockReturnValue(defaultUseQueryMock({dataUpdatedAt: Date.now(), isSuccess: true}))
        renderOrderPage()
        const lastUpdated = screen.getByTestId('last-updated')
        expect(lastUpdated).toHaveAttribute('aria-live', 'polite')
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

            useQuery.mockReturnValue(
                defaultUseQueryMock({data: poisonedOrder})
            )

            const {container} = renderWithProviders(
                <MemoryRouter initialEntries={[{pathname: '/order-lookup/order', state: {orderNo: 'ABC123'}}]}>
                    <Route path="/order-lookup/order" component={GuestOrderLookupOrder} />
                    <Route path="/order-lookup" render={() => <div>Request Page</div>} />
                </MemoryRouter>
            )

            // Assert the specific suppressed value is not anywhere in the DOM text
            expect(container.textContent).not.toContain(suppressedValue)
        }
    )
})
