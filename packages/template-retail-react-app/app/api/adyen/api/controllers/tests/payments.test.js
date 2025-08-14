/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {PaymentsController} from '@salesforce/retail-react-app/app/api/adyen/index'
import {RESULT_CODES} from '@salesforce/retail-react-app/app/api/adyen/utils/constants.js'
import {AdyenError} from '@salesforce/retail-react-app/app/api/adyen/api/models/AdyenError'

let mockPayments = jest.fn()
let mockGetBasket = jest.fn()
let mockCreateBasket = jest.fn()
let mockAddPaymentInstrumentToBasket = jest.fn()
let mockRemovePaymentInstrumentFromBasket = jest.fn()
let mockCreateOrder = jest.fn()
let mockUpdateOrderPaymentTransaction = jest.fn()
let mockUpdateOrderStatus = jest.fn()

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
        ShopperBaskets: jest.fn().mockImplementation(() => {
            return {
                createBasket: mockCreateBasket,
                getBasket: mockGetBasket,
                addPaymentInstrumentToBasket: mockAddPaymentInstrumentToBasket,
                removePaymentInstrumentFromBasket: mockRemovePaymentInstrumentFromBasket
            }
        }),
        ShopperOrders: jest.fn().mockImplementation(() => {
            return {
                createOrder: mockCreateOrder
            }
        })
    }
})
jest.mock('../checkout-config', () => {
    return {
        getInstance: jest.fn().mockImplementation(() => {
            return {
                payments: mockPayments
            }
        })
    }
})
jest.mock('../orderApi', () => {
    return {
        OrderApiClient: jest.fn().mockImplementation(() => {
            return {
                updateOrderPaymentTransaction: mockUpdateOrderPaymentTransaction,
                updateOrderStatus: mockUpdateOrderStatus
            }
        })
    }
})
describe('payments controller', () => {
    let req, res, next, consoleInfoSpy, consoleErrorSpy

    afterEach(() => {
        mockPayments.mockReset()
    })

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'mockToken',
                customerid: 'testCustomer',
                basketid: 'testBasket'
            },
            body: {
                data: {
                    deliveryAddress: {
                        city: 'New York',
                        countryCode: 'US',
                        address2: 'Apt 123',
                        postalCode: '10001',
                        stateCode: 'NY',
                        address1: '123 Main St'
                    },
                    billingAddress: {
                        city: 'New York',
                        countryCode: 'US',
                        address2: 'Apt 123',
                        postalCode: '10001',
                        stateCode: 'NY',
                        address1: '123 Main St'
                    },
                    paymentMethod: {
                        type: 'scheme',
                        brand: 'visa'
                    }
                }
            },
            query: {
                siteId: 'RefArch'
            }
        }
        res = {
            locals: {}
        }
        next = jest.fn()
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })
    it('returns checkout response if request is valid', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })

        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })

        await PaymentsController(req, res, next)
        expect(res.locals.response).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
        expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments resultCode Authorised')
        expect(next).toHaveBeenCalled()
    })
    it('returns error if request has no basket Id', async () => {
        req.headers = {
            authorization: 'mockToken',
            customerid: 'testCustomer'
        }
        await PaymentsController(req, res, next)
        expect(res.locals.response).toBeNil()
        expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('invalid request params')
        expect(next).toHaveBeenCalledWith(new AdyenError('invalid request params', 400))
    })
    it('returns error if basket is empty', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return false
        })
        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })
        await PaymentsController(req, res, next)
        expect(res.locals.response).toBeNil()
        expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('invalid basket')
        expect(next).toHaveBeenCalledWith(new AdyenError('invalid basket', 404))
    })
    it('adds paymentInstrument to basket if basket has no paymentInstrument and returns checkout response', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {}
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })

        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })

        await PaymentsController(req, res, next)
        expect(res.locals.response).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
        expect(mockAddPaymentInstrumentToBasket).toHaveBeenCalled()
        expect(consoleInfoSpy).toHaveBeenCalledTimes(5)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain(
            'sendPayments addPaymentInstrumentToBasket'
        )
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[3][0]).toContain('sendPayments resultCode Authorised')
        expect(next).toHaveBeenCalled()
    })
    it('return error if order does not belong to the customer', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer1'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })

        await PaymentsController(req, res, next)
        expect(res.locals.response).toBeNil()
        expect(mockUpdateOrderStatus).toHaveBeenCalled()
        expect(consoleInfoSpy).toHaveBeenCalledTimes(3)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('order is invalid')
        expect(next).toHaveBeenCalledWith(
            new AdyenError('order is invalid', 404, expect.any(String))
        )
    })
    it('returns checkout response even if request has no billing address and delivery address', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })

        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })

        req.body = {
            data: {
                paymentMethod: {
                    type: 'scheme',
                    brand: 'visa'
                }
            }
        }

        await PaymentsController(req, res, next)
        expect(res.locals.response).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
        expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments resultCode Authorised')
        expect(next).toHaveBeenCalled()
    })
    it('returns checkout response when paymentMethod type is openInvoiceMethod', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 30,
                        basePrice: 199.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'd9516eecc64bd90b0022714d26',
                        itemText: 'Green Umbrella - Sustained Edition',
                        optionItems: [
                            {
                                adjustedTax: 0,
                                basePrice: 0,
                                bonusProductLineItem: false,
                                gift: false,
                                itemId: '8991e8d7adf0f46ffbc584e175',
                                itemText: 'We will plant a tree for your order.',
                                optionId: 'plantATree',
                                optionValueId: '000',
                                price: 0,
                                priceAfterItemDiscount: 0,
                                priceAfterOrderDiscount: 0,
                                productId: '000',
                                productName: 'Plant a tree.',
                                quantity: 3,
                                shipmentId: 'me',
                                tax: 0,
                                taxBasis: 0,
                                taxClassId: 'standard',
                                taxRate: 0.05
                            }
                        ],
                        price: 599.99,
                        priceAfterItemDiscount: 599.99,
                        priceAfterOrderDiscount: 589.99,
                        productId: 'green-umbrella',
                        productName: 'Green Umbrella - Sustained Edition',
                        quantity: 3,
                        shipmentId: 'me',
                        tax: 30,
                        taxBasis: 599.97,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ],
                shippingItems: [
                    {
                        adjustedTax: 0.8,
                        basePrice: 15.99,
                        itemId: '768abee75aa8015239a9696c7e',
                        itemText: 'Shipping',
                        price: 15.99,
                        priceAfterItemDiscount: 15.99,
                        shipmentId: 'me',
                        tax: 0.8,
                        taxBasis: 15.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ],
                priceAdjustments: []
            }
        })

        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })

        req.body = {
            data: {
                paymentMethod: {
                    type: 'klarna'
                }
            }
        }

        await PaymentsController(req, res, next)
        expect(res.locals.response).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
        expect(mockPayments).toHaveBeenCalledWith(
            expect.objectContaining({
                lineItems: [
                    {
                        id: 'd9516eecc64bd90b0022714d26',
                        quantity: 3,
                        description: 'Green Umbrella - Sustained Edition',
                        amountExcludingTax: 19999,
                        taxAmount: 3000,
                        taxCategory: 'None',
                        taxPercentage: 0.05
                    },
                    {
                        id: '768abee75aa8015239a9696c7e',
                        quantity: 1,
                        description: 'Shipping',
                        amountExcludingTax: 1599,
                        taxAmount: 80,
                        taxCategory: 'None',
                        taxPercentage: 0.05
                    }
                ]
            }),
            {
                idempotencyKey: expect.any(String)
            }
        )
        expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments resultCode Authorised')
        expect(next).toHaveBeenCalled()
    })
    it('returns checkout response when tokenization is set along with request', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })

        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })

        req.body = {
            data: {
                paymentMethod: {
                    type: 'scheme'
                },
                storePaymentMethod: true
            }
        }

        await PaymentsController(req, res, next)
        expect(res.locals.response).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
        expect(mockPayments).toHaveBeenCalledWith(
            expect.objectContaining({
                storePaymentMethod: true,
                recurringProcessingModel: 'CardOnFile',
                shopperInteraction: 'Ecommerce'
            }),
            {
                idempotencyKey: expect.any(String)
            }
        )
        expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments resultCode Authorised')
        expect(next).toHaveBeenCalled()
    })
    it('returns checkout response when request is made with tokenized payment method', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })

        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })

        req.body = {
            data: {
                paymentMethod: {
                    type: 'scheme',
                    storedPaymentMethodId: '8416038790273850'
                }
            }
        }

        await PaymentsController(req, res, next)
        expect(res.locals.response).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
        expect(mockPayments).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentMethod: {
                    type: 'scheme',
                    storedPaymentMethodId: '8416038790273850'
                },
                recurringProcessingModel: 'CardOnFile',
                shopperInteraction: 'ContAuth'
            }),
            {
                idempotencyKey: expect.any(String)
            }
        )
        expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments resultCode Authorised')
        expect(next).toHaveBeenCalled()
    })
    it('returns checkout response and updates order payment transaction if order has paymentInstrument', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                paymentInstruments: [
                    {
                        amount: 20,
                        paymentInstrumentId: 'ca47e0da3d49b067b630db624a',
                        paymentMethodId: 'BML'
                    }
                ],
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })

        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.AUTHORISED,
                merchantReference: 'reference123'
            }
        })

        req.body = {
            data: {
                paymentMethod: {
                    type: 'scheme'
                }
            }
        }

        await PaymentsController(req, res, next)
        expect(res.locals.response).toEqual({
            isFinal: true,
            isSuccessful: true,
            merchantReference: 'reference123'
        })
        expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments resultCode Authorised')
        expect(next).toHaveBeenCalled()
    })
    it('returns error if payment response is final and not successful', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })
        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.ERROR,
                merchantReference: 'reference123'
            }
        })

        await PaymentsController(req, res, next)
        expect(res.locals.response).toBeNil()
        expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments resultCode Error')
        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('payment not successful')
        expect(next).toHaveBeenCalledWith(new AdyenError('payment not successful', 400))
    })
    it('returns error if payment response is error and remove all paymentInstrument', async () => {
        mockGetBasket.mockImplementationOnce(() => {
            return {
                basketId: 'testBasket',
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockGetBasket.mockImplementationOnce(() => {
            return {
                basketId: 'testBasket',
                paymentInstruments: [
                    {
                        paymentInstrumentId: 'testPaymentInstrumentId'
                    }
                ]
            }
        })
        mockCreateOrder.mockImplementationOnce(() => {
            return {
                customerInfo: {
                    customerId: 'testCustomer'
                },
                customerName: 'John Doe',
                orderNo: '123',
                orderTotal: 100,
                currency: 'USD',
                shipments: [
                    {
                        shippingAddress: {
                            city: 'New York',
                            countryCode: 'US',
                            address2: 'Apt 123',
                            postalCode: '10001',
                            stateCode: 'NY',
                            address1: '123 Main St'
                        }
                    }
                ],
                billingAddress: {
                    city: 'New York',
                    countryCode: 'US',
                    address2: 'Apt 123',
                    postalCode: '10001',
                    stateCode: 'NY',
                    address1: '123 Main St'
                },
                productItems: [
                    {
                        adjustedTax: 1.5,
                        basePrice: 29.99,
                        bonusProductLineItem: false,
                        gift: false,
                        itemId: 'f9fe488b0b925984ffd1d5b360',
                        itemText: 'Striped Silk Tie',
                        price: 29.99,
                        priceAfterItemDiscount: 29.99,
                        priceAfterOrderDiscount: 29.99,
                        productId: '793775362380M',
                        productName: 'Striped Silk Tie',
                        quantity: 1,
                        shipmentId: 'me',
                        tax: 1.5,
                        taxBasis: 29.99,
                        taxClassId: 'standard',
                        taxRate: 0.05
                    }
                ]
            }
        })
        mockPayments.mockImplementationOnce(() => {
            return {
                resultCode: RESULT_CODES.ERROR,
                merchantReference: 'reference123'
            }
        })

        await PaymentsController(req, res, next)
        expect(res.locals.response).toBeNil()
        expect(mockRemovePaymentInstrumentFromBasket).toHaveBeenCalled()
        expect(consoleInfoSpy).toHaveBeenCalledTimes(5)
        expect(consoleInfoSpy.mock.calls[0][0]).toContain('sendPayments start')
        expect(consoleInfoSpy.mock.calls[1][0]).toContain('sendPayments orderCreated 123')
        expect(consoleInfoSpy.mock.calls[2][0]).toContain('sendPayments resultCode Error')
        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(consoleErrorSpy.mock.calls[0][0]).toContain('payment not successful')
        expect(next).toHaveBeenCalledWith(new AdyenError('payment not successful', 400))
    })
})
