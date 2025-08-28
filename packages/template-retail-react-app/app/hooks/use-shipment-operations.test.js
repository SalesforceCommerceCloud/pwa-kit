/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useShipmentOperations} from '@salesforce/retail-react-app/app/hooks/use-shipment-operations'

// Mock the commerce SDK hooks
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutation: jest.fn()
}))

jest.mock('nanoid', () => ({
    nanoid: jest.fn(() => 'test-id-123')
}))

describe('useShipmentOperations', () => {
    let mockCreateShipmentMutation
    let mockRemoveShipmentMutation
    let mockUpdateShipmentMutation
    let mockUpdateShippingMethodMutation
    let mockUseShopperBasketsMutation

    beforeEach(() => {
        mockCreateShipmentMutation = {
            mutateAsync: jest.fn()
        }
        mockRemoveShipmentMutation = {
            mutateAsync: jest.fn()
        }
        mockUpdateShipmentMutation = {
            mutateAsync: jest.fn()
        }
        mockUpdateShippingMethodMutation = {
            mutateAsync: jest.fn()
        }

        mockUseShopperBasketsMutation = jest.fn((mutationType) => {
            switch (mutationType) {
                case 'createShipmentForBasket':
                    return mockCreateShipmentMutation
                case 'removeShipmentFromBasket':
                    return mockRemoveShipmentMutation
                case 'updateShipmentForBasket':
                    return mockUpdateShipmentMutation
                case 'updateShippingMethodForShipment':
                    return mockUpdateShippingMethodMutation
                default:
                    return {}
            }
        })

        useShopperBasketsMutation.mockImplementation(mockUseShopperBasketsMutation)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('createShipment', () => {
        test('should create a shipment with address', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'existing-shipment'}]
            }
            const address = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'Anytown',
                stateCode: 'CA',
                postalCode: '12345',
                countryCode: 'US'
            }
            const mockResponse = {
                shipments: [{shipmentId: 'existing-shipment'}, {shipmentId: 'new-shipment'}]
            }

            mockCreateShipmentMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basket))

            const response = await result.current.createShipment(address)

            expect(mockCreateShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId
                },
                body: {
                    shipmentId: 'shipment_test-id-123',
                    shippingAddress: {
                        firstName: 'John',
                        lastName: 'Doe',
                        address1: '123 Main St',
                        city: 'Anytown',
                        stateCode: 'CA',
                        postalCode: '12345',
                        countryCode: 'US'
                    }
                }
            })
            expect(response).toEqual({shipmentId: 'new-shipment'})
        })

        test('should create a shipment with shipping method', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'existing-shipment'}]
            }
            const address = null
            const options = {
                shippingMethodId: 'shipping-method-1'
            }
            const mockResponse = {
                shipments: [{shipmentId: 'existing-shipment'}, {shipmentId: 'new-shipment'}]
            }

            mockCreateShipmentMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basket))

            const response = await result.current.createShipment(address, options)

            expect(mockCreateShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId
                },
                body: {
                    shipmentId: 'shipment_test-id-123',
                    shippingMethod: {
                        id: 'shipping-method-1'
                    }
                }
            })
            expect(response).toEqual({shipmentId: 'new-shipment'})
        })

        test('should create a pickup shipment with store ID', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'existing-shipment'}]
            }
            const address = null
            const options = {
                storeId: 'store-1'
            }
            const mockResponse = {
                shipments: [{shipmentId: 'existing-shipment'}, {shipmentId: 'new-shipment'}]
            }

            mockCreateShipmentMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basket))

            const response = await result.current.createShipment(address, options)

            expect(mockCreateShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId
                },
                body: {
                    shipmentId: 'shipment_test-id-123',
                    c_fromStoreId: 'store-1'
                }
            })
            expect(response).toEqual({shipmentId: 'new-shipment'})
        })

        test('should throw error if basketId is missing', async () => {
            const basket = null
            const address = {firstName: 'John'}

            const {result} = renderHook(() => useShipmentOperations(basket))

            await expect(result.current.createShipment(address)).rejects.toThrow(
                'Missing basket or basketId'
            )
        })

        test('should throw error when API call fails', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'existing-shipment'}]
            }
            const address = {firstName: 'John'}
            const mockError = new Error('API Error')

            mockCreateShipmentMutation.mutateAsync.mockRejectedValue(mockError)

            const {result} = renderHook(() => useShipmentOperations(basket))

            await expect(result.current.createShipment(address)).rejects.toThrow('API Error')
        })
    })

    describe('removeShipment', () => {
        test('should remove a shipment', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'shipment-1'}]
            }
            const shipmentId = 'shipment-1'

            mockRemoveShipmentMutation.mutateAsync.mockResolvedValue({})

            const {result} = renderHook(() => useShipmentOperations(basket))

            await result.current.removeShipment(shipmentId)

            expect(mockRemoveShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    shipmentId
                }
            })
        })

        test('should throw error if parameters are missing', async () => {
            const basket = null
            const shipmentId = null

            const {result} = renderHook(() => useShipmentOperations(basket))

            await expect(result.current.removeShipment(shipmentId)).rejects.toThrow(
                'Missing basket or shipmentId'
            )
        })

        test('should throw error when API call fails', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'shipment-1'}]
            }
            const shipmentId = 'shipment-1'
            const mockError = new Error('API Error')

            mockRemoveShipmentMutation.mutateAsync.mockRejectedValue(mockError)

            const {result} = renderHook(() => useShipmentOperations(basket))

            await expect(result.current.removeShipment(shipmentId)).rejects.toThrow('API Error')
        })
    })

    describe('updateShipmentAddress', () => {
        test('should update shipment address', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'shipment-1'}]
            }
            const shipmentId = 'shipment-1'
            const address = {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main St',
                city: 'Anytown',
                stateCode: 'CA',
                postalCode: '12345',
                countryCode: 'US'
            }
            const mockResponse = {updated: true}

            mockUpdateShipmentMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basket))

            const response = await result.current.updateShipmentAddress(shipmentId, address)

            expect(mockUpdateShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    shipmentId
                },
                body: {
                    shippingAddress: {
                        firstName: 'John',
                        lastName: 'Doe',
                        address1: '123 Main St',
                        city: 'Anytown',
                        stateCode: 'CA',
                        postalCode: '12345',
                        countryCode: 'US'
                    }
                }
            })
            expect(response).toEqual(mockResponse)
        })

        test('should throw error if parameters are missing', async () => {
            const basket = null
            const shipmentId = null
            const address = null

            const {result} = renderHook(() => useShipmentOperations(basket))

            await expect(result.current.updateShipmentAddress(shipmentId, address)).rejects.toThrow(
                'Missing basket, shipmentId, or address'
            )
        })

        test('should throw error when API call fails', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'shipment-1'}]
            }
            const shipmentId = 'shipment-1'
            const address = {firstName: 'John'}
            const mockError = new Error('API Error')

            mockUpdateShipmentMutation.mutateAsync.mockRejectedValue(mockError)

            const {result} = renderHook(() => useShipmentOperations(basket))

            await expect(result.current.updateShipmentAddress(shipmentId, address)).rejects.toThrow(
                'API Error'
            )
        })
    })

    describe('updateShippingMethod', () => {
        test('should update shipping method', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'shipment-1'}]
            }
            const shipmentId = 'shipment-1'
            const shippingMethodId = 'shipping-method-1'
            const mockResponse = {updated: true}

            mockUpdateShippingMethodMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basket))

            const response = await result.current.updateShippingMethod(shipmentId, shippingMethodId)

            expect(mockUpdateShippingMethodMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    shipmentId
                },
                body: {
                    id: 'shipping-method-1'
                }
            })
            expect(response).toEqual(mockResponse)
        })

        test('should throw error if parameters are missing', async () => {
            const basket = null
            const shipmentId = null
            const shippingMethodId = null

            const {result} = renderHook(() => useShipmentOperations(basket))

            await expect(
                result.current.updateShippingMethod(shipmentId, shippingMethodId)
            ).rejects.toThrow('Missing basket, shipmentId, or shippingMethodId')
        })

        test('should throw error when API call fails', async () => {
            const basketId = 'test-basket-id'
            const basket = {
                basketId,
                shipments: [{shipmentId: 'shipment-1'}]
            }
            const shipmentId = 'shipment-1'
            const shippingMethodId = 'shipping-method-1'
            const mockError = new Error('API Error')

            mockUpdateShippingMethodMutation.mutateAsync.mockRejectedValue(mockError)

            const {result} = renderHook(() => useShipmentOperations(basket))

            await expect(
                result.current.updateShippingMethod(shipmentId, shippingMethodId)
            ).rejects.toThrow('API Error')
        })
    })
})
