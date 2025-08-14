/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {cardConfig} from '@salesforce/retail-react-app/app/api/adyen/components/card/config'
import {baseConfig} from '@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig'
import {paymentMethodsConfiguration} from '@salesforce/retail-react-app/app/api/adyen/components/paymentMethodsConfiguration'

jest.mock('@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig', () => ({
    baseConfig: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/api/adyen/components/applepay/config', () => ({
    applePayConfig: jest.fn()
}))

describe('cardConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return the correct configuration object when customer is registered', () => {
        const mockedBaseConfigResult = {
            someBaseConfigValue: 'mockedValue'
        }

        baseConfig.mockReturnValue(mockedBaseConfigResult)

        const props = {
            isCustomerRegistered: true
        }

        const expectedConfig = {
            ...mockedBaseConfigResult,
            _disableClickToPay: true,
            showPayButton: true,
            hasHolderName: true,
            holderNameRequired: true,
            billingAddressRequired: false,
            enableStoreDetails: true
        }

        const result = cardConfig(props)

        expect(baseConfig).toHaveBeenCalledWith(props)
        expect(result).toEqual(expectedConfig)
    })

    it('should return the correct configuration object when customer is not registered', () => {
        const mockedBaseConfigResult = {
            someBaseConfigValue: 'mockedValue'
        }

        baseConfig.mockReturnValue(mockedBaseConfigResult)

        const props = {
            isCustomerRegistered: false
        }

        const expectedConfig = {
            ...mockedBaseConfigResult,
            _disableClickToPay: true,
            showPayButton: true,
            hasHolderName: true,
            holderNameRequired: true,
            billingAddressRequired: false,
            enableStoreDetails: false
        }

        const result = cardConfig(props)

        expect(baseConfig).toHaveBeenCalledWith(props)
        expect(result).toEqual(expectedConfig)
    })

    it('should handle undefined isCustomerRegistered gracefully', () => {
        const mockedBaseConfigResult = {
            someBaseConfigValue: 'mockedValue'
        }

        baseConfig.mockReturnValue(mockedBaseConfigResult)

        const props = {}

        const expectedConfig = {
            ...mockedBaseConfigResult,
            _disableClickToPay: true,
            showPayButton: true,
            hasHolderName: true,
            holderNameRequired: true,
            billingAddressRequired: false,
            enableStoreDetails: false
        }

        const result = cardConfig(props)

        expect(baseConfig).toHaveBeenCalledWith(props)
        expect(result).toEqual(expectedConfig)
    })
})

describe('paymentMethodsConfiguration.card.onAdditionalDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return card configuration when payment method type is scheme', () => {
        const mockedBaseConfigResult = {
            someBaseConfigValue: 'mockedValue'
        }
        baseConfig.mockReturnValue(mockedBaseConfigResult)

        const props = {
            isCustomerRegistered: true
        }

        const paymentMethods = [{type: 'scheme'}]

        const result = paymentMethodsConfiguration({paymentMethods, ...props})

        expect(baseConfig).toHaveBeenCalledWith(props)
        expect(result.card).toBeDefined()
        expect(result.card).toEqual({
            ...mockedBaseConfigResult,
            _disableClickToPay: true,
            showPayButton: true,
            hasHolderName: true,
            holderNameRequired: true,
            billingAddressRequired: false,
            enableStoreDetails: true
        })
    })

    it('should merge additional payment methods configuration for card', () => {
        const mockedBaseConfigResult = {
            someBaseConfigValue: 'mockedValue'
        }
        baseConfig.mockReturnValue(mockedBaseConfigResult)

        const props = {
            isCustomerRegistered: false
        }

        const paymentMethods = [{type: 'scheme'}]
        const additionalPaymentMethodsConfiguration = {
            card: {
                onAdditionalDetails: jest.fn(),
                customField: 'customValue'
            }
        }

        const result = paymentMethodsConfiguration({
            paymentMethods,
            additionalPaymentMethodsConfiguration,
            ...props
        })

        expect(baseConfig).toHaveBeenCalledWith(props)
        expect(result.card).toBeDefined()
        expect(result.card.onAdditionalDetails).toBeDefined()
        expect(result.card.customField).toBe('customValue')
        expect(result.card.enableStoreDetails).toBe(false)
    })

    it('should handle card payment method with onAdditionalDetails callback', () => {
        const mockedBaseConfigResult = {
            someBaseConfigValue: 'mockedValue'
        }
        baseConfig.mockReturnValue(mockedBaseConfigResult)

        const mockOnAdditionalDetails = jest.fn()
        const props = {
            isCustomerRegistered: true
        }

        const paymentMethods = [{type: 'scheme'}]
        const additionalPaymentMethodsConfiguration = {
            card: {
                onAdditionalDetails: mockOnAdditionalDetails
            }
        }

        const result = paymentMethodsConfiguration({
            paymentMethods,
            additionalPaymentMethodsConfiguration,
            ...props
        })

        expect(result.card.onAdditionalDetails).toBe(mockOnAdditionalDetails)
        expect(typeof result.card.onAdditionalDetails).toBe('function')
    })
})
