/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {act, render, screen, waitFor} from '@testing-library/react'

const mockGetConfig = jest.fn()
const mockUseConfigurations = jest.fn()
const mockUsePaymentConfiguration = jest.fn()
const mockUseProduct = jest.fn()
const mockUseExpressPaymentBasket = jest.fn()
const mockCreateBasket = jest.fn()
const mockAddItemToBasket = jest.fn()
const mockCleanupTemporaryBaskets = jest.fn()
let cartProps
let productProps

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: () => mockGetConfig()
}))

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useConfigurations: (...args) => mockUseConfigurations(...args),
    usePaymentConfiguration: (...args) => mockUsePaymentConfiguration(...args),
    useProduct: (...args) => mockUseProduct(...args),
    useShopperBasketsV2Mutation: (operation) => ({
        mutateAsync: operation === 'createBasket' ? mockCreateBasket : mockAddItemToBasket
    })
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-cleanup-temporary-baskets', () => ({
    useCleanupTemporaryBaskets: () => mockCleanupTemporaryBaskets
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-sf-payments-country', () => ({
    useSFPaymentsCountry: () => ({countryCode: 'US', isLoading: false})
}))

jest.mock(
    '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/use-express-payment-basket',
    () => () => mockUseExpressPaymentBasket()
)

jest.mock('@salesforce/retail-react-app/app/components/sf-payments-express', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react')
    return function MockSFPaymentsExpress(props) {
        cartProps = props
        return <div data-testid="sfp-cart-provider" />
    }
})

jest.mock('@salesforce/retail-react-app/app/components/sf-payments-express-buttons', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react')
    return function MockSFPaymentsExpressButtons(props) {
        productProps = props
        return <div data-testid="sfp-product-provider" />
    }
})

import SalesforcePaymentsExpressPaymentProvider, {
    filterShopperAgentPaymentMethodSet,
    normalizeRenderedPaymentMethods
} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/providers/salesforce-payments-express-payment-provider'

const cartContext = {
    providerApiVersion: 1,
    mode: 'shopper-agent',
    surface: 'cart',
    siteId: 'site-1',
    locale: 'en-US',
    currency: 'USD',
    basket: {id: 'basket-1', status: 'ready'}
}

const productContext = {
    providerApiVersion: 1,
    mode: 'shopper-agent',
    surface: 'product',
    siteId: 'site-1',
    locale: 'en-US',
    currency: 'USD',
    productId: 'product-1',
    quantity: 2
}

const createLifecycle = () => ({
    available: jest.fn(),
    unavailable: jest.fn(),
    success: jest.fn(),
    failure: jest.fn(),
    cancel: jest.fn()
})

describe('SalesforcePaymentsExpressPaymentProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        cartProps = undefined
        productProps = undefined
        mockGetConfig.mockReturnValue({app: {sfPayments: {enabled: true}}})
        mockUseConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'SalesforcePaymentsAllowed', value: true}]
            },
            isLoading: false,
            isError: false
        })
        mockUseProduct.mockReturnValue({
            data: {
                id: 'product-1',
                price: 25,
                tieredPrices: [{quantity: 1, price: 25}]
            },
            isLoading: false,
            isError: false
        })
        mockUseExpressPaymentBasket.mockReturnValue({
            data: {basketId: 'basket-1', billingAddress: {countryCode: 'US'}}
        })
        mockUsePaymentConfiguration.mockReturnValue({
            data: {
                paymentMethods: [
                    {paymentMethodType: 'applepay', accountId: 'stripe'},
                    {paymentMethodType: 'googlepay', accountId: 'adyen'},
                    {paymentMethodType: 'paypal', accountId: 'paypal'}
                ],
                paymentMethodSetAccounts: [
                    {accountId: 'stripe', vendor: 'Stripe'},
                    {accountId: 'adyen', vendor: 'Adyen'},
                    {accountId: 'paypal', vendor: 'PayPal'}
                ]
            },
            isLoading: false,
            isError: false
        })
        mockCreateBasket.mockResolvedValue({basketId: 'temporary-basket'})
        mockAddItemToBasket.mockResolvedValue({basketId: 'temporary-basket', temporaryBasket: true})
        mockCleanupTemporaryBaskets.mockResolvedValue(undefined)
    })

    test('normalizes rendered SFP method identifiers', () => {
        expect(
            normalizeRenderedPaymentMethods([
                'applepay',
                {paymentMethodType: 'googlepay'},
                {type: 'paypal'},
                null
            ])
        ).toEqual(['applepay', 'googlepay', 'paypal'])
    })

    test('limits the Shopper Agent SFP method set to supported wallets and vendors', () => {
        expect(
            filterShopperAgentPaymentMethodSet({
                paymentMethods: [
                    {paymentMethodType: 'applepay', accountId: 'stripe'},
                    {paymentMethodType: 'googlepay', accountId: 'adyen'},
                    {paymentMethodType: 'paypal', accountId: 'paypal'},
                    {paymentMethodType: 'applepay', accountId: 'unsupported'}
                ],
                paymentMethodSetAccounts: [
                    {accountId: 'stripe', vendor: 'Stripe'},
                    {accountId: 'adyen', vendor: 'Adyen'},
                    {accountId: 'paypal', vendor: 'PayPal'},
                    {accountId: 'unsupported', vendor: 'Other'}
                ]
            })
        ).toEqual({
            paymentMethods: [
                {paymentMethodType: 'applepay', accountId: 'stripe'},
                {paymentMethodType: 'googlepay', accountId: 'adyen'}
            ],
            paymentMethodSetAccounts: [
                {accountId: 'stripe', vendor: 'Stripe'},
                {accountId: 'adyen', vendor: 'Adyen'}
            ]
        })
    })

    test('reports unavailable and renders nothing when SFP is disabled', async () => {
        const lifecycle = createLifecycle()
        mockGetConfig.mockReturnValue({app: {sfPayments: {enabled: false}}})

        const {container} = render(
            <SalesforcePaymentsExpressPaymentProvider context={cartContext} lifecycle={lifecycle} />
        )

        expect(container).toBeEmptyDOMElement()
        await waitFor(() => expect(lifecycle.unavailable).toHaveBeenCalledTimes(1))
    })

    test('maps the cart SFP callbacks to the provider-neutral lifecycle', () => {
        const lifecycle = createLifecycle()
        render(
            <SalesforcePaymentsExpressPaymentProvider context={cartContext} lifecycle={lifecycle} />
        )

        expect(screen.getByTestId('sfp-cart-provider')).toBeInTheDocument()
        expect(cartProps.expressButtonLayout).toBe('horizontal')
        expect(cartProps.mode).toBe('shopper-agent')
        expect(cartProps.paymentMethodSet).toEqual({
            paymentMethods: [
                {paymentMethodType: 'applepay', accountId: 'stripe'},
                {paymentMethodType: 'googlepay', accountId: 'adyen'}
            ],
            paymentMethodSetAccounts: [
                {accountId: 'stripe', vendor: 'Stripe'},
                {accountId: 'adyen', vendor: 'Adyen'}
            ]
        })

        act(() => cartProps.onPaymentMethodsRendered(['applepay', 'googlepay']))
        act(() =>
            cartProps.onExpressPaymentCompleted({
                orderId: 'order-1',
                paymentMethod: 'applepay'
            })
        )
        act(() => cartProps.onExpressPaymentCancelled({paymentMethod: 'googlepay'}))
        act(() =>
            cartProps.onExpressPaymentFailed({
                error: 'Card declined',
                paymentMethod: 'paypal'
            })
        )

        expect(lifecycle.available).toHaveBeenCalledWith({
            paymentMethods: ['applepay', 'googlepay']
        })
        expect(lifecycle.success).toHaveBeenCalledWith({
            orderId: 'order-1',
            paymentMethod: 'applepay'
        })
        expect(lifecycle.cancel).toHaveBeenCalledWith({
            shopperMessage: 'Express payment was cancelled.',
            paymentMethod: 'googlepay'
        })
        expect(lifecycle.failure).toHaveBeenCalledWith({
            shopperMessage: 'Card declined',
            paymentMethod: 'paypal'
        })
    })

    test('prepares a temporary product basket without changing the default provider', async () => {
        const lifecycle = createLifecycle()
        render(
            <SalesforcePaymentsExpressPaymentProvider
                context={productContext}
                lifecycle={lifecycle}
            />
        )

        expect(screen.getByTestId('sfp-product-provider')).toBeInTheDocument()
        expect(productProps.paymentCurrency).toBe('USD')
        expect(productProps.initialAmount).toBe(25)
        expect(productProps.expressButtonLayout).toBe('horizontal')
        expect(productProps.mode).toBe('shopper-agent')
        expect(productProps.paymentMethodSet).toEqual({
            paymentMethods: [
                {paymentMethodType: 'applepay', accountId: 'stripe'},
                {paymentMethodType: 'googlepay', accountId: 'adyen'}
            ],
            paymentMethodSetAccounts: [
                {accountId: 'stripe', vendor: 'Stripe'},
                {accountId: 'adyen', vendor: 'Adyen'}
            ]
        })

        await productProps.prepareBasket()

        expect(mockCleanupTemporaryBaskets).toHaveBeenCalledTimes(1)
        expect(mockCreateBasket).toHaveBeenCalledWith({
            parameters: {temporary: true},
            body: {}
        })
        expect(mockAddItemToBasket).toHaveBeenCalledWith({
            parameters: {basketId: 'temporary-basket'},
            body: [{productId: 'product-1', quantity: 2}]
        })
    })
})
