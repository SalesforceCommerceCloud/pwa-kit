/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import ShippingMethods from '@salesforce/retail-react-app/app/api/adyen/api/controllers/shipping-methods'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {ShopperBaskets} from 'commerce-sdk-isomorphic'

// Mock the modules
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/api/adyen/api/controllers/logger')
jest.mock('commerce-sdk-isomorphic')

describe('ShippingMethods', () => {
    let req, res, next, shopperBasketsInstanceMock

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'Bearer token',
                basketid: 'basket-id'
            },
            body: {
                shippingMethodId: 'method-id'
            }
        }
        res = {
            locals: {}
        }
        next = jest.fn()

        // Mock getConfig to return the expected configuration
        getConfig.mockReturnValue({
            app: {
                commerceAPI: {
                    parameters: {
                        siteId: 'RefArch'
                    }
                }
            }
        })

        // Mock ShopperBaskets instance
        shopperBasketsInstanceMock = {
            getShippingMethodsForShipment: jest.fn().mockResolvedValue({}),
            updateShippingMethodForShipment: jest.fn().mockResolvedValue({})
        }
        ShopperBaskets.mockImplementation(() => shopperBasketsInstanceMock)
    })

    describe('setShippingMethod', () => {
        it('should call the appropriate functions and set response in locals', async () => {
            await ShippingMethods.setShippingMethod(req, res, next)
            expect(Logger.info).toHaveBeenCalledWith('setShippingMethod', 'start')
            expect(getConfig).toHaveBeenCalled()
            expect(shopperBasketsInstanceMock.updateShippingMethodForShipment).toHaveBeenCalledWith(
                {
                    body: {
                        id: 'method-id'
                    },
                    parameters: {
                        basketId: 'basket-id',
                        shipmentId: 'me'
                    }
                }
            )
            expect(Logger.info).toHaveBeenCalledWith('setShippingMethod', 'success')
            expect(res.locals.response).toEqual({})
            expect(next).toHaveBeenCalled()
        })

        it('should call next with error if an error occurs', async () => {
            const error = new Error('Test error')
            shopperBasketsInstanceMock.updateShippingMethodForShipment.mockRejectedValue(error)
            await ShippingMethods.setShippingMethod(req, res, next)
            expect(Logger.error).toHaveBeenCalledWith('setShippingMethod', JSON.stringify(error))
            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('getShippingMethods', () => {
        it('should call the appropriate functions and set response in locals', async () => {
            await ShippingMethods.getShippingMethods(req, res, next)
            expect(Logger.info).toHaveBeenCalledWith('getShippingMethods', 'start')
            expect(getConfig).toHaveBeenCalled()
            expect(shopperBasketsInstanceMock.getShippingMethodsForShipment).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-id',
                    shipmentId: 'me'
                }
            })
            expect(Logger.info).toHaveBeenCalledWith('getShippingMethods', 'success')
            expect(res.locals.response).toEqual({})
            expect(next).toHaveBeenCalled()
        })

        it('should call next with error if an error occurs', async () => {
            const error = new Error('Test error')
            shopperBasketsInstanceMock.getShippingMethodsForShipment.mockRejectedValue(error)
            await ShippingMethods.getShippingMethods(req, res, next)
            expect(Logger.error).toHaveBeenCalledWith('getShippingMethods', JSON.stringify(error))
            expect(next).toHaveBeenCalledWith(error)
        })
    })
})
