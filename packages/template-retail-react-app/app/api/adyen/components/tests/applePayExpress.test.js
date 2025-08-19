/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    getCustomerBillingDetails,
    getCustomerShippingDetails,
    getApplePaymentMethodConfig,
    getAppleButtonConfig
} from '@salesforce/retail-react-app/app/api/adyen/components/applePayExpress'

jest.mock('@salesforce/retail-react-app/app/api/adyen/services/payments', () => {
    return {
        AdyenPaymentsService: jest.fn().mockImplementation(() => ({
            submitPayment: jest.fn().mockResolvedValue({mockData: 'Mocked response'})
        }))
    }
})

describe('getAppleButtonConfig function', () => {
    let mockGetTokenWhenReady

    beforeEach(() => {
        mockGetTokenWhenReady = jest.fn().mockResolvedValue('mockToken')
    })

    it('returns expected button configuration and resolves onAuthorized event', async () => {
        const getTokenWhenReady = mockGetTokenWhenReady
        const site = 'mockSite'
        const basket = {
            orderTotal: 100,
            currency: 'USD',
            basketId: 'mockBasketId',
            customerInfo: {customerId: 'mockCustomerId'}
        }
        const shippingMethods = [{id: 1, name: 'Standard Shipping', price: 10}]
        const applePayConfig = {merchantName: 'Mock Merchant'}
        const navigate = jest.fn()
        const fetchShippingMethods = jest.fn().mockResolvedValue({
            applicableShippingMethods: [{id: 1, name: 'Standard Shipping', price: 10}]
        })

        const buttonConfig = getAppleButtonConfig(
            getTokenWhenReady,
            site,
            basket,
            shippingMethods,
            applePayConfig,
            navigate,
            fetchShippingMethods
        )

        expect(buttonConfig.showPayButton).toBeTruthy()
        expect(buttonConfig.amount.value).toBe(10000)
        expect(buttonConfig.amount.currency).toBe('USD')
        expect(buttonConfig.requiredShippingContactFields).toEqual([
            'postalAddress',
            'name',
            'phoneticName',
            'email',
            'phone'
        ])
        expect(buttonConfig.requiredBillingContactFields).toEqual(['postalAddress'])

        const resolve = jest.fn()
        await buttonConfig.onAuthorized(resolve, jest.fn(), {
            payment: {
                shippingContact: {},
                billingContact: {},
                token: {paymentData: 'mockPaymentData'}
            }
        })
    })
})

describe('getCustomerBillingDetails function', () => {
    it('returns expected billing details when all properties are provided', () => {
        const billingContact = {
            locality: 'City',
            countryCode: 'US',
            addressLines: ['123 Main St', 'Apt 2'],
            postalCode: '12345',
            administrativeArea: 'State'
        }
        const expectedBillingDetails = {
            billingAddress: {
                city: 'City',
                country: 'US',
                houseNumberOrName: 'Apt 2',
                postalCode: '12345',
                stateOrProvince: 'State',
                street: '123 Main St'
            }
        }
        expect(getCustomerBillingDetails(billingContact)).toEqual(expectedBillingDetails)
    })

    it('returns expected billing details when addressLines is not provided', () => {
        const billingContact = {
            locality: 'City',
            countryCode: 'US',
            postalCode: '12345',
            administrativeArea: 'State'
        }
        const expectedBillingDetails = {
            billingAddress: {
                city: 'City',
                country: 'US',
                houseNumberOrName: '',
                postalCode: '12345',
                stateOrProvince: 'State',
                street: undefined
            }
        }
        expect(getCustomerBillingDetails(billingContact)).toEqual(expectedBillingDetails)
    })
})

describe('getCustomerShippingDetails function', () => {
    it('returns expected shipping details when all properties are provided', () => {
        const shippingContact = {
            locality: 'City',
            countryCode: 'US',
            addressLines: ['123 Main St', 'Apt 2'],
            postalCode: '12345',
            administrativeArea: 'State',
            givenName: 'John',
            familyName: 'Doe',
            emailAddress: 'john.doe@example.com',
            phoneNumber: '123-456-7890'
        }
        const expectedShippingDetails = {
            deliveryAddress: {
                city: 'City',
                country: 'US',
                houseNumberOrName: 'Apt 2',
                postalCode: '12345',
                stateOrProvince: 'State',
                street: '123 Main St'
            },
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '123-456-7890'
            }
        }
        expect(getCustomerShippingDetails(shippingContact)).toEqual(expectedShippingDetails)
    })

    it('returns expected shipping details when addressLines is not provided', () => {
        const shippingContact = {
            locality: 'City',
            countryCode: 'US',
            postalCode: '12345',
            administrativeArea: 'State',
            givenName: 'John',
            familyName: 'Doe',
            emailAddress: 'john.doe@example.com',
            phoneNumber: '123-456-7890'
        }
        const expectedShippingDetails = {
            deliveryAddress: {
                city: 'City',
                country: 'US',
                houseNumberOrName: '',
                postalCode: '12345',
                stateOrProvince: 'State',
                street: undefined
            },
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '123-456-7890'
            }
        }
        expect(getCustomerShippingDetails(shippingContact)).toEqual(expectedShippingDetails)
    })
})

describe('getApplePaymentMethodConfig function', () => {
    it('returns null if paymentMethodsResponse is undefined', () => {
        expect(getApplePaymentMethodConfig()).toBeNull()
    })

    it('returns null if paymentMethodsResponse.paymentMethods is undefined', () => {
        expect(getApplePaymentMethodConfig({})).toBeNull()
    })

    it('returns null if no apple pay payment method is found', () => {
        const paymentMethodsResponse = {
            paymentMethods: [
                {
                    type: 'visa',
                    configuration: {}
                },
                {
                    type: 'mastercard',
                    configuration: {}
                }
            ]
        }
        expect(getApplePaymentMethodConfig(paymentMethodsResponse)).toBeNull()
    })

    it('returns configuration object if apple pay payment method is found', () => {
        const paymentMethodsResponse = {
            paymentMethods: [
                {
                    type: 'visa',
                    configuration: {}
                },
                {
                    type: 'applepay',
                    configuration: {}
                }
            ]
        }
        expect(getApplePaymentMethodConfig(paymentMethodsResponse)).toEqual({})
    })
})
