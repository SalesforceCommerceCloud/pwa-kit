/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {paymentMethodsConfiguration} from '@salesforce/retail-react-app/app/api/adyen/components/paymentMethodsConfiguration'
import {baseConfig} from '@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig'
import {applePayConfig} from '@salesforce/retail-react-app/app/api/adyen/components/applepay/config'

jest.mock('@salesforce/retail-react-app/app/api/adyen/components/helpers/baseConfig', () => ({
    baseConfig: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/api/adyen/components/applepay/config', () => ({
    applePayConfig: jest.fn()
}))

describe('paymentMethodsConfiguration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return the correct configuration for given payment methods', () => {
        const mockedBaseConfigResult = {
            someBaseConfigValue: 'mockedValue'
        }
        const mockedApplePayConfigResult = {
            ...mockedBaseConfigResult,
            showPayButton: true
        }

        baseConfig.mockReturnValue(mockedBaseConfigResult)
        applePayConfig.mockReturnValue(mockedApplePayConfigResult)

        const props = {
            someProp: 'value'
        }

        const paymentMethods = [{type: 'applepay'}]

        const result = paymentMethodsConfiguration({paymentMethods, ...props})

        expect(baseConfig).toHaveBeenCalledWith(props)
        expect(applePayConfig).toHaveBeenCalledWith(props)
        expect(result.applepay).toEqual(mockedApplePayConfigResult)
    })

    it('should return default config if no payment methods available', () => {
        const mockedBaseConfigResult = {
            someBaseConfigValue: 'mockedValue'
        }
        baseConfig.mockReturnValue(mockedBaseConfigResult)

        const props = {
            someProp: 'value'
        }
        const paymentMethods = []

        const result = paymentMethodsConfiguration({paymentMethods, ...props})
        expect(result).toBe(mockedBaseConfigResult)
    })
})
