/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useItemMovement} from '@salesforce/retail-react-app/app/hooks/use-item-movement'

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

describe('useItemMovement', () => {
    let mockUpdateItemInBasketMutation
    let mockUpdateItemsInBasketMutation
    let mockUseShopperBasketsMutation
    let mockShowToast
    let mockLoggerWarn

    beforeEach(() => {
        mockUpdateItemInBasketMutation = {
            mutateAsync: jest.fn()
        }
        mockUpdateItemsInBasketMutation = {
            mutateAsync: jest.fn()
        }
        mockShowToast = jest.fn()
        mockLoggerWarn = jest.fn()

        mockUseShopperBasketsMutation = jest.fn((mutationType) => {
            switch (mutationType) {
                case 'updateItemInBasket':
                    return mockUpdateItemInBasketMutation
                case 'updateItemsInBasket':
                    return mockUpdateItemsInBasketMutation
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

    describe('updateItemToPickupShipment', () => {
        test('should update item to pickup shipment', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
            }
            const targetShipmentId = 'pickup-shipment'
            const inventoryId = 'store-inventory-1'
            const mockResponse = {updated: true}

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useItemMovement(basketId))

            const response = await result.current.updateItemToPickupShipment(
                productItem,
                targetShipmentId,
                inventoryId
            )

            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    itemId: 'item-1'
                },
                body: {
                    productId: 'prod-1',
                    quantity: 2,
                    shipmentId: 'pickup-shipment',
                    inventoryId: 'store-inventory-1'
                }
            })
            expect(response).toEqual(mockResponse)
        })

        test('should throw error if basketId is missing', async () => {
            const {result} = renderHook(() => useItemMovement(null))

            await expect(
                result.current.updateItemToPickupShipment({}, 'shipment', 'inventory')
            ).rejects.toThrow('Invalid basket or product item')
        })

        test('should throw error if productItem is missing', async () => {
            const {result} = renderHook(() => useItemMovement('basket-id'))

            await expect(
                result.current.updateItemToPickupShipment(null, 'shipment', 'inventory')
            ).rejects.toThrow('Invalid basket or product item')
        })

        test('should handle API errors', async () => {
            const basketId = 'test-basket-id'
            const productItem = {itemId: 'item-1', productId: 'prod-1', quantity: 1}
            const error = new Error('API Error')
            mockUpdateItemInBasketMutation.mutateAsync.mockRejectedValue(error)

            const {result} = renderHook(() => useItemMovement(basketId))

            await expect(
                result.current.updateItemToPickupShipment(productItem, 'shipment', 'inventory')
            ).rejects.toThrow('API Error')

            expect(mockLoggerWarn).toHaveBeenCalledWith(
                'Failed to update item to pickup shipment',
                {
                    namespace: 'useItemMovement.handleError',
                    additionalProperties: {
                        error: error
                    }
                }
            )
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to update item to pickup shipment',
                status: 'error'
            })
        })
    })

    describe('updateItemToDeliveryShipment', () => {
        test('should update item to delivery shipment with default inventory', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2,
                inventoryId: 'pickup-inventory'
            }
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'
            const mockResponse = {updated: true}

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useItemMovement(basketId))

            const response = await result.current.updateItemToDeliveryShipment(
                productItem,
                targetShipmentId,
                defaultInventoryId
            )

            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    itemId: 'item-1'
                },
                body: {
                    productId: 'prod-1',
                    quantity: 2,
                    shipmentId: 'delivery-shipment',
                    inventoryId: 'default-inventory'
                }
            })
            expect(response).toEqual(mockResponse)
        })

        test('should update item to delivery shipment without inventory ID', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
                // No inventoryId
            }
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'
            const mockResponse = {updated: true}

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useItemMovement(basketId))

            const response = await result.current.updateItemToDeliveryShipment(
                productItem,
                targetShipmentId,
                defaultInventoryId
            )

            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    itemId: 'item-1'
                },
                body: {
                    productId: 'prod-1',
                    quantity: 2,
                    shipmentId: 'delivery-shipment'
                    // No inventoryId in body
                }
            })
            expect(response).toEqual(mockResponse)
        })

        test('should use default shipment ID when not provided', async () => {
            const basketId = 'test-basket-id'
            const productItem = {itemId: 'item-1', productId: 'prod-1', quantity: 1}
            const defaultInventoryId = 'default-inventory'

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue({})

            const {result} = renderHook(() => useItemMovement(basketId))

            await result.current.updateItemToDeliveryShipment(
                productItem,
                undefined,
                defaultInventoryId
            )

            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    itemId: 'item-1'
                },
                body: {
                    productId: 'prod-1',
                    quantity: 1,
                    shipmentId: 'me'
                }
            })
        })

        test('should handle API errors', async () => {
            const basketId = 'test-basket-id'
            const productItem = {itemId: 'item-1', productId: 'prod-1', quantity: 1}
            const error = new Error('API Error')
            mockUpdateItemInBasketMutation.mutateAsync.mockRejectedValue(error)

            const {result} = renderHook(() => useItemMovement(basketId))

            await expect(
                result.current.updateItemToDeliveryShipment(productItem, 'shipment', 'inventory')
            ).rejects.toThrow('API Error')

            expect(mockLoggerWarn).toHaveBeenCalledWith(
                'Failed to update item to delivery shipment',
                {
                    namespace: 'useItemMovement.handleError',
                    additionalProperties: {
                        error: error
                    }
                }
            )
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to update item to delivery shipment',
                status: 'error'
            })
        })
    })

    describe('updateItemsToDeliveryShipment', () => {
        test('should update multiple items to delivery shipment', async () => {
            const basketId = 'test-basket-id'
            const productItems = [
                {
                    itemId: 'item-1',
                    productId: 'prod-1',
                    quantity: 2,
                    inventoryId: 'pickup-inventory'
                },
                {
                    itemId: 'item-2',
                    productId: 'prod-2',
                    quantity: 1
                    // No inventoryId
                }
            ]
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'
            const mockResponse = {updated: true}

            mockUpdateItemsInBasketMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useItemMovement(basketId))

            const response = await result.current.updateItemsToDeliveryShipment(
                productItems,
                targetShipmentId,
                defaultInventoryId
            )

            expect(mockUpdateItemsInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'prod-1',
                        quantity: 2,
                        shipmentId: 'delivery-shipment',
                        inventoryId: 'default-inventory'
                    },
                    {
                        itemId: 'item-2',
                        productId: 'prod-2',
                        quantity: 1,
                        shipmentId: 'delivery-shipment'
                        // No inventoryId
                    }
                ]
            })
            expect(response).toEqual(mockResponse)
        })

        test('should handle empty productItems array gracefully', async () => {
            const {result} = renderHook(() => useItemMovement('basket-id'))

            const response = await result.current.updateItemsToDeliveryShipment(
                [],
                'shipment',
                'inventory'
            )

            expect(response).toEqual({updated: true})
            expect(mockUpdateItemsInBasketMutation.mutateAsync).not.toHaveBeenCalled()
        })

        test('should handle API errors', async () => {
            const basketId = 'test-basket-id'
            const productItems = [{itemId: 'item-1', productId: 'prod-1', quantity: 1}]
            const error = new Error('API Error')
            mockUpdateItemsInBasketMutation.mutateAsync.mockRejectedValue(error)

            const {result} = renderHook(() => useItemMovement(basketId))

            await expect(
                result.current.updateItemsToDeliveryShipment(productItems, 'shipment', 'inventory')
            ).rejects.toThrow('API Error')

            expect(mockLoggerWarn).toHaveBeenCalledWith(
                'Failed to update items to delivery shipment',
                {
                    namespace: 'useItemMovement.handleError',
                    additionalProperties: {
                        error: error
                    }
                }
            )
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to update items to delivery shipment',
                status: 'error'
            })
        })
    })

    describe('updateItemsToPickupShipment', () => {
        test('should update multiple items to pickup shipment', async () => {
            const basketId = 'test-basket-id'
            const productItems = [
                {
                    itemId: 'item-1',
                    productId: 'prod-1',
                    quantity: 2
                },
                {
                    itemId: 'item-2',
                    productId: 'prod-2',
                    quantity: 1
                }
            ]
            const targetShipmentId = 'pickup-shipment'
            const inventoryId = 'store-inventory-1'
            const mockResponse = {updated: true}

            mockUpdateItemsInBasketMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useItemMovement(basketId))

            const response = await result.current.updateItemsToPickupShipment(
                productItems,
                targetShipmentId,
                inventoryId
            )

            expect(mockUpdateItemsInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'prod-1',
                        quantity: 2,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'store-inventory-1'
                    },
                    {
                        itemId: 'item-2',
                        productId: 'prod-2',
                        quantity: 1,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'store-inventory-1'
                    }
                ]
            })
            expect(response).toEqual(mockResponse)
        })

        test('should handle empty productItems array gracefully', async () => {
            const {result} = renderHook(() => useItemMovement('basket-id'))

            const response = await result.current.updateItemsToPickupShipment(
                [],
                'shipment',
                'inventory'
            )

            expect(response).toEqual({updated: true})
            expect(mockUpdateItemsInBasketMutation.mutateAsync).not.toHaveBeenCalled()
        })

        test('should handle API errors', async () => {
            const basketId = 'test-basket-id'
            const productItems = [{itemId: 'item-1', productId: 'prod-1', quantity: 1}]
            const error = new Error('API Error')
            mockUpdateItemsInBasketMutation.mutateAsync.mockRejectedValue(error)

            const {result} = renderHook(() => useItemMovement(basketId))

            await expect(
                result.current.updateItemsToPickupShipment(productItems, 'shipment', 'inventory')
            ).rejects.toThrow('API Error')

            expect(mockLoggerWarn).toHaveBeenCalledWith(
                'Failed to update items to pickup shipment',
                {
                    namespace: 'useItemMovement.handleError',
                    additionalProperties: {
                        error: error
                    }
                }
            )
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to update items to pickup shipment',
                status: 'error'
            })
        })
    })

    describe('handleDeliveryOptionChange', () => {
        test('should handle change to pickup', async () => {
            const basketId = 'test-basket-id'
            const productItem = {itemId: 'item-1', productId: 'prod-1', quantity: 1}
            const selectedPickup = true
            const storeInfo = {id: 'store-1', inventoryId: 'inventory-1'}
            const defaultInventoryId = 'default-inventory'
            const mockFindOrCreatePickupShipment = jest.fn().mockResolvedValue('pickup-shipment')
            const mockFindOrCreateDeliveryShipment = jest.fn()

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue({})

            const {result} = renderHook(() => useItemMovement(basketId))

            await result.current.handleDeliveryOptionChange(
                productItem,
                selectedPickup,
                storeInfo,
                defaultInventoryId,
                mockFindOrCreatePickupShipment,
                mockFindOrCreateDeliveryShipment
            )

            expect(mockFindOrCreatePickupShipment).toHaveBeenCalledWith(storeInfo)
            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    itemId: 'item-1'
                },
                body: {
                    productId: 'prod-1',
                    quantity: 1,
                    shipmentId: 'pickup-shipment',
                    inventoryId: 'inventory-1'
                }
            })
        })

        test('should handle change to delivery', async () => {
            const basketId = 'test-basket-id'
            const productItem = {itemId: 'item-1', productId: 'prod-1', quantity: 1}
            const selectedPickup = false
            const storeInfo = {id: 'store-1', inventoryId: 'inventory-1'}
            const defaultInventoryId = 'default-inventory'
            const mockFindOrCreatePickupShipment = jest.fn()
            const mockFindOrCreateDeliveryShipment = jest
                .fn()
                .mockResolvedValue('delivery-shipment')

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue({})

            const {result} = renderHook(() => useItemMovement(basketId))

            await result.current.handleDeliveryOptionChange(
                productItem,
                selectedPickup,
                storeInfo,
                defaultInventoryId,
                mockFindOrCreatePickupShipment,
                mockFindOrCreateDeliveryShipment
            )

            expect(mockFindOrCreateDeliveryShipment).toHaveBeenCalled()
            expect(mockUpdateItemInBasketMutation.mutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId,
                    itemId: 'item-1'
                },
                body: {
                    productId: 'prod-1',
                    quantity: 1,
                    shipmentId: 'delivery-shipment'
                    // No inventoryId for delivery
                }
            })
        })

        test('should throw error if no store selected for pickup', async () => {
            const basketId = 'test-basket-id'
            const productItem = {itemId: 'item-1', productId: 'prod-1', quantity: 1}
            const selectedPickup = true
            const storeInfo = {} // No id
            const defaultInventoryId = 'default-inventory'
            const mockFindOrCreatePickupShipment = jest.fn()
            const mockFindOrCreateDeliveryShipment = jest.fn()

            const {result} = renderHook(() => useItemMovement(basketId))

            await expect(
                result.current.handleDeliveryOptionChange(
                    productItem,
                    selectedPickup,
                    storeInfo,
                    defaultInventoryId,
                    mockFindOrCreatePickupShipment,
                    mockFindOrCreateDeliveryShipment
                )
            ).rejects.toThrow('No store selected for pickup')
        })

        test('should throw error if store has no inventory ID', async () => {
            const basketId = 'test-basket-id'
            const productItem = {itemId: 'item-1', productId: 'prod-1', quantity: 1}
            const selectedPickup = true
            const storeInfo = {id: 'store-1'} // No inventoryId
            const defaultInventoryId = 'default-inventory'
            const mockFindOrCreatePickupShipment = jest.fn()
            const mockFindOrCreateDeliveryShipment = jest.fn()

            const {result} = renderHook(() => useItemMovement(basketId))

            await expect(
                result.current.handleDeliveryOptionChange(
                    productItem,
                    selectedPickup,
                    storeInfo,
                    defaultInventoryId,
                    mockFindOrCreatePickupShipment,
                    mockFindOrCreateDeliveryShipment
                )
            ).rejects.toThrow('Selected store does not have an inventory ID')
        })

        test('should throw error if shipment creation fails', async () => {
            const basketId = 'test-basket-id'
            const productItem = {itemId: 'item-1', productId: 'prod-1', quantity: 1}
            const selectedPickup = true
            const storeInfo = {id: 'store-1', inventoryId: 'inventory-1'}
            const defaultInventoryId = 'default-inventory'
            const mockFindOrCreatePickupShipment = jest.fn().mockResolvedValue(null) // Failed
            const mockFindOrCreateDeliveryShipment = jest.fn()

            const {result} = renderHook(() => useItemMovement(basketId))

            await expect(
                result.current.handleDeliveryOptionChange(
                    productItem,
                    selectedPickup,
                    storeInfo,
                    defaultInventoryId,
                    mockFindOrCreatePickupShipment,
                    mockFindOrCreateDeliveryShipment
                )
            ).rejects.toThrow('Failed to find or create shipment')

            expect(mockLoggerWarn).toHaveBeenCalledWith('Failed to handle delivery option change', {
                namespace: 'useItemMovement.handleError',
                additionalProperties: {
                    error: expect.any(Error)
                }
            })
            expect(mockShowToast).toHaveBeenCalledWith({
                title: 'Failed to handle delivery option change',
                status: 'error'
            })
        })
    })
})
