/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    getCheckoutConfig,
    handleQueryParams
} from '@salesforce/retail-react-app/app/api/adyen/components/adyenCheckout'

describe('getCheckoutConfig', () => {
    it('returns correct checkout config without translations', () => {
        const adyenEnvironment = {
            ADYEN_ENVIRONMENT: 'test',
            ADYEN_CLIENT_KEY: 'test_client_key'
        }
        const adyenPaymentMethods = ['visa', 'mastercard']
        const paymentMethodsConfiguration = {
            visa: {enabled: true},
            mastercard: {enabled: false}
        }
        const locale = {id: 'en_US'}

        const result = getCheckoutConfig(
            adyenEnvironment,
            adyenPaymentMethods,
            paymentMethodsConfiguration,
            null,
            locale
        )

        expect(result).toEqual({
            environment: 'test',
            clientKey: 'test_client_key',
            paymentMethodsResponse: ['visa', 'mastercard'],
            paymentMethodsConfiguration: {
                visa: {enabled: true},
                mastercard: {enabled: false}
            }
        })
    })

    it('returns correct checkout config with translations', () => {
        const adyenEnvironment = {
            ADYEN_ENVIRONMENT: 'test',
            ADYEN_CLIENT_KEY: 'test_client_key'
        }
        const adyenPaymentMethods = ['visa', 'mastercard']
        const paymentMethodsConfiguration = {
            visa: {enabled: true},
            mastercard: {enabled: false}
        }
        const translations = {
            /* translations object */
        }
        const locale = {id: 'en_US'}

        const result = getCheckoutConfig(
            adyenEnvironment,
            adyenPaymentMethods,
            paymentMethodsConfiguration,
            translations,
            locale
        )

        expect(result).toEqual({
            environment: 'test',
            clientKey: 'test_client_key',
            paymentMethodsResponse: ['visa', 'mastercard'],
            paymentMethodsConfiguration: {
                visa: {enabled: true},
                mastercard: {enabled: false}
            },
            locale: 'en_US',
            translations: translations
        })
    })
})

describe('handleQueryParams', () => {
    let urlParamsMock
    let checkoutMock
    let setAdyenPaymentInProgressMock
    let paymentContainerMock

    beforeEach(() => {
        urlParamsMock = new URLSearchParams()
        checkoutMock = {
            submitDetails: jest.fn(),
            create: jest.fn().mockImplementation(() => {
                return {
                    mount: jest.fn().mockImplementation(() => {
                        return {
                            submit: jest.fn()
                        }
                    })
                }
            }),
            mount: jest.fn().mockImplementation(() => {
                return {
                    submit: jest.fn()
                }
            }),
            createFromAction: jest.fn().mockImplementation(() => {
                return {
                    mount: jest.fn()
                }
            })
        }
        setAdyenPaymentInProgressMock = jest.fn()
        paymentContainerMock = {current: document.createElement('div')}
    })

    it('handles redirectResult', () => {
        urlParamsMock.set('redirectResult', 'someRedirectResult')
        handleQueryParams(
            urlParamsMock,
            checkoutMock,
            setAdyenPaymentInProgressMock,
            paymentContainerMock
        )
        expect(checkoutMock.submitDetails).toHaveBeenCalledWith({
            data: {details: {redirectResult: 'someRedirectResult'}}
        })
    })

    it('handles amazonCheckoutSessionId', () => {
        urlParamsMock.set('amazonCheckoutSessionId', 'someAmazonCheckoutSessionId')
        handleQueryParams(
            urlParamsMock,
            checkoutMock,
            setAdyenPaymentInProgressMock,
            paymentContainerMock
        )
        expect(setAdyenPaymentInProgressMock).toHaveBeenCalledWith(true)
        expect(checkoutMock.create).toHaveBeenCalledWith('amazonpay', {
            amazonCheckoutSessionId: 'someAmazonCheckoutSessionId',
            showOrderButton: false
        })
    })

    it('handles adyenAction', () => {
        const adyenAction = btoa(JSON.stringify({some: 'actionData'}))
        urlParamsMock.set('adyenAction', adyenAction)
        handleQueryParams(
            urlParamsMock,
            checkoutMock,
            setAdyenPaymentInProgressMock,
            paymentContainerMock
        )
        expect(checkoutMock.createFromAction).toHaveBeenCalled()
    })

    it('handles default case', () => {
        handleQueryParams(
            urlParamsMock,
            checkoutMock,
            setAdyenPaymentInProgressMock,
            paymentContainerMock
        )
        expect(checkoutMock.create).toHaveBeenCalledWith('dropin')
    })
})
