/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CommerceAPI from '.'
import fetch from 'jest-fetch-mock'

// NOTE: this will need to be a fixed or known config for testing against
// It will probably end up living in pwa-kit later on so we may want to
// deal with it there.
import {app as appConfig} from '../../config/default'
import {
    exampleRedirectUrl as mockExampleRedirectUrl,
    exampleTokenReponse as mockExampleTokenResponse,
    exampleTokenReponseForRefresh as mockExampleTokenReponseForRefresh,
    ocapiBasketResponse,
    ocapiFaultResponse
} from './mock-data'

jest.mock('cross-fetch', () => jest.requireActual('jest-fetch-mock'))

jest.mock('./utils', () => {
    const originalModule = jest.requireActual('./utils')
    return {
        ...originalModule
    }
})

const apiConfig = {
    ...appConfig.commerceAPI,
    einsteinConfig: appConfig.einsteinAPI,
    locale: 'en-GB',
    currency: 'GBP'
}
const getAPI = () => new CommerceAPI(apiConfig)

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperProducts: class ShopperProductsMock extends sdk.ShopperProducts {
            async getProduct(args) {
                return args
            }
            async getProducts(options) {
                return options.parameters.ids.map((id) => ({id}))
            }
        },
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async getAccessToken() {
                return mockExampleTokenResponse
            }
            async authorizeCustomer() {
                return {
                    headers: {
                        get: () => `Bearer ${mockExampleTokenResponse.access_token}`
                    },
                    status: 200,
                    json: async () => {
                        return {
                            customerId: 'testId'
                        }
                    }
                }
            }
        }
    }
})

jest.mock('pwa-kit-react-sdk/ssr/universal/components/storefront-preview/utils', () => {
    return {
        detectStorefrontPreview: () => true
    }
})

beforeEach(() => {
    jest.resetModules()
    // Clearing out mocked local storage before each test so tokens don't get mixed
    fetch.resetMocks()
})

