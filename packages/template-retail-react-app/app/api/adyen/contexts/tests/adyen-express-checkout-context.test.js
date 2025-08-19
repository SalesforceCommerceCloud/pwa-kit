/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    fetchPaymentMethods,
    fetchEnvironment,
    fetchShippingMethods
} from '@salesforce/retail-react-app/app/api/adyen/contexts/adyen-express-checkout-context'

let mockFetchPaymentMethods = jest.fn()
let mockFetchEnvironment = jest.fn()
let mockFetchShippingMethods = jest.fn()

jest.mock('@salesforce/retail-react-app/app/api/adyen/services/payment-methods', () => ({
    AdyenPaymentMethodsService: jest.fn().mockImplementation(() => ({
        fetchPaymentMethods: mockFetchPaymentMethods
    }))
}))

jest.mock('@salesforce/retail-react-app/app/api/adyen/services/environment', () => ({
    AdyenEnvironmentService: jest.fn().mockImplementation(() => ({
        fetchEnvironment: mockFetchEnvironment
    }))
}))

jest.mock('@salesforce/retail-react-app/app/api/adyen/services/shipping-methods', () => ({
    AdyenShippingMethodsService: jest.fn().mockImplementation(() => ({
        getShippingMethods: mockFetchShippingMethods
    }))
}))

const paymentMethodsResponse = {
    paymentMethods: [
        {
            details: [
                {
                    key: 'encryptedCardNumber',
                    type: 'cardToken'
                },
                {
                    key: 'encryptedSecurityCode',
                    type: 'cardToken'
                },
                {
                    key: 'encryptedExpiryMonth',
                    type: 'cardToken'
                },
                {
                    key: 'encryptedExpiryYear',
                    type: 'cardToken'
                },
                {
                    key: 'holderName',
                    optional: true,
                    type: 'text'
                }
            ],
            name: 'Cards',
            type: 'scheme'
        },
        {
            name: 'Amazon Pay',
            type: 'amazonpay'
        }
    ]
}

const shippingMethodsResponse = [
    {
        id: '001',
        name: 'global'
    }
]

describe('fetchPaymentMethods function', () => {
    it('returns payment methods when fetch is successful', async () => {
        mockFetchPaymentMethods.mockImplementationOnce(() => paymentMethodsResponse)
        const customerId = 'mockCustomerId'
        const site = 'mockSite'
        const locale = 'en-US'
        const authToken = 'authToken'

        const paymentMethods = await fetchPaymentMethods(customerId, site, locale, authToken)

        expect(paymentMethods).toEqual(paymentMethodsResponse)
    })

    it('returns null when fetch fails', async () => {
        mockFetchPaymentMethods.mockRejectedValue(() => new Error('Failed to payment methods'))
        const customerId = 'mockCustomerId'
        const site = 'mockSite'
        const locale = 'en-US'
        const authToken = 'authToken'

        const paymentMethods = await fetchPaymentMethods(customerId, site, locale, authToken)

        expect(paymentMethods).toBeNull()
    })
})

describe('fetchEnvironment function', () => {
    it('returns environment when fetch is successful', async () => {
        mockFetchEnvironment.mockImplementationOnce(() => ({
            ADYEN_ENVIRONMENT: 'test',
            ADYEN_CLIENT_KEY: 'testKey'
        }))
        const site = 'mockSite'
        const authToken = 'testToken'

        const environment = await fetchEnvironment(site, authToken)

        expect(environment).toEqual({
            ADYEN_ENVIRONMENT: 'test',
            ADYEN_CLIENT_KEY: 'testKey'
        })
    })

    it('returns null when fetch fails', async () => {
        mockFetchEnvironment.mockRejectedValue(() => new Error('Failed to fetch environment'))
        const site = 'mockSite'
        const authToken = 'testToken'

        const environmentData = await fetchEnvironment(site, authToken)

        expect(environmentData).toBeNull()
    })
})

describe('fetchShippingMethods function', () => {
    it('returns shipping methods when fetch is successful', async () => {
        mockFetchShippingMethods.mockImplementationOnce(() => shippingMethodsResponse)

        const basketId = 'basket-id'
        const site = 'mockSite'
        const authToken = 'testToken'

        const shippingMethods = await fetchShippingMethods(basketId, site, authToken)

        expect(shippingMethods).toEqual(shippingMethodsResponse)
    })

    it('returns null when fetch fails', async () => {
        mockFetchShippingMethods.mockRejectedValue(
            () => new Error('Failed to fetch shipping methods')
        )
        const basketId = 'basket-id'
        const site = 'mockSite'
        const authToken = 'testToken'

        const shippingMethods = await fetchShippingMethods(basketId, site, authToken)

        expect(shippingMethods).toBeNull()
    })
})
