/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PaymentMethodsController} from '@salesforce/retail-react-app/app/api/adyen/api'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'
import Logger from '../logger'

let mockPaymentMethods = jest.fn()
let mockGetCustomerBaskets = jest.fn()
let mockGetCustomer = jest.fn()

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

jest.mock('commerce-sdk-isomorphic', () => {
    return {
        ShopperCustomers: jest.fn().mockImplementation(() => {
            return {
                getCustomer: mockGetCustomer,
                getCustomerBaskets: mockGetCustomerBaskets
            }
        })
    }
})

jest.mock('../checkout-config', () => {
    return {
        getInstance: jest.fn().mockImplementation(() => {
            return {
                paymentMethods: mockPaymentMethods
            }
        })
    }
})

jest.mock(
    '@salesforce/retail-react-app/app/api/adyen/utils/getAdyenConfigForCurrentSite.js',
    () => ({
        getAdyenConfigForCurrentSite: jest.fn().mockReturnValue({
            apiKey: 'mock_api_key',
            clientKey: 'mock_client_key',
            environment: 'mock_environment',
            merchantAccount: 'mock_ADYEN_MERCHANT_ACCOUNT',
            systemIntegratorName: 'mock_system_integrator',
            webhookUser: 'mock_webhook_user',
            webhookPassword: 'mock_webhook_password',
            webhookHmacKey: 'mock_webhook_hmac_key',
            liveEndpointUrlPrefix: 'mock_live_url_prefix',
            appleDomainAssociation: 'mock_apple_domain_association'
        })
    })
)

