/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useItemShipmentManagement} from '@salesforce/retail-react-app/app/hooks/use-item-shipment-management'

// Mock the commerce SDK hooks
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutation: jest.fn()
}))

describe('useItemShipmentManagement', () => {
    let mockUpdateItemInBasketMutation
    let mockUpdateItemsInBasketMutation
    let mockUseShopperBasketsMutation

    beforeEach(() => {
        mockUpdateItemInBasketMutation = {
            mutateAsync: jest.fn()
        }
        mockUpdateItemsInBasketMutation = {
            mutateAsync: jest.fn()
        }

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

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

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

        test('should throw error for invalid basket or product item', async () => {
            const basketId = null
            const productItem = null
            const targetShipmentId = 'pickup-shipment'
            const inventoryId = 'store-inventory-1'

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateItemToPickupShipment(
                    productItem,
                    targetShipmentId,
                    inventoryId
                )
            ).rejects.toThrow('Invalid basket or product item')
        })

        test('should throw error when API call fails', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
            }
            const targetShipmentId = 'pickup-shipment'
            const inventoryId = 'store-inventory-1'
            const mockError = new Error('API Error')

            mockUpdateItemInBasketMutation.mutateAsync.mockRejectedValue(mockError)

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateItemToPickupShipment(
                    productItem,
                    targetShipmentId,
                    inventoryId
                )
            ).rejects.toThrow('API Error')
        })
    })

    describe('updateItemToDeliveryShipment', () => {
        test('should update item to delivery shipment', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2,
                inventoryId: 'store-inventory-1'
            }
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'
            const mockResponse = {updated: true}

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

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
            }
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'
            const mockResponse = {updated: true}

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

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
                }
            })
            expect(response).toEqual(mockResponse)
        })

        test('should throw error for invalid basket or product item', async () => {
            const basketId = null
            const productItem = null
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateItemToDeliveryShipment(
                    productItem,
                    targetShipmentId,
                    defaultInventoryId
                )
            ).rejects.toThrow('Invalid basket or product item')
        })

        test('should throw error when API call fails', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
            }
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'
            const mockError = new Error('API Error')

            mockUpdateItemInBasketMutation.mutateAsync.mockRejectedValue(mockError)

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateItemToDeliveryShipment(
                    productItem,
                    targetShipmentId,
                    defaultInventoryId
                )
            ).rejects.toThrow('API Error')
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
                    inventoryId: 'store-inventory-1'
                },
                {
                    itemId: 'item-2',
                    productId: 'prod-2',
                    quantity: 1,
                    inventoryId: 'store-inventory-2'
                }
            ]
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'
            const mockResponse = {updated: true}

            mockUpdateItemsInBasketMutation.mutateAsync.mockResolvedValue(mockResponse)

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

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
                        shipmentId: 'delivery-shipment',
                        inventoryId: 'default-inventory'
                    }
                ]
            })
            expect(response).toEqual(mockResponse)
        })

        test('should return early for empty product items array', async () => {
            const basketId = 'test-basket-id'
            const productItems = []
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            const response = await result.current.updateItemsToDeliveryShipment(
                productItems,
                targetShipmentId,
                defaultInventoryId
            )

            expect(response).toEqual({updated: true})
            expect(mockUpdateItemsInBasketMutation.mutateAsync).not.toHaveBeenCalled()
        })

        test('should throw error for invalid basket or product items', async () => {
            const basketId = null
            const productItems = null
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateItemsToDeliveryShipment(
                    productItems,
                    targetShipmentId,
                    defaultInventoryId
                )
            ).rejects.toThrow('Invalid basket or product items array')
        })

        test('should throw error when API call fails', async () => {
            const basketId = 'test-basket-id'
            const productItems = [
                {
                    itemId: 'item-1',
                    productId: 'prod-1',
                    quantity: 2
                }
            ]
            const targetShipmentId = 'delivery-shipment'
            const defaultInventoryId = 'default-inventory'
            const mockError = new Error('API Error')

            mockUpdateItemsInBasketMutation.mutateAsync.mockRejectedValue(mockError)

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateItemsToDeliveryShipment(
                    productItems,
                    targetShipmentId,
                    defaultInventoryId
                )
            ).rejects.toThrow('API Error')
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

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

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

        test('should return early for empty product items array', async () => {
            const basketId = 'test-basket-id'
            const productItems = []
            const targetShipmentId = 'pickup-shipment'
            const inventoryId = 'store-inventory-1'

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            const response = await result.current.updateItemsToPickupShipment(
                productItems,
                targetShipmentId,
                inventoryId
            )

            expect(response).toEqual({updated: true})
            expect(mockUpdateItemsInBasketMutation.mutateAsync).not.toHaveBeenCalled()
        })

        test('should throw error for invalid basket or product items', async () => {
            const basketId = null
            const productItems = null
            const targetShipmentId = 'pickup-shipment'
            const inventoryId = 'store-inventory-1'

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateItemsToPickupShipment(
                    productItems,
                    targetShipmentId,
                    inventoryId
                )
            ).rejects.toThrow('Invalid basket or product items array')
        })

        test('should throw error when API call fails', async () => {
            const basketId = 'test-basket-id'
            const productItems = [
                {
                    itemId: 'item-1',
                    productId: 'prod-1',
                    quantity: 2
                }
            ]
            const targetShipmentId = 'pickup-shipment'
            const inventoryId = 'store-inventory-1'
            const mockError = new Error('API Error')

            mockUpdateItemsInBasketMutation.mutateAsync.mockRejectedValue(mockError)

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateItemsToPickupShipment(
                    productItems,
                    targetShipmentId,
                    inventoryId
                )
            ).rejects.toThrow('API Error')
        })
    })

    describe('updateDeliveryOption', () => {
        test('should update item to pickup shipment', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
            }
            const selectedPickup = true
            const storeInfo = {
                id: 'store-1',
                inventoryId: 'store-inventory-1'
            }
            const defaultInventoryId = 'default-inventory'
            const findOrCreatePickupShipment = jest.fn().mockResolvedValue({
                shipmentId: 'pickup-shipment'
            })
            const findOrCreateDeliveryShipment = jest.fn()

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue({updated: true})

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await result.current.updateDeliveryOption(
                productItem,
                selectedPickup,
                storeInfo,
                defaultInventoryId,
                findOrCreatePickupShipment,
                findOrCreateDeliveryShipment
            )

            expect(findOrCreatePickupShipment).toHaveBeenCalledWith(storeInfo)
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
        })

        test('should update item to delivery shipment', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2,
                inventoryId: 'store-inventory-1'
            }
            const selectedPickup = false
            const storeInfo = null
            const defaultInventoryId = 'default-inventory'
            const findOrCreatePickupShipment = jest.fn()
            const findOrCreateDeliveryShipment = jest.fn().mockResolvedValue({
                shipmentId: 'delivery-shipment'
            })

            mockUpdateItemInBasketMutation.mutateAsync.mockResolvedValue({updated: true})

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await result.current.updateDeliveryOption(
                productItem,
                selectedPickup,
                storeInfo,
                defaultInventoryId,
                findOrCreatePickupShipment,
                findOrCreateDeliveryShipment
            )

            expect(findOrCreateDeliveryShipment).toHaveBeenCalled()
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
        })

        test('should throw error for invalid basket or product item', async () => {
            const basketId = null
            const productItem = null
            const selectedPickup = true
            const storeInfo = {id: 'store-1', inventoryId: 'store-inventory-1'}
            const defaultInventoryId = 'default-inventory'
            const findOrCreatePickupShipment = jest.fn()
            const findOrCreateDeliveryShipment = jest.fn()

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateDeliveryOption(
                    productItem,
                    selectedPickup,
                    storeInfo,
                    defaultInventoryId,
                    findOrCreatePickupShipment,
                    findOrCreateDeliveryShipment
                )
            ).rejects.toThrow('Invalid basket or product item')
        })

        test('should throw error when no store selected for pickup', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
            }
            const selectedPickup = true
            const storeInfo = null
            const defaultInventoryId = 'default-inventory'
            const findOrCreatePickupShipment = jest.fn()
            const findOrCreateDeliveryShipment = jest.fn()

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateDeliveryOption(
                    productItem,
                    selectedPickup,
                    storeInfo,
                    defaultInventoryId,
                    findOrCreatePickupShipment,
                    findOrCreateDeliveryShipment
                )
            ).rejects.toThrow('No store selected for pickup')
        })

        test('should throw error when store has no inventory ID', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
            }
            const selectedPickup = true
            const storeInfo = {id: 'store-1'}
            const defaultInventoryId = 'default-inventory'
            const findOrCreatePickupShipment = jest.fn()
            const findOrCreateDeliveryShipment = jest.fn()

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateDeliveryOption(
                    productItem,
                    selectedPickup,
                    storeInfo,
                    defaultInventoryId,
                    findOrCreatePickupShipment,
                    findOrCreateDeliveryShipment
                )
            ).rejects.toThrow('Selected store does not have an inventory ID')
        })

        test('should throw error when findOrCreatePickupShipment fails', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
            }
            const selectedPickup = true
            const storeInfo = {id: 'store-1', inventoryId: 'store-inventory-1'}
            const defaultInventoryId = 'default-inventory'
            const findOrCreatePickupShipment = jest.fn().mockResolvedValue(null)
            const findOrCreateDeliveryShipment = jest.fn()

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateDeliveryOption(
                    productItem,
                    selectedPickup,
                    storeInfo,
                    defaultInventoryId,
                    findOrCreatePickupShipment,
                    findOrCreateDeliveryShipment
                )
            ).rejects.toThrow('Failed to find or create shipment')
        })

        test('should throw error when findOrCreateDeliveryShipment fails', async () => {
            const basketId = 'test-basket-id'
            const productItem = {
                itemId: 'item-1',
                productId: 'prod-1',
                quantity: 2
            }
            const selectedPickup = false
            const storeInfo = null
            const defaultInventoryId = 'default-inventory'
            const findOrCreatePickupShipment = jest.fn()
            const findOrCreateDeliveryShipment = jest.fn().mockResolvedValue(null)

            const {result} = renderHook(() => useItemShipmentManagement(basketId))

            await expect(
                result.current.updateDeliveryOption(
                    productItem,
                    selectedPickup,
                    storeInfo,
                    defaultInventoryId,
                    findOrCreatePickupShipment,
                    findOrCreateDeliveryShipment
                )
            ).rejects.toThrow('Failed to find or create shipment')
        })
    })
})
