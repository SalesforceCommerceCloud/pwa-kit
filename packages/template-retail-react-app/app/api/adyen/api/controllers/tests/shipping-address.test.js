/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import updateShippingAddress from '@salesforce/retail-react-app/app/api/adyen/api/controllers/shipping-address'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import Logger from '@salesforce/retail-react-app/app/api/adyen/api/controllers/logger'
import {ShopperBaskets} from 'commerce-sdk-isomorphic'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn().mockReturnValue({
        app: {
            commerceAPI: {
                /* mock your commerce API config here */
            }
        }
    })
}))

jest.mock('commerce-sdk-isomorphic', () => ({
    ShopperBaskets: jest.fn().mockImplementation(() => ({
        updateShippingAddressForShipment: jest.fn().mockResolvedValue({})
    }))
}))

jest.mock('../logger', () => ({
    info: jest.fn(),
    error: jest.fn()
}))

describe('updateShippingAddress', () => {
    let req, res, next, shopperBasketsInstanceMock, getConfigMock

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'Bearer token',
                basketid: 'basket123'
            },
            body: {
                data: {
                    deliveryAddress: {
                        street: '123 Main St',
                        city: 'City',
                        country: 'US',
                        postalCode: '12345',
                        stateOrProvince: 'State'
                    },
                    profile: {
                        firstName: 'John',
                        lastName: 'Doe',
                        phone: '1234567890'
                    }
                }
            }
        }
        res = {locals: {}}
        getConfigMock = jest.fn(() => ({
            app: {
                commerceAPI: {
                    parameters: {
                        siteId: 'RefArch'
                    }
                }
            }
        }))
        getConfig.mockImplementation(getConfigMock)
        shopperBasketsInstanceMock = {
            updateShippingAddressForShipment: jest.fn().mockResolvedValue({})
        }
        ShopperBaskets.mockImplementation(() => shopperBasketsInstanceMock)
        next = jest.fn()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should call the appropriate functions and set response in locals', async () => {
        await updateShippingAddress(req, res, next)
        expect(Logger.info).toHaveBeenCalledWith('updateShippingAddress', 'start')
        expect(getConfigMock).toHaveBeenCalled()
        expect(shopperBasketsInstanceMock.updateShippingAddressForShipment).toHaveBeenCalledWith({
            body: {
                address1: '123 Main St',
                city: 'City',
                countryCode: 'US',
                firstName: 'John',
                fullName: 'John Doe',
                lastName: 'Doe',
                phone: '1234567890',
                postalCode: '12345',
                stateCode: 'State'
            },
            parameters: {
                basketId: 'basket123',
                shipmentId: 'me'
            }
        })
        expect(Logger.info).toHaveBeenCalledWith('updateShippingAddress', 'success')
        expect(res.locals.response).toEqual({})
        expect(next).toHaveBeenCalled()
    })

    it('should call error logger and call next with error if an error occurs', async () => {
        const error = new Error('Test error')
        shopperBasketsInstanceMock.updateShippingAddressForShipment.mockRejectedValue(error)
        await updateShippingAddress(req, res, next)
        expect(next).toHaveBeenCalledWith(error)
    })
})
