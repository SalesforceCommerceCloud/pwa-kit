/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import AdyenCheckoutProvider from '@salesforce/retail-react-app/app/api/adyen/contexts/adyen-checkout-context'
import AdyenCheckout from '@salesforce/retail-react-app/app/api/adyen/components/adyenCheckout'
import {render, screen, act} from '@testing-library/react'

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

jest.mock('@adyen/adyen-web', () => {
    return jest.fn().mockImplementation(() => ({
        create: jest.fn().mockReturnValue({
            mount: jest.fn(),
            submit: jest.fn()
        }),
        createFromAction: jest.fn().mockReturnValue({
            mount: jest.fn()
        }),
        submitDetails: jest.fn()
    }))
})

describe('<AdyenCheckoutProvider />', () => {
    let authToken, customerId, customerType, locale, site
    beforeEach(() => {
        authToken = 'testToken'
        customerId = 'customer123'
        customerType = 'guest'
        locale = 'en-US'
        site = 'RefArch'

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

            // Use act to wrap the render and state updates
            await act(async () => {
                render(<AdyenCheckout />, {wrapper})
            })

            // Wait for the component to render and check that the environment was fetched
            expect(mockFetchEnvironment).toHaveBeenCalled()
            expect(mockFetchPaymentMethods).toHaveBeenCalled()

            // Check that the component renders without crashing by looking for a specific element
            const container = screen.getByTestId('adyen-checkout-container')
            expect(container).toBeInTheDocument()
        })
    })
})