describe('CommerceAPI', () => {
    test('provides instantiated sdk classes as instance properties using given config', () => {
        const api = getAPI()
        const apiNames = [
            'shopperCustomers',
            'shopperBaskets',
            'shopperGiftCertificates',
            'shopperOrders',
            'shopperProducts',
            'shopperPromotions',
            'shopperSearch'
        ]
        expect(api.shopperCustomers.clientConfig.parameters).toEqual(apiConfig.parameters)
        apiNames.forEach((name) => {
            expect(api[name]).toBeDefined()
        })
        expect(typeof api.shopperCustomers.getCustomer).toBe('function')
    })
    test('returns api config', () => {
        const config = getAPI().getConfig()
        expect(config.parameters).toEqual(apiConfig.parameters)
    })
    test('calling createBasket returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basket = await api.shopperBaskets.createBasket({})
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling getBasket with basketId returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.getBasket({
            parameters: {basketId: basketId}
        })
        expect(response).toBeDefined()
        expect(response.customerInfo.customerId).toBeDefined()
    })
    test('calling getBasket without basketId returns descriptive error', async () => {
        const api = getAPI()
        const response = await api.shopperBaskets.getBasket({})
        expect(response.title).toEqual('Parameters are required for this request')
        expect(response.type).toEqual('MissingParameters')
    })
    test('calling addItemToBasket with basketId & body returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.addItemToBasket({
            parameters: {
                basketId: basketId
            },
            body: {
                productId: 'fake-product-id',
                quantity: 1
            }
        })
        expect(response).toBeDefined()
        expect(response.customerInfo.customerId).toBeDefined()
    })
    test('calling addItemToBasket without body returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.addItemToBasket({
            parameters: {
                basketId: basketId
            }
        })
        expect(response.title).toEqual('Body is required for this request')
        expect(response.type).toEqual('MissingBody')
    })
    test('calling updateItemInBasket with basketId & body returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.updateItemInBasket({
            parameters: {
                basketId: basketId
            },
            body: {
                productId: 'fake-product-id',
                quantity: 1
            }
        })
        expect(response).toBeDefined()
        expect(response.customerInfo.customerId).toBeDefined()
    })
    test('calling updateItemInBasket without body returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.updateItemInBasket({
            parameters: {
                basketId: basketId
            }
        })
        expect(response.title).toEqual('Body is required for this request')
        expect(response.type).toEqual('MissingBody')
    })
    test('calling removeItemFromBasket returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const basket = await api.shopperBaskets.removeItemFromBasket({
            parameters: {
                basketId: basketId,
                itemId: 'fake-product-id'
            }
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling removeItemFromBasket without basket returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperBaskets.removeItemFromBasket({
            parameters: {
                itemId: 'fake-product-id'
            }
        })
        expect(response.title).toEqual(
            'The following parameters were missing from your resquest: basketId'
        )
        expect(response.type).toEqual('MissingParameters')
    })
    test('calling addPaymentInstrumentToBasket returns basketId object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const basket = await api.shopperBaskets.addPaymentInstrumentToBasket({
            parameters: {
                basketId: basketId
            },
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling addPaymentInstrumentToBasket without basketId & body returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperBaskets.addPaymentInstrumentToBasket({
            parameters: {}
        })
        expect(response.title).toEqual('Body is required for this request')
        expect(response.type).toEqual('MissingBody')
    })
    test('calling removePaymentInstrumentFromBasket returns basketId object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const basket = await api.shopperBaskets.removePaymentInstrumentFromBasket({
            parameters: {
                basketId: basketId,
                paymentInstrumentId: 'fake-id'
            },
            body: {
                payment_instrument_id: 'ce6QR9aaabmakaaadf1KdLcXoH',
                payment_method_id: 'CREDIT_CARD',
                payment_card: {
                    card_type: 'Visa',
                    expiration_month: 12,
                    expiration_year: 21.2,
                    holder: 'Jeff Lebowski',
                    masked_number: '************1111'
                },
                amount: 0.0
            }
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling removePaymentInstrumentFromBasket without basketId & paymentInstrumentId returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperBaskets.removePaymentInstrumentFromBasket({
            parameters: {body: {}}
        })
        expect(response.title).toEqual(
            'The following parameters were missing from your resquest: basketId,paymentInstrumentId'
        )
        expect(response.type).toEqual('MissingParameters')
    })
    test('calling getShippingMethodsForShipment returns basketId object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const basket = await api.shopperBaskets.getShippingMethodsForShipment({
            parameters: {
                basketId: basketId,
                shipmentId: 'fake-id'
            }
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling getShippingMethodsForShipment without shipmentId returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.getShippingMethodsForShipment({
            parameters: {
                basketId: basketId
            }
        })
        expect(response.title).toEqual(
            'The following parameters were missing from your resquest: shipmentId'
        )
        expect(response.type).toEqual('MissingParameters')
    })
    test('calling updateBillingAddressForBasket returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const basket = await api.shopperBaskets.updateBillingAddressForBasket({
            parameters: {
                basketId: basketId
            },
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling updateBillingAddressForBasket without body returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.updateBillingAddressForBasket({
            parameters: {
                basketId: basketId
            }
        })
        expect(response.title).toEqual('Body is required for this request')
        expect(response.type).toEqual('MissingBody')
    })
    test('calling updateShippingAddressForShipment returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const basket = await api.shopperBaskets.updateShippingAddressForShipment({
            parameters: {
                basketId: basketId,
                shipmentId: 'fake-id'
            },
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling updateShippingAddressForShipment without shipmentId returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.updateShippingAddressForShipment({
            parameters: {
                basketId: basketId
            },
            body: {}
        })
        expect(response.title).toEqual(
            'The following parameters were missing from your resquest: shipmentId'
        )
        expect(response.type).toEqual('MissingParameters')
    })
    test('calling updateShippingMethodForShipment returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const basket = await api.shopperBaskets.updateShippingMethodForShipment({
            parameters: {
                basketId: basketId,
                shipmentId: 'fake-id'
            },
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling updateShippingMethodForShipment without shipmentId returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.updateShippingMethodForShipment({
            parameters: {
                basketId: basketId
            },
            body: {}
        })
        expect(response.title).toEqual(
            'The following parameters were missing from your resquest: shipmentId'
        )
        expect(response.type).toEqual('MissingParameters')
    })
    test('calling updateCustomerForBasket returns basket object in camelCase', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const basket = await api.shopperBaskets.updateCustomerForBasket({
            parameters: {
                basketId: basketId
            },
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
    })
    test('calling updateCustomerForBasket without body returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const response = await api.shopperBaskets.updateCustomerForBasket({
            parameters: {
                basketId: basketId
            }
        })
        expect(response.title).toEqual('Body is required for this request')
        expect(response.type).toEqual('MissingBody')
    })
    test('calling deleteBasket returns status of 204', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify({status: 204}))

        const basketId = 'bczFTaOjgEqUkaaadkvHwbgrP5'
        const respsonse = await api.shopperBaskets.deleteBasket({
            parameters: {
                basketId: basketId
            },
            body: {}
        })
        expect(respsonse).toBeDefined()
        expect(respsonse.status).toEqual(204)
    })
    test('calling deleteBasket without basketId returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperBaskets.deleteBasket({
            parameters: {}
        })
        expect(response.title).toEqual(
            'The following parameters were missing from your resquest: basketId'
        )
        expect(response.type).toEqual('MissingParameters')
    })

    test('ocapiFetch ShopperBaskets throws an error when it receives error from OCAPI', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiFaultResponse))

        await expect(api.shopperBaskets.createBasket({})).rejects.toThrow(
            ocapiFaultResponse.fault.message
        )
    })
    test('calling createOrder returns basket object', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperOrders.createOrder({
            headers: {_sfdc_customer_id: 'usid'},
            parameters: {},
            body: {basketId: ''}
        })
        expect(response).toBeDefined()
        expect(response.customerInfo.customerId).toBeDefined()
    })
    test('calling createOrder without body returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperOrders.createOrder({
            headers: {_sfdc_customer_id: 'usid'},
            parameters: {}
        })
        expect(response.title).toEqual('Body is required for this request')
        expect(response.type).toEqual('MissingBody')
    })
    test('calling getOrder returns basket object', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperOrders.getOrder({
            headers: {_sfdc_customer_id: 'usid'},
            parameters: {orderNo: ''}
        })
        expect(response).toBeDefined()
        expect(response.customerInfo.customerId).toBeDefined()
    })
    test('calling createOrder without orderNo returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperOrders.getOrder({
            headers: {_sfdc_customer_id: 'usid'},
            parameters: {}
        })
        expect(response.title).toEqual(
            'The following parameters were missing from your resquest: orderNo'
        )
        expect(response.type).toEqual('MissingParameters')
    })

    test('ocapiFetch ShopperOrders throws an error when it receives error from OCAPI', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiFaultResponse))

        await expect(
            api.shopperOrders.createOrder({
                parameters: {},
                headers: {_sfdc_customer_id: 'usid'},
                body: {basketId: ''}
            })
        ).rejects.toThrow(ocapiFaultResponse.fault.message)
    })
})