jest.mock('../logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}))

describe('payment methods controller', () => {
    let req, res, next
    let blockedPaymentMethods = ['giftcard', 'wechatpayMiniProgram', 'wechatpayQR', 'wechatpaySDK']

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'mockToken',
                customerid: 'testCustomer'
            },
            query: {
                siteId: 'RefArch',
                locale: 'en-US'
            }
        }
        res = {
            locals: {}
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })
    it('returns payment method list', async () => {
        mockGetCustomer.mockImplementation(() => {
            return {
                customerId: 'testCustomer',
                authType: 'registered'
            }
        })
        mockGetCustomerBaskets.mockImplementationOnce(() => {
            return {
                baskets: [
                    {
                        orderTotal: 100,
                        productTotal: 100,
                        currency: 'USD'
                    }
                ]
            }
        })
        mockPaymentMethods.mockImplementationOnce(() => {
            return {
                paymentMethods: [
                    {
                        name: 'Adyen Voucher',
                        type: 'adyen_test_voucher'
                    }
                ]
            }
        })

        await PaymentMethodsController(req, res, next)
        expect(mockPaymentMethods).toHaveBeenCalledWith(
            {
                amount: {currency: 'USD', value: 10000},
                blockedPaymentMethods,
                countryCode: 'US',
                merchantAccount: 'mock_ADYEN_MERCHANT_ACCOUNT',
                shopperLocale: 'en-US',
                shopperReference: 'testCustomer'
            },
            {
                idempotencyKey: expect.any(String)
            }
        )
        expect(res.locals.response).toEqual({
            paymentMethods: [
                {
                    name: 'Adyen Voucher',
                    type: 'adyen_test_voucher'
                }
            ],
            applicationInfo: {
                externalPlatform: {
                    integrator: 'mock_system_integrator',
                    name: 'SalesforceCommerceCloud',
                    version: 'PWA'
                },
                merchantApplication: {
                    name: 'adyen-salesforce-commerce-cloud',
                    version: '3.0.0'
                }
            }
        })
        expect(Logger.info).toHaveBeenCalledTimes(2)
        expect(Logger.info).toHaveBeenNthCalledWith(1, 'getPaymentMethods', 'start')
        expect(Logger.info).toHaveBeenNthCalledWith(2, 'getPaymentMethods', 'success')
        expect(next).toHaveBeenCalled()
    })
    it('returns payment method when basket has productTotal but no orderTotal', async () => {
        mockGetCustomer.mockImplementation(() => {
            return {
                customerId: 'testCustomer',
                authType: 'registered'
            }
        })
        mockGetCustomerBaskets.mockImplementationOnce(() => {
            return {
                baskets: [
                    {
                        productTotal: 100,
                        currency: 'USD'
                    }
                ]
            }
        })
        mockPaymentMethods.mockImplementationOnce(() => {
            return {
                paymentMethods: [
                    {
                        name: 'Adyen Voucher',
                        type: 'adyen_test_voucher'
                    }
                ]
            }
        })
        await PaymentMethodsController(req, res, next)
        expect(mockPaymentMethods).toHaveBeenCalledWith(
            {
                amount: {currency: 'USD', value: 10000},
                blockedPaymentMethods,
                countryCode: 'US',
                merchantAccount: 'mock_ADYEN_MERCHANT_ACCOUNT',
                shopperLocale: 'en-US',
                shopperReference: 'testCustomer'
            },
            {
                idempotencyKey: expect.any(String)
            }
        )
        expect(res.locals.response).toEqual({
            paymentMethods: [
                {
                    name: 'Adyen Voucher',
                    type: 'adyen_test_voucher'
                }
            ],
            applicationInfo: {
                externalPlatform: {
                    integrator: 'mock_system_integrator',
                    name: 'SalesforceCommerceCloud',
                    version: 'PWA'
                },
                merchantApplication: {
                    name: 'adyen-salesforce-commerce-cloud',
                    version: '3.0.0'
                }
            }
        })
        expect(Logger.info).toHaveBeenCalledTimes(2)
        expect(Logger.info).toHaveBeenNthCalledWith(1, 'getPaymentMethods', 'start')
        expect(Logger.info).toHaveBeenNthCalledWith(2, 'getPaymentMethods', 'success')
        expect(next).toHaveBeenCalled()
    })
    it('throw an error when basket is empty', async () => {
        mockGetCustomer.mockImplementation(() => {
            return {
                customerId: 'testCustomer',
                authType: 'registered'
            }
        })
        mockGetCustomerBaskets.mockImplementationOnce(() => {
            return {
                baskets: []
            }
        })
        mockPaymentMethods.mockImplementationOnce(() => {
            return {
                paymentMethods: []
            }
        })
        await PaymentMethodsController(req, res, next)
        expect(Logger.info).toHaveBeenCalledTimes(1)
        expect(Logger.info).toHaveBeenCalledWith('getPaymentMethods', 'start')
        expect(next).toHaveBeenCalledWith(new AdyenError('invalid basket', 404))
    })
    it('returns error when payment method fails', async () => {
        mockGetCustomer.mockImplementation(() => {
            return {
                customerId: 'testCustomer',
                authType: 'registered'
            }
        })
        mockGetCustomerBaskets.mockImplementation(() => {
            return {
                baskets: [
                    {
                        productTotal: 100,
                        currency: 'USD'
                    }
                ]
            }
        })
        mockPaymentMethods.mockImplementation(() => {
            return {
                paymentMethods: null
            }
        })
        await PaymentMethodsController(req, res, next)
        expect(mockPaymentMethods).toHaveBeenCalledWith(
            {
                blockedPaymentMethods,
                countryCode: 'US',
                merchantAccount: 'mock_ADYEN_MERCHANT_ACCOUNT',
                shopperLocale: 'en-US',
                shopperReference: 'testCustomer',
                amount: {
                    currency: 'USD',
                    value: 10000
                }
            },
            {
                idempotencyKey: expect.any(String)
            }
        )
        expect(Logger.info).toHaveBeenCalledTimes(1)
        expect(Logger.info).toHaveBeenCalledWith('getPaymentMethods', 'start')
        expect(Logger.error).toHaveBeenCalledWith(
            'getPaymentMethods',
            JSON.stringify(new AdyenError('no payment methods', 400))
        )
        expect(next).toHaveBeenCalledWith(new AdyenError('no payment methods', 400))
    })
})
