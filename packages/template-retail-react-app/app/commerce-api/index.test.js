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
import {createGetTokenBody} from './utils'
import {generateCodeChallenge, createCodeVerifier} from './pkce'
import {
    exampleRedirectUrl as mockExampleRedirectUrl,
    exampleTokenReponse as mockExampleTokenResponse,
    exampleTokenReponseForRefresh as mockExampleTokenReponseForRefresh,
    examplePKCEVerifier,
    email,
    password,
    expiredAuthToken,
    ocapiBasketResponse,
    ocapiFaultResponse
} from './mock-data'

jest.mock('cross-fetch', () => jest.requireActual('jest-fetch-mock'))

const apiConfig = {
    ...appConfig.commerceAPI,
    einsteinConfig: appConfig.einsteinAPI,
    proxy: undefined,
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
        ShopperLogin: class ShopperLoginMock {
            async getAccessToken() {
                return mockExampleTokenResponse
            }
            async authorizeCustomer() {
                return {
                    status: 303,
                    headers: {
                        get: () => null
                    },
                    url: mockExampleRedirectUrl
                }
            }
            async authenticateCustomer() {
                return {
                    status: 303,
                    headers: {
                        get: () => null
                    },
                    url: mockExampleRedirectUrl
                }
            }
            async logoutCustomer() {
                return {
                    status: 200,
                    headers: {
                        get: () => null
                    },
                    url: mockExampleTokenResponse
                }
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

beforeEach(() => {
    jest.resetModules()
    // Clearing out mocked local storage before each test so tokens don't get mixed
    const api = getAPI()
    api.auth._clearAuth()
    fetch.resetMocks()
})

describe('CommerceAPI', () => {
    test('provides instantiated sdk classes as instance properties using given config', () => {
        const api = getAPI()
        const apiNames = [
            'shopperCustomers',
            'shopperBaskets',
            'shopperGiftCertificates',
            'shopperLogin',
            'shopperOrders',
            'shopperProducts',
            'shopperPromotions',
            'shopperSearch'
        ]
        expect(api.shopperCustomers.clientConfig.parameters).toEqual(apiConfig.parameters)
        apiNames.forEach((name) => expect(api[name]).toBeDefined())
        expect(typeof api.shopperCustomers.getCustomer).toBe('function')
    })
    test('returns api config', () => {
        const config = getAPI().getConfig()
        expect(config.parameters).toEqual(apiConfig.parameters)
    })
    test('calls willSendResponse with request name and options (including auto-injected locale and currency)', () => {
        const api = getAPI()
        const spy = jest.spyOn(api, 'willSendRequest')
        api.shopperProducts.getProduct({parameters: {id: '123'}})
        expect(spy).toHaveBeenCalledWith('getProduct', {
            parameters: {id: '123', locale: 'en-GB', currency: 'GBP'}
        })
    })
    test('can optionally ignore req/res hooks', () => {
        const api = getAPI()
        const spy = jest.spyOn(api, 'willSendRequest')
        api.shopperProducts.getProduct({
            parameters: {id: '123'},
            ignoreHooks: true
        })
        expect(spy).not.toHaveBeenCalled()
    })
    test('passing in locale/currency in the API method would override the global values', () => {
        const api = getAPI()
        const spy = jest.spyOn(api, 'willSendRequest')

        api.shopperProducts.getProduct({
            parameters: {id: '123', locale: 'en-US'}
        })
        expect(spy).toHaveBeenCalledWith('getProduct', {
            parameters: {id: '123', locale: 'en-US', currency: 'GBP'}
        })

        api.shopperProducts.getProduct({
            parameters: {id: '123', currency: 'EUR'}
        })
        expect(spy).toHaveBeenCalledWith('getProduct', {
            parameters: {id: '123', locale: 'en-GB', currency: 'EUR'}
        })
    })
    test('applies updated options when calling sdk methods', async () => {
        class MyAPI extends CommerceAPI {
            async willSendRequest() {
                return [{parameters: {id: '567'}}]
            }
        }
        const myAPI = new MyAPI(apiConfig)
        const result = await myAPI.shopperProducts.getProduct({
            parameters: {id: '123'}
        })
        expect(result).toEqual({parameters: {id: '567'}})
    })
    test('can modify response before returning to caller', async () => {
        const spy = jest.fn()
        class MyAPI extends CommerceAPI {
            async willSendRequest(method, ...args) {
                return args
            }
            async didReceiveResponse(response, args) {
                spy(response, args)
                return `${response.length} product`
            }
        }
        const myAPI = new MyAPI(apiConfig)
        const result = await myAPI.shopperProducts.getProducts({
            parameters: {ids: ['123']}
        })
        expect(spy).toHaveBeenCalledWith(
            [{id: '123'}],
            [{parameters: {ids: ['123'], locale: 'en-GB', currency: 'GBP'}}]
        )
        expect(result).toBe('1 product')
    })
    test('authorizes guest user', async () => {
        const _CommerceAPI = require('./index').default
        const api = new _CommerceAPI(apiConfig)
        const customer = await api.auth.login()
        expect(customer).toBeDefined()
        expect(customer.authType).toEqual('guest')
    })
    test('customer is returned when you call login with credentials', async () => {
        const _CommerceAPI = require('./index').default
        const api = new _CommerceAPI(apiConfig)
        const customer = await api.auth.login({email, password})
        expect(customer).toBeDefined()
        expect(customer.authType).toEqual('registered')
        expect(api.auth.encUserId.length).toBeGreaterThan(0)
    })
    test('refreshes existing logged in token', async () => {
        const _CommerceAPI = require('./index').default
        const api = new _CommerceAPI(apiConfig)
        api.auth.authToken = mockExampleTokenResponse.access_token
        api.auth._saveRefreshToken(mockExampleTokenResponse.refresh_token, 'registered')
        const customer = await api.auth.login()
        expect(customer).toBeDefined()
        expect(customer.authType).toEqual('registered')
        expect(api.auth.encUserId.length).toBeGreaterThan(0)
    })
    test('Use same customer if token is valid', async () => {
        const Utils = require('./utils')
        jest.spyOn(Utils, 'isTokenValid').mockReturnValue(true)
        const _CommerceAPI = require('./index').default
        const api = new _CommerceAPI(apiConfig)

        api.auth.authToken = mockExampleTokenReponseForRefresh.access_token

        await api.auth.login()
        expect(api.auth.authToken).toBeDefined()
        expect(api.auth.authToken).toEqual(mockExampleTokenReponseForRefresh.access_token)
    })
    test('refreshes existing token', async () => {
        const _CommerceAPI = require('./index').default
        const api = new _CommerceAPI(apiConfig)
        await api.auth.login()
        const existingToken = api.auth.authToken
        expect(`Bearer ${mockExampleTokenResponse.access_token}`).toEqual(existingToken)
        api.auth.authToken = mockExampleTokenReponseForRefresh.access_token
        await api.auth.login()
        expect(api.auth.authToken).toBeDefined()
        expect(api.auth.authToken).not.toEqual(mockExampleTokenReponseForRefresh)
    })
    test('re-authorizes as guest when existing token is expired', async () => {
        const api = getAPI()
        await api.auth.login()
        api.auth.authToken = expiredAuthToken
        api.auth._saveRefreshToken(mockExampleTokenResponse.refresh_token, 'registered')
        await api.auth.login()
        expect(api.auth.authToken).toBeDefined()
        expect(api.auth.authToken).not.toEqual(expiredAuthToken)
    })

    test('logs back in as new guest after log out', async () => {
        const api = getAPI()
        await api.auth.login()
        const existingToken = api.auth.authToken
        expect(existingToken).toBeDefined()
        await api.auth.logout()
        expect(api.auth.authToken).toBeDefined()
        expect(api.auth.authToken).not.toEqual(mockExampleTokenReponseForRefresh)
    })

    test('automatically authorizes customer when calling sdk methods', async () => {
        const api = getAPI()
        api.auth.authToken = ''
        await Promise.all([
            api.shopperProducts.getProduct({parameters: {id: '10048'}}),
            api.shopperProducts.getProduct({parameters: {id: '10048'}})
        ])
        expect(api.auth.authToken).toBeDefined()
    })
    test('calling login while its already pending returns existing promise', () => {
        const api = getAPI()
        const pendingLogin = api.auth.login()
        const secondPendingLogin = api.auth.login()
        expect(pendingLogin).toEqual(secondPendingLogin)
    })
    test('createGetTokenBody returns an object that contain the correct parameters', async () => {
        const slasCallbackEndpoint = apiConfig.parameters.slasCallbackEndpoint || '/callback'
        const tokenBody = createGetTokenBody(
            mockExampleRedirectUrl,
            slasCallbackEndpoint,
            examplePKCEVerifier
        )
        const {grantType, code, usid, codeVerifier, redirectUri} = tokenBody
        expect(grantType).toBeDefined()
        expect(code).toBeDefined()
        expect(usid).toBeDefined()
        expect(codeVerifier).toBeDefined()
        expect(redirectUri).toBeDefined()
    })
    test('should return a code verifier of 128 chracters', () => {
        const codeVerifier = createCodeVerifier()
        expect(codeVerifier.length).toEqual(128)
    })
    test('should return a code challenge of 43 chracters', async () => {
        const codeVerifier = createCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)
        expect(codeChallenge.length).toEqual(43)
    })
    test('calling getLoggedInToken should set JWT Token and Refresh Token ', async () => {
        const _CommerceAPI = require('./index').default
        const api = new _CommerceAPI(apiConfig)
        const tokenBody = createGetTokenBody(
            mockExampleRedirectUrl,
            apiConfig.parameters.slasCallbackEndpoint,
            examplePKCEVerifier
        )
        await api.auth.getLoggedInToken(tokenBody)
        expect(api.auth.authToken).toEqual(`Bearer ${mockExampleTokenResponse.access_token}`)
        expect(api.auth.refreshToken).toEqual(mockExampleTokenResponse.refresh_token)
    })
    test('saves access token in local storage if window exists', async () => {
        const api = getAPI()
        api.auth.authToken = mockExampleTokenResponse.access_token
        expect(api.auth.authToken).toEqual(mockExampleTokenResponse.access_token)
    })
    test('saves refresh token in local storage if window exists', async () => {
        const api = getAPI()
        api.auth._saveRefreshToken(mockExampleTokenResponse.refresh_token)
        expect(api.auth.refreshToken).toEqual(mockExampleTokenResponse.refresh_token)
    })
    test('saves encUserId in local storage if window exists', async () => {
        const api = getAPI()
        api.auth.encUserId = mockExampleTokenResponse.enc_user_id
        expect(api.auth.encUserId).toEqual(mockExampleTokenResponse.enc_user_id)
    })
    test('saves usid in local storage if window exists', async () => {
        const api = getAPI()
        api.auth.usid = mockExampleTokenResponse.usid
        expect(api.auth.usid).toEqual(mockExampleTokenResponse.usid)
    })
    test('test onClient is true if window exists', async () => {
        const api = getAPI()
        expect(api.auth._onClient).toEqual(true)
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
        expect(response.title).toEqual(
            'The following parameters were missing from your resquest: basketId'
        )
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
            parameters: {}
        })
        expect(response.title).toEqual('Body is required for this request')
        expect(response.type).toEqual('MissingBody')
    })
    test('calling getOrder returns basket object', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperOrders.getOrder({
            parameters: {orderNo: ''}
        })
        expect(response).toBeDefined()
        expect(response.customerInfo.customerId).toBeDefined()
    })
    test('calling createOrder without orderNo returns descriptive error', async () => {
        const api = getAPI()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await api.shopperOrders.getOrder({
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
                body: {basketId: ''}
            })
        ).rejects.toThrow(ocapiFaultResponse.fault.message)
    })
})
