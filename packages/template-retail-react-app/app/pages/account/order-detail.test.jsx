/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor} from '@testing-library/react'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import AccountOrderDetail from '@salesforce/retail-react-app/app/pages/account/order-detail'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

jest.mock('@salesforce/retail-react-app/app/components/order-status-bar/index', () => ({
    __esModule: true,
    default: () => <div data-testid="order-status-bar" />
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    __esModule: true,
    useCurrentCustomer: () => ({data: {email: 'test@example.com'}})
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    __esModule: true,
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useOrder: () => ({
        data: {
            orderNo: '0001',
            status: 'Created',
            shipments: [
                {
                    shippingStatus: 'not_shipped',
                    shippingAddress: {
                        firstName: 'Jane',
                        lastName: 'Doe',
                        address1: '1 Main St',
                        city: 'San Francisco',
                        stateCode: 'CA',
                        postalCode: '94105'
                    },
                    shippingMethod: {name: 'Ground'},
                    trackingNumber: 'TN123'
                }
            ],
            paymentInstruments: [
                {
                    paymentCard: {
                        cardType: 'Visa',
                        numberLastDigits: '1111',
                        expirationMonth: 1,
                        expirationYear: 2030
                    }
                }
            ],
            billingAddress: {
                firstName: 'Jane',
                lastName: 'Doe',
                address1: '1 Main St',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94105'
            },
            productItems: [],
            customerInfo: {customerId: 'abc123', email: 'test@example.com'}
        },
        isLoading: false
    }),
    useProducts: () => ({data: {}, isLoading: false}),
    useCustomerId: () => 'abc123',
    useCustomerType: () => ({isRegistered: true})
}))

const renderAtOrderDetailPath = () => {
    const orderNo = '0001'
    window.history.pushState(
        {},
        'Order Details',
        createPathWithDefaults(`/account/orders/${orderNo}`)
    )
    return renderWithProviders(
        <Switch>
            <Route path={createPathWithDefaults('/account/orders/:orderNo')}>
                <AccountOrderDetail />
            </Route>
        </Switch>
    )
}

describe('AccountOrderDetail OMS gating', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                oms: {enabled: true}
            }
        })
    })

    test('renders order status bar when OMS is enabled', () => {
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                oms: {enabled: true}
            }
        })
        renderAtOrderDetailPath()
        expect(screen.getByTestId('order-status-bar')).toBeInTheDocument()
    })

    test('hides order status bar when OMS is disabled', () => {
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                oms: {enabled: false}
            }
        })
        renderAtOrderDetailPath()
        expect(screen.queryByTestId('order-status-bar')).not.toBeInTheDocument()
    })
})

describe('Cancel Order toast', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getConfig.mockReturnValue({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                oms: {enabled: true}
            }
        })
    })

    test('shows success toast when onCancel is triggered', async () => {
        const {user} = renderAtOrderDetailPath()
        await screen.findByText(/Order Number:/i)

        // Open cancel modal
        const cancelButton = screen.getByRole('button', {name: /cancel order/i})
        await user.click(cancelButton)

        // Click "Request Cancellation" button in modal
        const requestButtons = screen.getAllByRole('button', {name: /request cancellation/i})
        const modalButton = requestButtons.find((btn) => btn.closest('[role="dialog"]'))
        expect(modalButton).toBeInTheDocument()
        await user.click(modalButton)

        await waitFor(() => {
            expect(screen.getByRole('status')).toHaveTextContent(/cancellation request submitted/i)
        })
    })
})
