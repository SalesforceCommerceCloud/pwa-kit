/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {act, render, waitFor} from '@testing-library/react'
import SalesforceExpressPaymentProvider from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/providers/salesforce-express-payment-provider'
import {
    createWalletLaunch,
    removeWalletLaunch
} from '@salesforce/retail-react-app/app/utils/commerce-client-wallet'

const mockBasket = {
    basketId: 'basket',
    currency: 'USD',
    orderTotal: 15,
    productItems: [{itemId: 'line', quantity: 1}],
    shipments: [{shipmentId: 'me'}]
}
const mockApi = {
    shopperCustomers: {getCustomerBaskets: jest.fn()},
    shopperBasketsV2: {getBasket: jest.fn()}
}
let mockButtonProps
let mockEnabled
let mockCustomerId
const mockLifecycle = {
    available: jest.fn(),
    unavailable: jest.fn(),
    success: jest.fn(),
    cancel: jest.fn(),
    failure: jest.fn()
}
const mockIdentity = () => JSON.stringify(['site', 'en-US', 'USD', mockCustomerId, 'guest', 'usid'])
const mockContext = {
    providerApiVersion: 1,
    mode: 'shopper-agent',
    surface: 'cart',
    siteId: 'site',
    locale: 'en-US',
    currency: 'USD',
    basket: {id: 'basket', status: 'ready'}
}
jest.mock('react-router-dom', () => ({useLocation: () => ({search: '?launch=launch-id'})}))
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useCustomerId: () => mockCustomerId,
    useCustomerType: () => ({customerType: 'guest'}),
    useUsid: () => ({usid: 'usid'}),
    useCommerceApi: () => mockApi,
    useAccessToken: () => ({getTokenWhenReady: async () => 'token'})
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({site: {id: 'site'}, locale: {id: 'en-US'}})
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-currency', () => ({
    useCurrency: () => ({currency: 'USD'})
}))
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: () => ({
        app: {
            commerceAgent: {
                cc_cartTransport: 'direct',
                cc_expressCheckoutEnabled: mockEnabled ? 'true' : 'false'
            }
        }
    })
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments', () => ({
    EXPRESS_PAY_NOW: 1,
    useExpressCheckoutEnabled: () => ({cart: true})
}))
jest.mock('@salesforce/retail-react-app/app/components/sf-payments-express-buttons', () => ({
    __esModule: true,
    default: (props) => {
        mockButtonProps = props
        return null
    }
}))
const mount = (context = mockContext) =>
    render(<SalesforceExpressPaymentProvider context={context} lifecycle={mockLifecycle} />)
beforeEach(() => {
    jest.clearAllMocks()
    mockButtonProps = undefined
    mockEnabled = true
    mockCustomerId = 'shopper-a'
    sessionStorage.clear()
    Object.defineProperty(window.crypto, 'randomUUID', {
        value: () => 'launch-id',
        configurable: true
    })
    createWalletLaunch({basket: mockBasket, identity: mockIdentity(), url: '/Payments-Express'})
    mockApi.shopperCustomers.getCustomerBaskets.mockResolvedValue({baskets: [mockBasket]})
    mockApi.shopperBasketsV2.getBasket.mockResolvedValue(mockBasket)
})
it('reuses the Salesforce Payments component for a bound current basket and reports device availability', async () => {
    mount()
    await waitFor(() => expect(mockButtonProps).toBeDefined())
    expect(mockButtonProps).toMatchObject({
        walletsOnly: true,
        paymentCurrency: 'USD',
        initialAmount: 15
    })
    expect(await mockButtonProps.prepareBasket()).toEqual(mockBasket)
    mockButtonProps.onPaymentMethodsRendered({rendered: ['applepay']})
    expect(mockLifecycle.available).toHaveBeenCalled()
    mockButtonProps.onPaymentMethodsRendered({rendered: []})
    expect(mockLifecycle.unavailable).toHaveBeenCalled()
})
it.each(['disabled', 'product', 'stale', 'shopper', 'missing'])(
    'fails closed for %s launch',
    async (scenario) => {
        if (scenario === 'disabled') mockEnabled = false
        if (scenario === 'stale')
            mockApi.shopperBasketsV2.getBasket.mockResolvedValue({...mockBasket, orderTotal: 16})
        if (scenario === 'shopper') mockCustomerId = 'shopper-b'
        if (scenario === 'missing') removeWalletLaunch('launch-id')
        mount(
            scenario === 'product'
                ? {...mockContext, surface: 'product', productId: 'product', quantity: 1}
                : mockContext
        )
        await waitFor(() => expect(mockLifecycle.unavailable).toHaveBeenCalled())
        expect(mockButtonProps).toBeUndefined()
    }
)
it('rechecks the live payable total and blocks an out-of-date payment', async () => {
    mount()
    await waitFor(() => expect(mockButtonProps).toBeDefined())
    mockApi.shopperBasketsV2.getBasket.mockResolvedValue({...mockBasket, orderTotal: 17})
    await act(async () =>
        expect(mockButtonProps.beforeExpressPayment(mockBasket)).rejects.toThrow('payable total')
    )
    expect(mockLifecycle.failure).toHaveBeenCalled()
})
it('accepts a quote legitimately changed by the wallet shipping callback', async () => {
    mount()
    await waitFor(() => expect(mockButtonProps).toBeDefined())
    const updated = {...mockBasket, orderTotal: 19}
    mockApi.shopperBasketsV2.getBasket.mockResolvedValue(updated)
    expect(await mockButtonProps.beforeExpressPayment(updated)).toEqual(updated)
})
it('rejects callbacks after a parent-side shopper change revoked the launch', async () => {
    mount()
    await waitFor(() => expect(mockButtonProps).toBeDefined())
    removeWalletLaunch('launch-id')
    await act(async () =>
        expect(mockButtonProps.beforeExpressPayment(mockBasket)).rejects.toThrow()
    )
    expect(mockLifecycle.failure).toHaveBeenCalled()
})
it.each(['success', 'cancel', 'failure'])(
    'reports %s once and refreshes the storefront and widget independently of chat',
    async (status) => {
        const changed = jest.fn()
        window.addEventListener('commerceclient:cart-changed', changed)
        mount()
        await waitFor(() => expect(mockButtonProps).toBeDefined())
        const report = mockButtonProps.onExpressPaymentResult
        act(() => {
            report({status, orderId: 'order-1'})
            report({status, orderId: 'order-1'})
        })
        expect(mockLifecycle[status]).toHaveBeenCalledTimes(1)
        expect(mockLifecycle[status].mock.calls[0]).toEqual(
            status === 'success'
                ? [{orderId: 'order-1'}]
                : status === 'cancel'
                ? []
                : [{shopperMessage: 'Open View Cart to check your basket before trying again.'}]
        )
        expect(changed).toHaveBeenCalledTimes(1)
        window.removeEventListener('commerceclient:cart-changed', changed)
    }
)
