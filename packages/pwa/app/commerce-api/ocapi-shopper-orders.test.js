import {commerceAPIConfig} from '../commerce-api.config'
import OcapiShopperOrders from './ocapi-shopper-orders'
import {ocapiOrderResponse} from './mock-data'

const apiConfig = {...commerceAPIConfig, proxy: undefined}
const getOcapiShopperOrders = () => new OcapiShopperOrders(apiConfig)
beforeEach(() => {
    jest.resetModules()
})

describe('test OcapiShopperOrders class', () => {
    test('createOrder returns a basket object in camelCase', async () => {
        const ocapiShopperOrders = getOcapiShopperOrders()
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return ocapiOrderResponse
                }
            }
        })
        const order = await ocapiShopperOrders.createOrder({body: {}})
        expect(order).toBeDefined()
        expect(order.orderNo).toBeDefined()
    })
    test('createOrder returns error object when no body is passed', async () => {
        const ocapiShopperOrders = getOcapiShopperOrders()
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return ocapiOrderResponse
                }
            }
        })
        const response = await ocapiShopperOrders.createOrder({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Body is required for this request')
    })

    test('getOrder returns a basket object in camelCase', async () => {
        const ocapiShopperOrders = getOcapiShopperOrders()
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return ocapiOrderResponse
                }
            }
        })
        const order = await ocapiShopperOrders.getOrder({parameters: {orderNo: ''}})
        expect(order).toBeDefined()
        expect(order.orderNo).toBeDefined()
    })
    test('getOrder returns error object when no params are passed', async () => {
        const ocapiShopperOrders = getOcapiShopperOrders()
        global.fetch = jest.fn().mockImplementation(() => {
            return {
                status: 200,
                json: async () => {
                    return ocapiOrderResponse
                }
            }
        })
        const response = await ocapiShopperOrders.getOrder({})
        expect(response).toBeDefined()
        expect(response.title).toEqual('Parameters are required for this request')
    })
})
