/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import AdyenCheckoutProvider from '@salesforce/retail-react-app/app/api/adyen/contexts/adyen-checkout-context'
import AdyenCheckout from '@salesforce/retail-react-app/app/api/adyen/components/adyenCheckout'
import {render, screen} from '@testing-library/react'

let mockFetchPaymentMethods = jest.fn()
let mockFetchEnvironment = jest.fn()

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

describe('<AdyenCheckoutProvider />', () => {
    let authToken, customerId, customerType, locale, site, locationSpy, setAdyenPaymentInProgress
    beforeEach(() => {
        authToken = 'testToken'
        customerId = 'customer123'
        customerType = 'guest'
        locale = 'en-US'
        site = 'RefArch'

        setAdyenPaymentInProgress = jest.fn().mockImplementation(() => {
            return 'success'
        })

        mockFetchEnvironment.mockImplementationOnce(() => ({
            ADYEN_ENVIRONMENT: 'test',
            ADYEN_CLIENT_KEY: 'testKey'
        }))
        mockFetchPaymentMethods.mockImplementationOnce(() => {
            return {
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
        })
    })

    describe('when page is initialized', () => {
        it('render correct payment methods', async () => {
            const wrapper = ({children}) => (
                <AdyenCheckoutProvider
                    authToken={authToken}
                    customerId={customerId}
                    customerType={customerType}
                    locale={locale}
                    site={site}
                    page={'checkout'}
                >
                    {children}
                </AdyenCheckoutProvider>
            )
            render(<AdyenCheckout />, {wrapper})
            expect(await screen.findByText('Cards')).toBeInTheDocument()
            expect(mockFetchEnvironment).toHaveBeenCalled()
        })
    })
})
