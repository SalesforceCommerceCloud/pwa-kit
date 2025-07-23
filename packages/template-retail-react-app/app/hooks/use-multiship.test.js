/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'

// Mock dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutation: jest.fn(),
    useShippingMethodsForShipment: jest.fn()
}))

jest.mock('./use-pickup-shipment', () => ({
    usePickupShipment: jest.fn()
}))

import {
    useShopperBasketsMutation,
    useShippingMethodsForShipment
} from '@salesforce/commerce-sdk-react'
import {usePickupShipment} from '@salesforce/retail-react-app/app/hooks/use-pickup-shipment'

describe('useMultiship', () => {
    // Mock functions for mutations
    const mockUpdateItemInBasket = jest.fn()
    const mockCreateShipmentForBasket = jest.fn()
    const mockRemoveShipmentFromBasket = jest.fn()
    const mockUpdateShippingMethodForShipment = jest.fn()
    const mockRefetchShippingMethods = jest.fn()
    const mockUpdateItemsInBasket = jest.fn()

    // Mock functions for pickup shipment
    const mockIsCurrentShippingMethodPickup = jest.fn()
    const mockGetDefaultShippingMethodId = jest.fn()
    const mockGetPickupShippingMethodId = jest.fn()
    const mockConfigureDefaultShipmentIfNeeded = jest.fn()

    // Mock data
    const mockBasket = {
        basketId: 'test-basket-id',
        shipments: [
            {
                shipmentId: 'me',
                shippingMethod: {
                    id: 'default-shipping-method',
                    name: 'Default Shipping'
                }
            }
        ],
        productItems: [
            {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 1,
                shipmentId: 'me'
            }
        ]
    }

    const mockShippingMethods = {
        applicableShippingMethods: [
            {
                id: 'default-shipping-method',
                name: 'Default Shipping',
                c_storePickupEnabled: false
            },
            {
                id: 'pickup-shipping-method',
                name: 'Pickup in Store',
                c_storePickupEnabled: true
            }
        ]
    }

    const mockStoreInfo = {
        id: 'store-1',
        inventoryId: 'inventory-1',
        name: 'Test Store'
    }

    const mockDefaultInventoryId = 'default-inventory-id'

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup mutation mocks
        useShopperBasketsMutation.mockImplementation((operation) => {
            switch (operation) {
                case 'updateItemInBasket':
                    return {mutateAsync: mockUpdateItemInBasket}
                case 'createShipmentForBasket':
                    return {mutateAsync: mockCreateShipmentForBasket}
                case 'removeShipmentFromBasket':
                    return {mutateAsync: mockRemoveShipmentFromBasket}
                case 'updateShippingMethodForShipment':
                    return {mutateAsync: mockUpdateShippingMethodForShipment}
                case 'updateItemsInBasket':
                    return {mutateAsync: mockUpdateItemsInBasket}
                default:
                    return {mutateAsync: jest.fn()}
            }
        })

        // Setup shipping methods hook mock
        useShippingMethodsForShipment.mockReturnValue({
            refetch: mockRefetchShippingMethods
        })

        // Setup pickup shipment hook mock
        usePickupShipment.mockReturnValue({
            isCurrentShippingMethodPickup: mockIsCurrentShippingMethodPickup,
            getDefaultShippingMethodId: mockGetDefaultShippingMethodId,
            getPickupShippingMethodId: mockGetPickupShippingMethodId,
            configureDefaultShipmentIfNeeded: mockConfigureDefaultShipmentIfNeeded
        })

        // Default mock return values
        mockRefetchShippingMethods.mockResolvedValue({data: mockShippingMethods})
        mockGetDefaultShippingMethodId.mockReturnValue('default-shipping-method')
        mockGetPickupShippingMethodId.mockReturnValue('pickup-shipping-method')
        mockIsCurrentShippingMethodPickup.mockReturnValue(false)
        mockConfigureDefaultShipmentIfNeeded.mockResolvedValue()
        mockUpdateItemsInBasket.mockResolvedValue({basketId: 'test-basket-id'})
    })

    describe('initialization', () => {
        test('should initialize with correct functions', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            expect(result.current).toHaveProperty('assignDefaultShippingMethodsToShipments')
            expect(result.current).toHaveProperty('handleDeliveryOptionChange')
            expect(result.current).toHaveProperty('removeEmptyShipments')
            expect(result.current).toHaveProperty('findExistingDeliveryShipment')
            expect(result.current).toHaveProperty('findExistingPickupShipment')
            expect(result.current).toHaveProperty('createNewDeliveryShipment')
            expect(result.current).toHaveProperty('createNewPickupShipment')
            expect(result.current).toHaveProperty('moveItemToDeliveryShipment')
            expect(result.current).toHaveProperty('moveItemsToDeliveryShipment')
            expect(result.current).toHaveProperty('moveItemToPickupShipment')
            expect(result.current).toHaveProperty('moveItemsToPickupShipment')
            expect(result.current).toHaveProperty('findOrCreateDeliveryShipment')
            expect(result.current).toHaveProperty('findOrCreatePickupShipment')
            expect(result.current).toHaveProperty('getShipmentForItems')
            expect(result.current).toHaveProperty('findEmptyShipments')
            expect(result.current).toHaveProperty('findShipmentToConsolidate')
            expect(result.current).toHaveProperty('getItemsForShipment')
        })

        test('should handle null basket', () => {
            const {result} = renderHook(() => useMultiship(null))
            expect(result.current).toBeTruthy()
        })
    })

    describe('Pure Helper Functions', () => {
        describe('findEmptyShipments', () => {
            test('should identify shipments with no product items', () => {
                const basketWithEmptyShipments = {
                    ...mockBasket,
                    shipments: [
                        ...mockBasket.shipments,
                        {
                            shipmentId: 'empty-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithEmptyShipments))
                const emptyShipments = result.current.findEmptyShipments(basketWithEmptyShipments)

                expect(emptyShipments).toHaveLength(1)
                expect(emptyShipments[0].shipmentId).toBe('empty-shipment')
            })

            test('should return empty array when no shipments exist', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const emptyShipments = result.current.findEmptyShipments({
                    basketId: 'test',
                    shipments: []
                })

                expect(emptyShipments).toEqual([])
            })

            test('should return empty array when basket is null', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const emptyShipments = result.current.findEmptyShipments(null)

                expect(emptyShipments).toEqual([])
            })
        })

        describe('findShipmentToConsolidate', () => {
            test('should find first non-default shipment with items', () => {
                const basketWithMultipleShipments = {
                    ...mockBasket,
                    shipments: [
                        ...mockBasket.shipments,
                        {
                            shipmentId: 'other-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [
                        ...mockBasket.productItems,
                        {
                            itemId: 'item-2',
                            productId: 'product-2',
                            quantity: 1,
                            shipmentId: 'other-shipment'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithMultipleShipments))
                const shipment = result.current.findShipmentToConsolidate(
                    basketWithMultipleShipments
                )

                expect(shipment).toBeDefined()
                expect(shipment.shipmentId).toBe('other-shipment')
            })

            test('should return null when only default shipment has items', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const shipment = result.current.findShipmentToConsolidate(mockBasket)

                expect(shipment).toBeNull()
            })

            test('should return null when basket is null', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const shipment = result.current.findShipmentToConsolidate(null)

                expect(shipment).toBeNull()
            })
        })

        describe('getItemsForShipment', () => {
            test('should return items belonging to specified shipment', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const items = result.current.getItemsForShipment(mockBasket, 'me')

                expect(items).toHaveLength(1)
                expect(items[0].itemId).toBe('item-1')
                expect(items[0].shipmentId).toBe('me')
            })

            test('should return empty array for shipment with no items', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const items = result.current.getItemsForShipment(mockBasket, 'non-existent')

                expect(items).toEqual([])
            })

            test('should handle null basket gracefully', () => {
                const {result} = renderHook(() => useMultiship(mockBasket))
                const items = result.current.getItemsForShipment(null, 'me')

                expect(items).toEqual([])
            })
        })
    })

    describe('assignDefaultShippingMethodsToShipments', () => {
        test('should return early if no basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(mockRefetchShippingMethods).not.toHaveBeenCalled()
        })

        test('should assign default shipping methods to shipments without one', async () => {
            const basketWithShipmentWithoutMethod = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'shipment-2',
                        shippingMethod: null
                    }
                ]
            }
            const {result} = renderHook(() => useMultiship(basketWithShipmentWithoutMethod))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(mockRefetchShippingMethods).toHaveBeenCalled()
            expect(mockUpdateShippingMethodForShipment).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'shipment-2'
                },
                body: {
                    id: 'default-shipping-method'
                }
            })
        })

        test('should handle error when fetching shipping methods', async () => {
            const basketWithShipmentWithoutMethod = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'shipment-2',
                        shippingMethod: null
                    }
                ]
            }
            const {result} = renderHook(() => useMultiship(basketWithShipmentWithoutMethod))

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            mockRefetchShippingMethods.mockRejectedValue(new Error('Network error'))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to fetch shipping methods:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })
    })

    describe('findExistingDeliveryShipment', () => {
        test('should return null if no basket', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const deliveryShipment = result.current.findExistingDeliveryShipment(null)
            expect(deliveryShipment).toBeNull()
        })

        test('should find existing delivery shipment', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(false)

            const deliveryShipment = result.current.findExistingDeliveryShipment(mockBasket)
            expect(deliveryShipment).toEqual(mockBasket.shipments[0])
        })

        test('should not find pickup shipment as delivery', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(true)

            const deliveryShipment = result.current.findExistingDeliveryShipment(mockBasket)
            expect(deliveryShipment).toBeUndefined()
        })
    })

    describe('findExistingPickupShipment', () => {
        test('should find existing pickup shipment for store', () => {
            const basketWithPickupShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            const {result} = renderHook(() => useMultiship(basketWithPickupShipment))

            mockIsCurrentShippingMethodPickup.mockReturnValue(true)

            const pickupShipment = result.current.findExistingPickupShipment(
                basketWithPickupShipment,
                'store-1'
            )
            expect(pickupShipment).toEqual(basketWithPickupShipment.shipments[0])
        })

        test('should return null if no storeId', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const pickupShipment = result.current.findExistingPickupShipment(mockBasket, null)
            expect(pickupShipment).toBeNull()
        })
    })

    describe('createNewDeliveryShipment', () => {
        test('should create new delivery shipment when default shipment is not empty', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {
                shipments: [
                    {
                        shipmentId: 'new-delivery-shipment',
                        shippingMethod: null
                    }
                ]
            }
            mockCreateShipmentForBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.createNewDeliveryShipment(mockBasket)
                expect(response).toEqual(mockResponse)
            })

            expect(mockCreateShipmentForBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: {}
            })
        })

        test('should configure default shipment when it is empty', async () => {
            const basketWithEmptyDefault = {
                ...mockBasket,
                productItems: []
            }
            const {result} = renderHook(() => useMultiship(basketWithEmptyDefault))

            const mockConfigureResponse = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'}
                    }
                ]
            }
            mockConfigureDefaultShipmentIfNeeded.mockResolvedValue(mockConfigureResponse)

            await act(async () => {
                const response = await result.current.createNewDeliveryShipment(
                    basketWithEmptyDefault
                )
                expect(response).toEqual(mockConfigureResponse)
            })

            expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                basketWithEmptyDefault,
                'me',
                false
            )
            expect(mockCreateShipmentForBasket).not.toHaveBeenCalled()
        })
    })

    describe('createNewPickupShipment', () => {
        test('should create new pickup shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {
                shipments: [
                    {
                        shipmentId: 'new-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            mockCreateShipmentForBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.createNewPickupShipment(
                    mockBasket,
                    mockStoreInfo
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockRefetchShippingMethods).toHaveBeenCalled()
            expect(mockCreateShipmentForBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: {
                    shippingMethod: {
                        id: 'pickup-shipping-method'
                    },
                    c_fromStoreId: 'store-1'
                }
            })
        })

        test('should throw error if no pickup shipping method found', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockGetPickupShippingMethodId.mockReturnValue(null)

            await act(async () => {
                await expect(
                    result.current.createNewPickupShipment(mockBasket, mockStoreInfo)
                ).rejects.toThrow('No pickup shipping method found')
            })
        })
    })

    describe('moveItemToPickupShipment', () => {
        const mockProductItem = {
            itemId: 'item-1',
            productId: 'product-1',
            quantity: 1
        }

        test('should move item to pickup shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemToPickupShipment(
                    mockProductItem,
                    'pickup-shipment',
                    'inventory-1'
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'product-1',
                    quantity: 1,
                    shipmentId: 'pickup-shipment',
                    inventoryId: 'inventory-1'
                }
            })
        })

        test('should throw error if invalid basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await expect(
                    result.current.moveItemToPickupShipment(
                        mockProductItem,
                        'pickup-shipment',
                        'inventory-1'
                    )
                ).rejects.toThrow('Invalid basket or product item')
            })
        })
    })

    describe('moveItemToDeliveryShipment', () => {
        const mockProductItem = {
            itemId: 'item-1',
            productId: 'product-1',
            quantity: 1,
            inventoryId: 'inventory-1'
        }

        test('should move item to delivery shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemToDeliveryShipment(
                    mockProductItem,
                    'me',
                    mockDefaultInventoryId
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'product-1',
                    quantity: 1,
                    shipmentId: 'me',
                    inventoryId: mockDefaultInventoryId
                }
            })
        })

        test('should move item without inventory ID', async () => {
            const productItemWithoutInventory = {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 1
            }
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemToDeliveryShipment(
                    productItemWithoutInventory,
                    'me',
                    mockDefaultInventoryId
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'product-1',
                    quantity: 1,
                    shipmentId: 'me'
                }
            })
        })
    })

    describe('moveItemsToDeliveryShipment', () => {
        const mockProductItems = [
            {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 2,
                inventoryId: 'inventory-1'
            },
            {
                itemId: 'item-2',
                productId: 'product-2',
                quantity: 1,
                inventoryId: 'inventory-2'
            }
        ]

        test('should move multiple items to delivery shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemsInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemsToDeliveryShipment(
                    mockProductItems,
                    'delivery-shipment',
                    mockDefaultInventoryId
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 2,
                        shipmentId: 'delivery-shipment',
                        inventoryId: mockDefaultInventoryId
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-2',
                        quantity: 1,
                        shipmentId: 'delivery-shipment',
                        inventoryId: mockDefaultInventoryId
                    }
                ]
            })
        })

        test('should handle API error gracefully', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            mockUpdateItemsInBasket.mockRejectedValue(new Error('API Error'))

            await act(async () => {
                const response = await result.current.moveItemsToDeliveryShipment(
                    mockProductItems,
                    'me',
                    mockDefaultInventoryId
                )
                expect(response).toEqual(expect.any(Error))
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to move items to delivery shipment:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })
    })

    describe('moveItemsToPickupShipment', () => {
        const mockProductItems = [
            {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 2
            },
            {
                itemId: 'item-2',
                productId: 'product-2',
                quantity: 1
            }
        ]

        test('should move multiple items to pickup shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemsInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemsToPickupShipment(
                    mockProductItems,
                    'pickup-shipment',
                    'inventory-1'
                )
                expect(response).toEqual(mockResponse)
            })

            expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 2,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'inventory-1'
                    },
                    {
                        itemId: 'item-2',
                        productId: 'product-2',
                        quantity: 1,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'inventory-1'
                    }
                ]
            })
        })

        test('should handle API error gracefully', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            mockUpdateItemsInBasket.mockRejectedValue(new Error('API Error'))

            await act(async () => {
                const response = await result.current.moveItemsToPickupShipment(
                    mockProductItems,
                    'pickup-shipment',
                    'inventory-1'
                )
                expect(response).toEqual(expect.any(Error))
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to move items to pickup shipment:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })
    })

    describe('handleDeliveryOptionChange', () => {
        const mockProductItem = {
            itemId: 'item-1',
            productId: 'product-1',
            quantity: 1,
            shipmentId: 'me'
        }

        test('should throw error if invalid basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await expect(
                    result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        false,
                        null,
                        mockDefaultInventoryId
                    )
                ).rejects.toThrow('Invalid basket or product item')
            })
        })

        test('should handle change from delivery to pickup', async () => {
            // Create a basket where the current item is in a delivery shipment
            const basketWithDeliveryItem = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'} // This is delivery
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'me'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithDeliveryItem))

            // Mock that current shipment is delivery (not pickup) for the item's current shipment
            // But return true for pickup shipments when checking the new shipment
            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                if (!method) return false
                return method.id === 'pickup-shipping-method'
            })

            const mockNewShipmentResponse = {
                shipments: [
                    {
                        shipmentId: 'new-pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            mockCreateShipmentForBasket.mockResolvedValue(mockNewShipmentResponse)

            // Mock successful item update
            mockUpdateItemInBasket.mockResolvedValue({basketId: 'test-basket-id'})

            const productItemInDelivery = {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 1,
                shipmentId: 'me'
            }

            await act(async () => {
                await result.current.handleDeliveryOptionChange(
                    productItemInDelivery,
                    true, // selectedPickup = true
                    mockStoreInfo,
                    mockDefaultInventoryId
                )
            })

            expect(mockCreateShipmentForBasket).toHaveBeenCalled()
            expect(mockUpdateItemInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    itemId: 'item-1'
                },
                body: {
                    productId: 'product-1',
                    quantity: 1,
                    shipmentId: 'new-pickup-shipment',
                    inventoryId: 'inventory-1'
                }
            })
        })

        test('should throw error if store has no inventory ID', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(false)

            const storeWithoutInventory = {
                ...mockStoreInfo,
                inventoryId: null
            }

            await act(async () => {
                await expect(
                    result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        storeWithoutInventory,
                        mockDefaultInventoryId
                    )
                ).rejects.toThrow('Selected store does not have an inventory ID')
            })
        })
    })

    describe('removeEmptyShipments', () => {
        test('should return early if no basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await result.current.removeEmptyShipments()
            })

            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
        })

        test('should remove empty non-me shipments', async () => {
            const basketWithEmptyShipments = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'empty-shipment-1',
                        shippingMethod: {id: 'default-shipping-method'}
                    },
                    {
                        shipmentId: 'empty-shipment-2',
                        shippingMethod: {id: 'pickup-shipping-method'}
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'me'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyShipments))

            await act(async () => {
                await result.current.removeEmptyShipments()
            })

            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledTimes(2)
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'empty-shipment-1'
                }
            })
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'empty-shipment-2'
                }
            })
        })

        test('should consolidate pickup shipment into empty "me"', async () => {
            const basketWithEmptyMe = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'}
                    },
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ],
                productItems: [
                    {
                        itemId: 'pickup-item-1',
                        productId: 'pickup-product-1',
                        quantity: 1,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'inventory-1'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyMe))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            await act(async () => {
                await result.current.removeEmptyShipments()
            })

            expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                basketWithEmptyMe,
                'me',
                true,
                {id: 'store-1', inventoryId: 'inventory-1'}
            )
            expect(mockUpdateItemsInBasket).toHaveBeenCalled()
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'pickup-shipment'
                }
            })
        })
    })

    describe('getShipmentForItems', () => {
        test('should return default shipment ID when no basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                const response = await result.current.getShipmentForItems(false, mockStoreInfo)
                expect(response).toBe('me')
            })
        })

        test('should handle pickup selection', async () => {
            const basketWithPickupShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }

            mockIsCurrentShippingMethodPickup.mockReturnValue(true)
            const {result} = renderHook(() => useMultiship(basketWithPickupShipment))

            await act(async () => {
                const response = await result.current.getShipmentForItems(true, mockStoreInfo)
                expect(response).toBe('pickup-shipment')
            })
        })
    })
})
