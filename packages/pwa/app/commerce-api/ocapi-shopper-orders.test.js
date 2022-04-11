/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fetch from 'jest-fetch-mock'
import {app as appConfig} from '../../config/default'
import OcapiShopperOrders from './ocapi-shopper-orders'
import {ocapiOrderResponse} from './mock-data'

jest.mock('cross-fetch', () => jest.requireActual('jest-fetch-mock'))

const apiConfig = {...appConfig.commerceAPI, proxy: undefined}
const getOcapiShopperOrders = () => new OcapiShopperOrders(apiConfig)
beforeEach(() => {
    jest.resetModules()
    fetch.resetMocks()
})

describe('test OcapiShopperOrders class', () => {
    test('createOrder returns a basket object in camelCase', async () => {
        const ocapiShopperOrders = getOcapiShopperOrders()
        fetch.mockResponseOnce(JSON.stringify(ocapiOrderResponse))
        const order = await ocapiShopperOrders.createOrder({body: {}})
        expect(order).toBeDefined()
        expect(order.orderNo).toBeDefined()
    })
    test('createOrder returns error object when no body is passed', async () => {
        const ocapiShopperOrders = getOcapiShopperOrders()
        fetch.mockResponseOnce(JSON.stringify(ocapiOrderResponse))
        const response = await ocapiShopperOrders.createOrder({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Body is required for this request')
    })

    test('getOrder returns a basket object in camelCase', async () => {
        const ocapiShopperOrders = getOcapiShopperOrders()
        fetch.mockResponseOnce(JSON.stringify(ocapiOrderResponse))
        const order = await ocapiShopperOrders.getOrder({parameters: {orderNo: ''}})
        expect(order).toBeDefined()
        expect(order.orderNo).toBeDefined()
    })
    test('getOrder returns error object when no params are passed', async () => {
        const ocapiShopperOrders = getOcapiShopperOrders()
        fetch.mockResponseOnce(JSON.stringify(ocapiOrderResponse))
        const response = await ocapiShopperOrders.getOrder({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
})
