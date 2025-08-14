/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import AdyenCheckoutConfig from '@salesforce/retail-react-app/app/api/adyen/api/controllers/checkout-config'
import {getAdyenConfigForCurrentSite} from '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn().mockImplementation(() => {
            return {
                app: {
                    sites: [
                        {
                            id: 'RefArch'
                        }
                    ],
                    commerceAPI: {
                        parameters: {
                            siteId: 'RefArch'
                        }
                    }
                }
            }
        })
    }
})

jest.mock(
    '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js',
    () => ({
        getAdyenConfigForCurrentSite: jest.fn(() => ({
            apiKey: 'mock-api-key',
            environment: 'TEST'
        }))
    })
)

jest.mock('@adyen/api-library', () => ({
    Client: jest.fn().mockImplementation(() => ({
        setEnvironment: jest.fn(),
        config: {
            environment: 'TEST'
        }
    })),
    Config: jest.fn().mockImplementation(() => ({
        apiKey: '',
        environment: 'TEST'
    })),
    PaymentsApi: jest.fn().mockImplementation(() => ({
        setEnvironment: jest.fn()
    }))
}))

describe('AdyenCheckoutConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return the same instance of AdyenCheckoutConfig when calling getInstance multiple times', () => {
        const instance1 = AdyenCheckoutConfig.getInstance()
        const instance2 = AdyenCheckoutConfig.getInstance()

        expect(instance1).toBe(instance2)
    })

    it('should throw AdyenError for missing live endpoint URL prefix in live environment', () => {
        getAdyenConfigForCurrentSite.mockReturnValue({
            environment: 'live',
            apiKey: 'live-api-key'
        })
        const adyenCheckoutConfig = new AdyenCheckoutConfig('siteId')
        expect(() => adyenCheckoutConfig.createInstance()).toThrow(AdyenError)
    })

    it('should return if its live environment', () => {
        getAdyenConfigForCurrentSite.mockReturnValue({
            environment: 'live',
            liveEndpointUrlPrefix: 'prefix'
        })
        const config = getAdyenConfigForCurrentSite('siteId')
        const adyenCheckoutConfig = new AdyenCheckoutConfig('siteId')
        expect(adyenCheckoutConfig.isLiveEnvironment(config.environment)).toBe(true)
    })
})
