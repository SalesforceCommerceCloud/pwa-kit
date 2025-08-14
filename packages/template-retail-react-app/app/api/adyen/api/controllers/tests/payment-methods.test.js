/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PaymentMethodsController} from '@salesforce/retail-react-app/app/api/adyen/index'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'
import {APPLICATION_VERSION} from '@salesforce/retail-react-app/app/api/adyen/utils/constants.js'

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
describe('payment methods controller', () => {
    let req, res, next, consoleInfoSpy, consoleErrorSpy
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
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
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
                externalPlatform: {integrator: '', name: 'SalesforceCommerceCloud', version: 'PWA'},
                merchantApplication: {
                    name: 'adyen-salesforce-commerce-cloud',
                    version: APPLICATION_VERSION
                }
            }
        })
        expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('getPaymentMethods start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('getPaymentMethods success')
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
                externalPlatform: {integrator: '', name: 'SalesforceCommerceCloud', version: 'PWA'},
                merchantApplication: {
                    name: 'adyen-salesforce-commerce-cloud',
                    version: APPLICATION_VERSION
                }
            }
        })
        expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('getPaymentMethods start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('getPaymentMethods success')
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
        expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('getPaymentMethods start')
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
        expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('getPaymentMethods start')
        expect(next).toHaveBeenCalledWith(new AdyenError('no payment methods', 400))
    })
})
