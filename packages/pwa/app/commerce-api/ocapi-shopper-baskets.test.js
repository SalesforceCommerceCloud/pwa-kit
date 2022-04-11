/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fetch from 'jest-fetch-mock'
import {app as appConfig} from '../../config/default'
import OcapiShopperBaskets from './ocapi-shopper-baskets'
import {
    ocapiBasketResponse,
    ocapiBasketWithItem,
    ocapiBasketWithPaymentInstrumentAndBillingAddress,
    mockShippingMethods
} from './mock-data'

jest.mock('cross-fetch', () => jest.requireActual('jest-fetch-mock'))

const apiConfig = {...appConfig.commerceAPI, proxy: undefined}
const getOcapiShopperBaskets = () => new OcapiShopperBaskets(apiConfig)
beforeEach(() => {
    jest.resetModules()
    fetch.resetMocks()
})

describe('test OcapiShopperBaskets class', () => {
    test('createBasket returns a basket object in camelCase', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basket = await ocapiShopperBaskets.createBasket({})
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
        expect(basket.shipments[0].shipmentId).toBeDefined()
    })
    test('updateBasket returns a basket object in camelCase', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basket = await ocapiShopperBaskets.updateBasket({
            parameters: {basketId: 'testBasketId'},
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
        expect(basket.shipments[0].shipmentId).toBeDefined()
    })
    test('updateBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.updateBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('getBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.getBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('getBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basket = await ocapiShopperBaskets.getBasket({
            parameters: {basketId: 'testBasketId'}
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo.customerId).toBeDefined()
        expect(basket.shipments[0].shipmentId).toBeDefined()
    })
    test('addItemToBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.addItemToBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })

    test('addItemToBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithItem))
        const basket = await ocapiShopperBaskets.addItemToBasket({
            parameters: {basketId: 'testBasketId'},
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.productItems).toBeDefined()
        expect(basket.shipments[0].shipmentId).toBeDefined()
    })
    test('updateItemInBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.updateItemInBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('updateItemInBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithItem))
        const basket = await ocapiShopperBaskets.updateItemInBasket({
            parameters: {basketId: 'testBasketId'},
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.productItems).toBeDefined()
        expect(basket.shipments[0].shipmentId).toBeDefined()
    })
    test('removeItemFromBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.removeItemFromBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('removeItemFromBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithItem))
        const basket = await ocapiShopperBaskets.removeItemFromBasket({
            parameters: {basketId: 'testBasketId', itemId: 'fakeItemId'}
        })
        expect(basket).toBeDefined()
        expect(basket.productItems).toBeDefined()
        expect(basket.shipments[0].shipmentId).toBeDefined()
    })
    test('addPaymentInstrumentToBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.addPaymentInstrumentToBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('addPaymentInstrumentToBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const basket = await ocapiShopperBaskets.addPaymentInstrumentToBasket({
            parameters: {basketId: 'testBasketId'},
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.paymentInstruments[0]).toBeDefined()
        expect(basket.paymentInstruments[0].paymentCard).toBeDefined()
    })
    test('removePaymentInstrumentFromBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.removePaymentInstrumentFromBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('removePaymentInstrumentFromBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basket = await ocapiShopperBaskets.removePaymentInstrumentFromBasket({
            parameters: {basketId: 'testBasketId', paymentInstrumentId: 'paymentInstrumentId'}
        })
        expect(basket).toBeDefined()
        expect(basket.paymentInstruments).not.toBeDefined()
    })
    test('getPaymentMethodsForBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const response = await ocapiShopperBaskets.getPaymentMethodsForBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('getPaymentMethodsForBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const basket = await ocapiShopperBaskets.getPaymentMethodsForBasket({
            parameters: {basketId: 'testBasketId'}
        })
        expect(basket).toBeDefined()
        expect(basket.paymentInstruments[0]).toBeDefined()
        expect(basket.paymentInstruments[0].paymentCard).toBeDefined()
    })
    test('getShippingMethodsForShipment returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const response = await ocapiShopperBaskets.getShippingMethodsForShipment({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('getShippingMethodsForShipment returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(mockShippingMethods))
        const methods = await ocapiShopperBaskets.getShippingMethodsForShipment({
            parameters: {basketId: 'testBasketId', shipmentId: 'fakeShipmentId'}
        })
        expect(methods).toBeDefined()
        expect(methods.applicableShippingMethods).toBeDefined()
    })
    test('updateBillingAddressForBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const response = await ocapiShopperBaskets.updateBillingAddressForBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('updateBillingAddressForBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const basket = await ocapiShopperBaskets.updateBillingAddressForBasket({
            parameters: {basketId: 'testBasketId'},
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.billingAddress).toBeDefined()
        expect(basket.billingAddress.city).toBeDefined()
    })
    test('updateShippingAddressForShipment returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const response = await ocapiShopperBaskets.updateShippingAddressForShipment({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('updateShippingAddressForShipment returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const basket = await ocapiShopperBaskets.updateShippingAddressForShipment({
            parameters: {basketId: 'testBasketId', shipmentId: 'fakeShippingId'},
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.shipments).toBeDefined()
        expect(basket.shipments[1].shippingAddress).toBeDefined()
    })
    test('updateShippingMethodForShipment returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const response = await ocapiShopperBaskets.updateShippingMethodForShipment({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('updateShippingMethodForShipment returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketWithPaymentInstrumentAndBillingAddress))
        const basket = await ocapiShopperBaskets.updateShippingMethodForShipment({
            parameters: {basketId: 'testBasketId', shipmentId: 'fakeShippingId'},
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.shipments).toBeDefined()
        expect(basket.shipments[0].shippingMethod).toBeDefined()
    })
    test('updateCustomerForBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.updateCustomerForBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('updateCustomerForBasket returns a basket object in camelCase when params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const basket = await ocapiShopperBaskets.updateCustomerForBasket({
            parameters: {basketId: 'testBasketId'},
            body: {}
        })
        expect(basket).toBeDefined()
        expect(basket.customerInfo).toBeDefined()
        expect(basket.customerInfo.email).toBeDefined()
    })
    test('deleteBasket returns error object when no params are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify(ocapiBasketResponse))
        const response = await ocapiShopperBaskets.deleteBasket({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
    test('deleteBasket returns 204 when paramters are passed', async () => {
        const ocapiShopperBaskets = getOcapiShopperBaskets()
        fetch.mockResponseOnce(JSON.stringify({status: 204}))
        const response = await ocapiShopperBaskets.deleteBasket({
            parameters: {basketId: 'testBasketId'}
        })
        expect(response.status).toEqual(204)
    })
})
