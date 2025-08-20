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

// Mock useToast
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: jest.fn(() => ({
        showToast: jest.fn()
    }))
}))

// Mock logger
jest.mock('@salesforce/retail-react-app/app/utils/logger-instance', () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        error: jest.fn()
    }
}))

import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

describe('useShipmentOperations', () => {
    let mockCreateShipmentMutation
    let mockRemoveShipmentMutation
    let mockUpdateShipmentMutation
    let mockUpdateShippingMethodMutation
    let mockUseShopperBasketsMutation
    let mockShowToast
    let mockLoggerWarn

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
        mockShowToast = jest.fn()
        mockLoggerWarn = jest.fn()

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
        useToast.mockReturnValue({showToast: mockShowToast})
        logger.warn.mockImplementation(mockLoggerWarn)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('createShipment', () => {
        test('should create a shipment with address', async () => {
            const basketId = 'test-basket-id'
            const address = {
                address1: '123 Main St',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94105',
                countryCode: 'US'
            }
            const mockResponse = {
                shipments: [{shipmentId: 'existing-shipment'}, {shipmentId: 'new-shipment-id'}]
            }

            mockCreateShipmentMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            const shipment = await result.current.createShipment(address)

            expect(mockCreateShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId
                },
                body: {
                    shippingAddress: {
                        address1: '123 Main St',
                        city: 'San Francisco',
                        stateCode: 'CA',
                        postalCode: '94105',
                        countryCode: 'US',
                        firstName: undefined,
                        lastName: undefined,
                        phone: undefined
                    }
                }
            })
            expect(shipment.shipmentId).toBe('new-shipment-id')
        })

        test('should create a shipment with shipping method', async () => {
            const basketId = 'test-basket-id'
            const options = {
                shippingMethodId: 'test-shipping-method'
            }
            const mockResponse = {
                shipments: [{shipmentId: 'new-shipment-id'}]
            }

            mockCreateShipmentMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            const shipment = await result.current.createShipment(null, options)

            expect(mockCreateShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId
                },
                body: {
                    shippingMethod: {
                        id: 'test-shipping-method'
                    }
                }
            })
            expect(shipment.shipmentId).toBe('new-shipment-id')
        })

        test('should create a pickup shipment with store ID', async () => {
            const basketId = 'test-basket-id'
            const options = {
                storeId: 'test-store-id'
            }
            const mockResponse = {
                shipments: [{shipmentId: 'new-shipment-id'}]
            }

            mockCreateShipmentMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            const shipment = await result.current.createShipment(null, options)

            expect(mockCreateShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId
                },
                body: {
                    c_fromStoreId: 'test-store-id'
                }
            })
            expect(shipment.shipmentId).toBe('new-shipment-id')
        })

        test('should throw error if basketId is missing', async () => {
            const {result} = renderHook(() => useShipmentOperations(null))

            await expect(result.current.createShipment({})).rejects.toThrow('Missing basketId')
        })

        test('should handle API errors', async () => {
            const basketId = 'test-basket-id'
            const error = new Error('API Error')
            mockCreateShipmentMutation.mutateAsync.mockRejectedValue(error)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            await expect(result.current.createShipment({})).rejects.toThrow('API Error')

            expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to create shipment', {
                namespace: 'useShipmentOperations.handleError',
                additionalProperties: {
                    error: error
                }
            })
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to create shipment',
                status: 'error'
            })
        })
    })

    describe('removeShipment', () => {
        test('should remove a shipment', async () => {
            const basketId = 'test-basket-id'
            const shipmentId = 'test-shipment-id'

            mockRemoveShipmentMutation.mutateAsync.mockResolvedValue({})

            const {result} = renderHook(() => useShipmentOperations(basketId))

            await result.current.removeShipment(shipmentId)

            expect(mockRemoveShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    shipmentId
                }
            })
        })

        test('should throw error if parameters are missing', async () => {
            const {result} = renderHook(() => useShipmentOperations('basket-id'))

            await expect(result.current.removeShipment(null)).rejects.toThrow(
                'Missing basketId or shipmentId'
            )
        })

        test('should handle API errors', async () => {
            const basketId = 'test-basket-id'
            const shipmentId = 'test-shipment-id'
            const error = new Error('API Error')
            mockRemoveShipmentMutation.mutateAsync.mockRejectedValue(error)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            await expect(result.current.removeShipment(shipmentId)).rejects.toThrow('API Error')

            expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to remove shipment', {
                namespace: 'useShipmentOperations.handleError',
                additionalProperties: {
                    error: error
                }
            })
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to remove shipment',
                status: 'error'
            })
        })
    })

    describe('updateShipmentAddress', () => {
        test('should update shipment address', async () => {
            const basketId = 'test-basket-id'
            const shipmentId = 'test-shipment-id'
            const address = {
                address1: '456 Oak St',
                city: 'Oakland',
                stateCode: 'CA',
                postalCode: '94601',
                countryCode: 'US'
            }
            const mockResponse = {updated: true}

            mockUpdateShipmentMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            const response = await result.current.updateShipmentAddress(shipmentId, address)

            expect(mockUpdateShipmentMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    shipmentId
                },
                body: {
                    shippingAddress: {
                        address1: '456 Oak St',
                        city: 'Oakland',
                        stateCode: 'CA',
                        postalCode: '94601',
                        countryCode: 'US',
                        firstName: undefined,
                        lastName: undefined,
                        phone: undefined
                    }
                }
            })
            expect(response).toEqual(mockResponse)
        })

        test('should throw error if parameters are missing', async () => {
            const {result} = renderHook(() => useShipmentOperations('basket-id'))

            await expect(result.current.updateShipmentAddress('shipment-id', null)).rejects.toThrow(
                'Missing basketId, shipmentId, or address'
            )
        })

        test('should handle API errors', async () => {
            const basketId = 'test-basket-id'
            const shipmentId = 'test-shipment-id'
            const address = {address1: '123 Main St'}
            const error = new Error('API Error')
            mockUpdateShipmentMutation.mutateAsync.mockRejectedValue(error)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            await expect(result.current.updateShipmentAddress(shipmentId, address)).rejects.toThrow(
                'API Error'
            )

            expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to update shipment address', {
                namespace: 'useShipmentOperations.handleError',
                additionalProperties: {
                    error: error
                }
            })
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to update shipment address',
                status: 'error'
            })
        })
    })

    describe('updateShippingMethod', () => {
        test('should update shipping method', async () => {
            const basketId = 'test-basket-id'
            const shipmentId = 'test-shipment-id'
            const shippingMethodId = 'new-shipping-method'
            const mockResponse = {updated: true}

            mockUpdateShippingMethodMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            const response = await result.current.updateShippingMethod(shipmentId, shippingMethodId)

            expect(mockUpdateShippingMethodMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    shipmentId
                },
                body: {
                    id: 'new-shipping-method'
                }
            })
            expect(response).toEqual(mockResponse)
        })

        test('should throw error if parameters are missing', async () => {
            const {result} = renderHook(() => useShipmentOperations('basket-id'))

            await expect(result.current.updateShippingMethod('shipment-id', null)).rejects.toThrow(
                'Missing basketId, shipmentId, or shippingMethodId'
            )
        })

        test('should handle API errors', async () => {
            const basketId = 'test-basket-id'
            const shipmentId = 'test-shipment-id'
            const shippingMethodId = 'test-method'
            const error = new Error('API Error')
            mockUpdateShippingMethodMutation.mutateAsync.mockRejectedValue(error)

            const {result} = renderHook(() => useShipmentOperations(basketId))

            await expect(
                result.current.updateShippingMethod(shipmentId, shippingMethodId)
            ).rejects.toThrow('API Error')

            expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to update shipping method', {
                namespace: 'useShipmentOperations.handleError',
                additionalProperties: {
                    error: error
                }
            })
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to update shipping method',
                status: 'error'
            })
        })
    })
})
