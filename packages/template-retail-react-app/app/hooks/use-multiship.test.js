/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'

// Mock the external dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutation: jest.fn(),
    useShippingMethodsForShipment: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-pickup-shipment', () => ({
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

    // Mock defaultInventoryId for tests
    const mockDefaultInventoryId = 'default-inventory-id'

    // Mock basket data
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

    const mockBasketWithPickupShipment = {
        basketId: 'test-basket-id',
        shipments: [
            {
                shipmentId: 'me',
                shippingMethod: {
                    id: 'default-shipping-method',
                    name: 'Default Shipping'
                }
            },
            {
                shipmentId: 'pickup-shipment',
                shippingMethod: {
                    id: 'pickup-shipping-method',
                    name: 'Pickup in Store'
                },
                c_fromStoreId: 'store-1'
            }
        ],
        productItems: [
            {
                itemId: 'item-1',
                productId: 'product-1',
                quantity: 1,
                shipmentId: 'me'
            },
            {
                itemId: 'item-2',
                productId: 'product-2',
                quantity: 2,
                shipmentId: 'pickup-shipment'
            }
        ]
    }

    // Mock second product item for multi-item test scenarios
    const mockSecondProductItem = {
        itemId: 'item-2',
        productId: 'product-2',
        quantity: 1,
        shipmentId: 'me'
    }

    // Mock shipping methods
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

    // Mock store info
    const mockStoreInfo = {
        id: 'store-1',
        inventoryId: 'inventory-1',
        name: 'Test Store'
    }

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
        })

        test('should handle null basket', () => {
            const {result} = renderHook(() => useMultiship(null))
            expect(result.current).toBeTruthy()
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

        test('should return early if no basketId', async () => {
            const basketWithoutId = {...mockBasket, basketId: undefined}
            const {result} = renderHook(() => useMultiship(basketWithoutId))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(mockRefetchShippingMethods).not.toHaveBeenCalled()
        })

        test('should return early if no shipments', async () => {
            const basketWithoutShipments = {...mockBasket, shipments: []}
            const {result} = renderHook(() => useMultiship(basketWithoutShipments))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(mockRefetchShippingMethods).not.toHaveBeenCalled()
        })

        test('should return early if all shipments have shipping methods', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

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
            expect(mockGetDefaultShippingMethodId).toHaveBeenCalledWith(mockShippingMethods)
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

        test('should handle error when updating shipping method', async () => {
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
            mockUpdateShippingMethodForShipment.mockRejectedValue(new Error('Update error'))

            await act(async () => {
                await result.current.assignDefaultShippingMethodsToShipments()
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to assign shipping method to shipment shipment-2:',
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

        test('should return null if no shipments', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const basketWithoutShipments = {...mockBasket, shipments: undefined}
            const deliveryShipment =
                result.current.findExistingDeliveryShipment(basketWithoutShipments)
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
        test('should return null if no basket', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const pickupShipment = result.current.findExistingPickupShipment(null, 'store-1')
            expect(pickupShipment).toBeNull()
        })

        test('should return null if no shipments', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const basketWithoutShipments = {...mockBasket, shipments: undefined}
            const pickupShipment = result.current.findExistingPickupShipment(
                basketWithoutShipments,
                'store-1'
            )
            expect(pickupShipment).toBeNull()
        })

        test('should return null if no storeId', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const pickupShipment = result.current.findExistingPickupShipment(mockBasket, null)
            expect(pickupShipment).toBeNull()
        })

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

        test('should not find pickup shipment for different store', () => {
            const basketWithPickupShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-2'
                    }
                ]
            }
            const {result} = renderHook(() => useMultiship(basketWithPickupShipment))

            mockIsCurrentShippingMethodPickup.mockReturnValue(true)

            const pickupShipment = result.current.findExistingPickupShipment(
                basketWithPickupShipment,
                'store-1'
            )
            expect(pickupShipment).toBeUndefined()
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
                productItems: [] // No items in default shipment
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
            expect(mockGetPickupShippingMethodId).toHaveBeenCalledWith(mockShippingMethods)
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

        test('should configure default shipment for pickup when it is empty', async () => {
            const basketWithEmptyDefault = {
                ...mockBasket,
                productItems: [] // No items in default shipment
            }
            const {result} = renderHook(() => useMultiship(basketWithEmptyDefault))

            const mockConfigureResponse = {
                basketId: 'test-basket-id',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            mockConfigureDefaultShipmentIfNeeded.mockResolvedValue(mockConfigureResponse)

            await act(async () => {
                const response = await result.current.createNewPickupShipment(
                    basketWithEmptyDefault,
                    mockStoreInfo
                )
                expect(response).toEqual(mockConfigureResponse)
            })

            expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                basketWithEmptyDefault,
                'me',
                true,
                mockStoreInfo
            )
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

        test('should throw error if invalid product item', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.moveItemToPickupShipment(null, 'pickup-shipment', 'inventory-1')
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

        test('should move item to delivery shipment with default target', async () => {
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

        test('should move item to delivery shipment with custom target', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemToDeliveryShipment(
                    mockProductItem,
                    'delivery-shipment',
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
                    shipmentId: 'delivery-shipment',
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

        test('should throw error if invalid basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await expect(
                    result.current.moveItemToDeliveryShipment(
                        mockProductItem,
                        'me',
                        mockDefaultInventoryId
                    )
                ).rejects.toThrow('Invalid basket or product item')
            })
        })

        test('should throw error if invalid product item', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.moveItemToDeliveryShipment(null, 'me', mockDefaultInventoryId)
                ).rejects.toThrow('Invalid basket or product item')
            })
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

        test('should throw error if invalid product item', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.handleDeliveryOptionChange(
                        null,
                        false,
                        null,
                        mockDefaultInventoryId
                    )
                ).rejects.toThrow('Invalid basket or product item')
            })
        })

        describe('pickup to delivery', () => {
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

            const pickupProductItem = {
                ...mockProductItem,
                shipmentId: 'pickup-shipment'
            }

            test('should move item from pickup to existing delivery shipment', async () => {
                const basketWithBothShipments = {
                    ...basketWithPickupShipment,
                    shipments: [
                        ...basketWithPickupShipment.shipments,
                        {
                            shipmentId: 'delivery-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [pickupProductItem]
                }

                const {result} = renderHook(() => useMultiship(basketWithBothShipments))

                // Mock the current shipment as pickup
                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const mockUpdatedBasket = {
                    ...basketWithBothShipments,
                    productItems: [
                        {
                            ...pickupProductItem,
                            shipmentId: 'delivery-shipment'
                        }
                    ]
                }
                mockUpdateItemInBasket.mockResolvedValue(mockUpdatedBasket)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        pickupProductItem,
                        false,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(mockUpdateItemInBasket).toHaveBeenCalled()
                expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'pickup-shipment'
                    }
                })
            })

            test('should create new delivery shipment and move item', async () => {
                const {result} = renderHook(() => useMultiship(basketWithPickupShipment))

                // Mock the current shipment as pickup
                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const mockNewShipmentResponse = {
                    shipments: [
                        {
                            shipmentId: 'new-delivery-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ]
                }
                mockCreateShipmentForBasket.mockResolvedValue(mockNewShipmentResponse)

                const mockUpdatedBasket = {
                    ...basketWithPickupShipment,
                    productItems: [
                        {
                            ...pickupProductItem,
                            shipmentId: 'new-delivery-shipment'
                        }
                    ]
                }
                mockUpdateItemInBasket.mockResolvedValue(mockUpdatedBasket)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        pickupProductItem,
                        false,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(mockCreateShipmentForBasket).toHaveBeenCalled()
                expect(mockUpdateItemInBasket).toHaveBeenCalled()
            })

            test('should throw error if failed to create delivery shipment', async () => {
                const {result} = renderHook(() => useMultiship(basketWithPickupShipment))

                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const mockNewShipmentResponse = {
                    shipments: []
                }
                mockCreateShipmentForBasket.mockResolvedValue(mockNewShipmentResponse)

                await act(async () => {
                    await expect(
                        result.current.handleDeliveryOptionChange(
                            pickupProductItem,
                            false,
                            mockStoreInfo,
                            mockDefaultInventoryId
                        )
                    ).rejects.toThrow('Failed to find or create shipment')
                })
            })
        })

        describe('delivery to pickup', () => {
            test('should move item from delivery to existing pickup shipment', async () => {
                const basketWithBothShipments = {
                    ...mockBasket,
                    shipments: [
                        ...mockBasket.shipments,
                        {
                            shipmentId: 'pickup-shipment',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ],
                    productItems: [mockProductItem, mockSecondProductItem]
                }

                const {result} = renderHook(() => useMultiship(basketWithBothShipments))

                // Mock the current shipment as delivery
                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const mockUpdatedBasket = {
                    ...basketWithBothShipments,
                    productItems: [
                        {
                            ...mockProductItem,
                            shipmentId: 'pickup-shipment'
                        },
                        mockSecondProductItem
                    ]
                }
                mockUpdateItemInBasket.mockResolvedValue(mockUpdatedBasket)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(mockUpdateItemInBasket).toHaveBeenCalled()
                // Should NOT remove 'me' shipment as it's the default shipment
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should create new pickup shipment and move item', async () => {
                // Create basket with multiple items in "me" to avoid special case handling
                const basketWithMultipleItems = {
                    ...mockBasket,
                    productItems: [mockProductItem, mockSecondProductItem]
                }
                const {result} = renderHook(() => useMultiship(basketWithMultipleItems))

                // Mock that current shipment is NOT pickup initially
                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
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

                const mockUpdatedBasket = {
                    ...basketWithMultipleItems,
                    productItems: [mockSecondProductItem] // Only one item remains in 'me' shipment
                }
                mockUpdateItemInBasket.mockResolvedValue(mockUpdatedBasket)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(mockCreateShipmentForBasket).toHaveBeenCalled()
                expect(mockUpdateItemInBasket).toHaveBeenCalled()
                // Should NOT remove 'me' shipment as it's the default shipment
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should throw error if no store selected', async () => {
                // Create basket with multiple items in "me" to avoid special case handling
                const basketWithMultipleItems = {
                    ...mockBasket,
                    productItems: [mockProductItem, mockSecondProductItem]
                }
                const {result} = renderHook(() => useMultiship(basketWithMultipleItems))

                mockIsCurrentShippingMethodPickup.mockReturnValue(false)

                await act(async () => {
                    await expect(
                        result.current.handleDeliveryOptionChange(
                            mockProductItem,
                            true,
                            null,
                            mockDefaultInventoryId
                        )
                    ).rejects.toThrow('No store selected for pickup')
                })
            })

            test('should throw error if store has no inventory ID', async () => {
                // Create basket with multiple items in "me" to avoid special case handling
                const basketWithMultipleItems = {
                    ...mockBasket,
                    productItems: [mockProductItem, mockSecondProductItem]
                }
                const {result} = renderHook(() => useMultiship(basketWithMultipleItems))

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

            test('should throw error if failed to create pickup shipment', async () => {
                // Create basket with multiple items in "me" to avoid special case handling
                const basketWithMultipleItems = {
                    ...mockBasket,
                    productItems: [mockProductItem, mockSecondProductItem]
                }
                const {result} = renderHook(() => useMultiship(basketWithMultipleItems))

                mockIsCurrentShippingMethodPickup.mockReturnValue(false)

                const mockNewShipmentResponse = {
                    shipments: []
                }
                mockCreateShipmentForBasket.mockResolvedValue(mockNewShipmentResponse)

                await act(async () => {
                    await expect(
                        result.current.handleDeliveryOptionChange(
                            mockProductItem,
                            true,
                            mockStoreInfo,
                            mockDefaultInventoryId
                        )
                    ).rejects.toThrow('Failed to find or create shipment')
                })
            })
        })

        test('should not remove "me" shipment even if empty', async () => {
            const basketWithDeliveryShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {id: 'default-shipping-method'}
                    }
                ],
                productItems: [mockProductItem]
            }

            const {result} = renderHook(() => useMultiship(basketWithDeliveryShipment))

            // Mock that current shipment is NOT pickup initially
            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
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

            const mockUpdatedBasket = {
                ...basketWithDeliveryShipment,
                productItems: [] // Empty - simulating item moved out of 'me' shipment
            }
            mockUpdateItemInBasket.mockResolvedValue(mockUpdatedBasket)

            await act(async () => {
                await result.current.handleDeliveryOptionChange(
                    mockProductItem,
                    true,
                    mockStoreInfo,
                    mockDefaultInventoryId
                )
            })

            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
        })

        test('should handle error when removing empty shipment', async () => {
            const basketWithCustomShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'custom-shipment',
                        shippingMethod: {id: 'default-shipping-method'}
                    }
                ],
                productItems: [
                    {
                        ...mockProductItem,
                        shipmentId: 'custom-shipment'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithCustomShipment))

            // Mock that current shipment is NOT pickup initially
            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
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

            const mockUpdatedBasket = {
                ...basketWithCustomShipment,
                productItems: [
                    {
                        ...mockProductItem,
                        shipmentId: 'new-pickup-shipment' // Item moved to pickup shipment
                    }
                ]
            }
            mockUpdateItemInBasket.mockResolvedValue(mockUpdatedBasket)

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            mockRemoveShipmentFromBasket.mockRejectedValue(new Error('Remove error'))

            await act(async () => {
                await result.current.handleDeliveryOptionChange(
                    {
                        ...mockProductItem,
                        shipmentId: 'custom-shipment' // Item starts in custom-shipment
                    },
                    true,
                    mockStoreInfo,
                    mockDefaultInventoryId
                )
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to remove empty source shipment custom-shipment:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })

        describe('special case: single item in "me" shipment', () => {
            test('should reconfigure "me" from delivery to pickup without existing pickup shipment', async () => {
                const basketWithSingleItemInMe = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [mockProductItem] // Only one item in "me" shipment
                }

                const {result} = renderHook(() => useMultiship(basketWithSingleItemInMe))

                // Mock that current shipment is delivery (not pickup)
                mockIsCurrentShippingMethodPickup.mockReturnValue(false)

                const mockConfigureResponse = {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ]
                }
                mockConfigureDefaultShipmentIfNeeded.mockResolvedValue(mockConfigureResponse)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo
                    )
                })

                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithSingleItemInMe,
                    'me',
                    true,
                    mockStoreInfo
                )
                // Should call moveItemsToPickupShipment to update the product item's inventoryId
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'item-1',
                            productId: 'product-1',
                            quantity: 1,
                            shipmentId: 'me',
                            inventoryId: 'inventory-1'
                        }
                    ]
                })
                expect(mockCreateShipmentForBasket).not.toHaveBeenCalled()
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should reconfigure "me" from delivery to pickup and consolidate existing pickup shipment', async () => {
                const basketWithPickupAndSingleItemInMe = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'existing-pickup',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ],
                    productItems: [
                        mockProductItem, // Only one item in "me" shipment
                        {
                            itemId: 'pickup-item-1',
                            productId: 'pickup-product-1',
                            quantity: 1,
                            shipmentId: 'existing-pickup'
                        },
                        {
                            itemId: 'pickup-item-2',
                            productId: 'pickup-product-2',
                            quantity: 2,
                            shipmentId: 'existing-pickup'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithPickupAndSingleItemInMe))

                // Mock that current shipment is delivery (not pickup)
                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const mockConfigureResponse = {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ]
                }
                mockConfigureDefaultShipmentIfNeeded.mockResolvedValue(mockConfigureResponse)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithPickupAndSingleItemInMe,
                    'me',
                    true,
                    mockStoreInfo
                )
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'pickup-item-1',
                            productId: 'pickup-product-1',
                            quantity: 1,
                            shipmentId: 'me',
                            inventoryId: 'inventory-1'
                        },
                        {
                            itemId: 'pickup-item-2',
                            productId: 'pickup-product-2',
                            quantity: 2,
                            shipmentId: 'me',
                            inventoryId: 'inventory-1'
                        }
                    ]
                })
                expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'existing-pickup'
                    }
                })
            })

            test('should reconfigure "me" from pickup to delivery', async () => {
                const basketWithPickupSingleItemInMe = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ],
                    productItems: [
                        {
                            ...mockProductItem,
                            inventoryId: 'inventory-1'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithPickupSingleItemInMe))

                // Mock that current shipment is pickup
                mockIsCurrentShippingMethodPickup.mockReturnValue(true)

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
                    await result.current.handleDeliveryOptionChange(
                        {
                            ...mockProductItem,
                            inventoryId: 'inventory-1'
                        },
                        false,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithPickupSingleItemInMe,
                    'me',
                    false,
                    mockStoreInfo
                )
                // Should call moveItemsToDeliveryShipment to update the product item's inventoryId
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'item-1',
                            productId: 'product-1',
                            quantity: 1,
                            shipmentId: 'me',
                            inventoryId: mockDefaultInventoryId
                        }
                    ]
                })
                expect(mockCreateShipmentForBasket).not.toHaveBeenCalled()
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should reconfigure "me" from pickup to delivery and consolidate existing delivery shipment', async () => {
                const basketWithPickupAndDeliveryShipments = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        },
                        {
                            shipmentId: 'existing-delivery',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [
                        {
                            ...mockProductItem,
                            inventoryId: 'inventory-1'
                        },
                        {
                            itemId: 'delivery-item-1',
                            productId: 'delivery-product-1',
                            quantity: 2,
                            shipmentId: 'existing-delivery'
                        },
                        {
                            itemId: 'delivery-item-2',
                            productId: 'delivery-product-2',
                            quantity: 1,
                            shipmentId: 'existing-delivery'
                        }
                    ]
                }

                const {result} = renderHook(() =>
                    useMultiship(basketWithPickupAndDeliveryShipments)
                )

                // Mock that current shipment is pickup
                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

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
                    await result.current.handleDeliveryOptionChange(
                        {
                            ...mockProductItem,
                            inventoryId: 'inventory-1'
                        },
                        false,
                        mockStoreInfo
                    )
                })

                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithPickupAndDeliveryShipments,
                    'me',
                    false,
                    mockStoreInfo
                )
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'delivery-item-1',
                            productId: 'delivery-product-1',
                            quantity: 2,
                            shipmentId: 'me'
                        },
                        {
                            itemId: 'delivery-item-2',
                            productId: 'delivery-product-2',
                            quantity: 1,
                            shipmentId: 'me'
                        }
                    ]
                })
                expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'existing-delivery'
                    }
                })
            })

            test('should handle error when consolidating delivery shipment', async () => {
                const basketWithPickupAndDeliveryShipments = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        },
                        {
                            shipmentId: 'existing-delivery',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [
                        {
                            ...mockProductItem,
                            inventoryId: 'inventory-1'
                        },
                        {
                            itemId: 'delivery-item-1',
                            productId: 'delivery-product-1',
                            quantity: 1,
                            shipmentId: 'existing-delivery'
                        }
                    ]
                }

                const {result} = renderHook(() =>
                    useMultiship(basketWithPickupAndDeliveryShipments)
                )

                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

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

                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
                mockRemoveShipmentFromBasket.mockRejectedValue(new Error('Remove error'))

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        {
                            ...mockProductItem,
                            inventoryId: 'inventory-1'
                        },
                        false,
                        mockStoreInfo
                    )
                })

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Failed to remove consolidated delivery shipment existing-delivery:',
                    expect.any(Error)
                )
                consoleErrorSpy.mockRestore()
            })

            test('should not consolidate delivery shipments with different shipping methods', async () => {
                const basketWithDifferentDeliveryMethods = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        },
                        {
                            shipmentId: 'other-delivery',
                            shippingMethod: {id: 'express-shipping-method'} // Different method
                        }
                    ],
                    productItems: [
                        {
                            ...mockProductItem,
                            inventoryId: 'inventory-1'
                        },
                        {
                            itemId: 'delivery-item-1',
                            productId: 'delivery-product-1',
                            quantity: 1,
                            shipmentId: 'other-delivery'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithDifferentDeliveryMethods))

                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

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
                    await result.current.handleDeliveryOptionChange(
                        {
                            ...mockProductItem,
                            inventoryId: 'inventory-1'
                        },
                        false,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithDifferentDeliveryMethods,
                    'me',
                    false,
                    mockStoreInfo
                )
                // Should not attempt to consolidate items from delivery shipment with different shipping method
                // But should still update the product item's inventory ID
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'item-1',
                            productId: 'product-1',
                            quantity: 1,
                            shipmentId: 'me',
                            inventoryId: mockDefaultInventoryId
                        }
                    ]
                })
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should handle error when consolidating pickup shipment', async () => {
                const basketWithPickupAndSingleItemInMe = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'existing-pickup',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ],
                    productItems: [
                        mockProductItem,
                        {
                            itemId: 'pickup-item-1',
                            productId: 'pickup-product-1',
                            quantity: 1,
                            shipmentId: 'existing-pickup'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithPickupAndSingleItemInMe))

                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const mockConfigureResponse = {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ]
                }
                mockConfigureDefaultShipmentIfNeeded.mockResolvedValue(mockConfigureResponse)

                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
                mockRemoveShipmentFromBasket.mockRejectedValue(new Error('Remove error'))

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Failed to remove consolidated pickup shipment existing-pickup:',
                    expect.any(Error)
                )
                consoleErrorSpy.mockRestore()
            })

            test('should not consolidate pickup shipment from different store', async () => {
                const basketWithDifferentStorePickup = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'other-store-pickup',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-2' // Different store
                        }
                    ],
                    productItems: [
                        mockProductItem,
                        {
                            itemId: 'pickup-item-1',
                            productId: 'pickup-product-1',
                            quantity: 1,
                            shipmentId: 'other-store-pickup'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithDifferentStorePickup))

                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                const mockConfigureResponse = {
                    basketId: 'test-basket-id',
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ]
                }
                mockConfigureDefaultShipmentIfNeeded.mockResolvedValue(mockConfigureResponse)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithDifferentStorePickup,
                    'me',
                    true,
                    mockStoreInfo
                )
                // Should not attempt to consolidate items from different store
                // But should still update the product item's inventory ID
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'item-1',
                            productId: 'product-1',
                            quantity: 1,
                            shipmentId: 'me',
                            inventoryId: 'inventory-1'
                        }
                    ]
                })
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should not apply special handling when "me" has multiple items', async () => {
                const basketWithMultipleItemsInMe = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [mockProductItem, mockSecondProductItem]
                }

                const {result} = renderHook(() => useMultiship(basketWithMultipleItemsInMe))

                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
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

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo,
                        mockDefaultInventoryId
                    )
                })

                // Should follow normal logic - create new shipment and move item
                expect(mockCreateShipmentForBasket).toHaveBeenCalled()
                expect(mockUpdateItemInBasket).toHaveBeenCalled()
                expect(mockConfigureDefaultShipmentIfNeeded).not.toHaveBeenCalled()
            })
        })
    })

    describe('removeEmptyShipments', () => {
        test('should return early if no basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await result.current.removeEmptyShipments(mockDefaultInventoryId)
            })

            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
        })

        test('should return early if no basketId', async () => {
            const basketWithoutId = {...mockBasket, basketId: undefined}
            const {result} = renderHook(() => useMultiship(basketWithoutId))

            await act(async () => {
                await result.current.removeEmptyShipments(mockDefaultInventoryId)
            })

            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
        })

        test('should return early if no shipments', async () => {
            const basketWithoutShipments = {...mockBasket, shipments: []}
            const {result} = renderHook(() => useMultiship(basketWithoutShipments))

            await act(async () => {
                await result.current.removeEmptyShipments(mockDefaultInventoryId)
            })

            expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
        })

        test('should return early if no empty shipments', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await result.current.removeEmptyShipments(mockDefaultInventoryId)
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
                ] // Items only in 'me' shipment
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyShipments))

            await act(async () => {
                await result.current.removeEmptyShipments(mockDefaultInventoryId)
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

        test('should handle error when removing empty shipment', async () => {
            const basketWithEmptyShipment = {
                ...mockBasket,
                shipments: [
                    ...mockBasket.shipments,
                    {
                        shipmentId: 'empty-shipment',
                        shippingMethod: {id: 'default-shipping-method'}
                    }
                ],
                productItems: [
                    {
                        itemId: 'item-1',
                        productId: 'product-1',
                        quantity: 1,
                        shipmentId: 'me'
                    }
                ] // Items only in 'me' shipment
            }

            const {result} = renderHook(() => useMultiship(basketWithEmptyShipment))

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            mockRemoveShipmentFromBasket.mockRejectedValue(new Error('Remove error'))

            await act(async () => {
                await result.current.removeEmptyShipments(mockDefaultInventoryId)
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to remove empty shipment empty-shipment:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })

        describe('when "me" is empty', () => {
            test('should consolidate pickup shipment into "me"', async () => {
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
                        },
                        {
                            itemId: 'pickup-item-2',
                            productId: 'pickup-product-2',
                            quantity: 2,
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
                    await result.current.removeEmptyShipments(mockDefaultInventoryId)
                })

                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithEmptyMe,
                    'me',
                    true,
                    {id: 'store-1', inventoryId: 'inventory-1'}
                )
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'pickup-item-1',
                            productId: 'pickup-product-1',
                            quantity: 1,
                            shipmentId: 'me',
                            inventoryId: 'inventory-1'
                        },
                        {
                            itemId: 'pickup-item-2',
                            productId: 'pickup-product-2',
                            quantity: 2,
                            shipmentId: 'me',
                            inventoryId: 'inventory-1'
                        }
                    ]
                })
                expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'pickup-shipment'
                    }
                })
            })

            test('should consolidate delivery shipment into "me"', async () => {
                const basketWithEmptyMe = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'delivery-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [
                        {
                            itemId: 'delivery-item-1',
                            productId: 'delivery-product-1',
                            quantity: 1,
                            shipmentId: 'delivery-shipment'
                        },
                        {
                            itemId: 'delivery-item-2',
                            productId: 'delivery-product-2',
                            quantity: 3,
                            shipmentId: 'delivery-shipment'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithEmptyMe))

                mockIsCurrentShippingMethodPickup.mockReturnValue(false)

                await act(async () => {
                    await result.current.removeEmptyShipments(mockDefaultInventoryId)
                })

                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithEmptyMe,
                    'me',
                    false,
                    null
                )
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'delivery-item-1',
                            productId: 'delivery-product-1',
                            quantity: 1,
                            shipmentId: 'me'
                        },
                        {
                            itemId: 'delivery-item-2',
                            productId: 'delivery-product-2',
                            quantity: 3,
                            shipmentId: 'me'
                        }
                    ]
                })
                expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'delivery-shipment'
                    }
                })
            })

            test('should consolidate delivery shipment into "me" with defaultInventoryId', async () => {
                const basketWithEmptyMe = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'delivery-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [
                        {
                            itemId: 'delivery-item-1',
                            productId: 'delivery-product-1',
                            quantity: 1,
                            shipmentId: 'delivery-shipment',
                            inventoryId: 'old-inventory-id'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithEmptyMe))

                mockIsCurrentShippingMethodPickup.mockReturnValue(false)

                await act(async () => {
                    await result.current.removeEmptyShipments(mockDefaultInventoryId)
                })

                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'delivery-item-1',
                            productId: 'delivery-product-1',
                            quantity: 1,
                            shipmentId: 'me',
                            inventoryId: mockDefaultInventoryId
                        }
                    ]
                })
            })

            test('should not consolidate if pickup shipment missing store info', async () => {
                const basketWithEmptyMe = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'pickup-shipment',
                            shippingMethod: {id: 'pickup-shipping-method'}
                            // Missing c_fromStoreId
                        }
                    ],
                    productItems: [
                        {
                            itemId: 'pickup-item-1',
                            productId: 'pickup-product-1',
                            quantity: 1,
                            shipmentId: 'pickup-shipment'
                            // Missing inventoryId
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithEmptyMe))

                mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                    return method?.id === 'pickup-shipping-method'
                })

                await act(async () => {
                    await result.current.removeEmptyShipments(mockDefaultInventoryId)
                })

                // Should not attempt to configure or move items due to missing store info
                expect(mockConfigureDefaultShipmentIfNeeded).not.toHaveBeenCalled()
                expect(mockUpdateItemsInBasket).not.toHaveBeenCalled()
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should do nothing if "me" is empty and no other shipments have items', async () => {
                const basketWithAllEmptyShipments = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'empty-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        }
                    ],
                    productItems: [] // No items in any shipment
                }

                const {result} = renderHook(() => useMultiship(basketWithAllEmptyShipments))

                await act(async () => {
                    await result.current.removeEmptyShipments(mockDefaultInventoryId)
                })

                // Should not configure "me" since there are no items to consolidate
                expect(mockConfigureDefaultShipmentIfNeeded).not.toHaveBeenCalled()
                expect(mockUpdateItemsInBasket).not.toHaveBeenCalled()
                // Should still remove other empty shipments
                expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'empty-shipment'
                    }
                })
            })

            test('should handle error when consolidating pickup shipment', async () => {
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

                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
                mockRemoveShipmentFromBasket.mockRejectedValue(new Error('Remove error'))

                await act(async () => {
                    await result.current.removeEmptyShipments(mockDefaultInventoryId)
                })

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Failed to remove consolidated shipment pickup-shipment:',
                    expect.any(Error)
                )
                consoleErrorSpy.mockRestore()
            })

            test('should prioritize first non-empty shipment for consolidation', async () => {
                const basketWithMultipleNonEmptyShipments = {
                    ...mockBasket,
                    shipments: [
                        {
                            shipmentId: 'me',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'first-shipment',
                            shippingMethod: {id: 'default-shipping-method'}
                        },
                        {
                            shipmentId: 'second-shipment',
                            shippingMethod: {id: 'pickup-shipping-method'},
                            c_fromStoreId: 'store-1'
                        }
                    ],
                    productItems: [
                        {
                            itemId: 'first-item',
                            productId: 'first-product',
                            quantity: 1,
                            shipmentId: 'first-shipment'
                        },
                        {
                            itemId: 'second-item',
                            productId: 'second-product',
                            quantity: 1,
                            shipmentId: 'second-shipment',
                            inventoryId: 'inventory-1'
                        }
                    ]
                }

                const {result} = renderHook(() => useMultiship(basketWithMultipleNonEmptyShipments))

                mockIsCurrentShippingMethodPickup.mockReturnValue(false)

                await act(async () => {
                    await result.current.removeEmptyShipments(mockDefaultInventoryId)
                })

                // Should consolidate the first non-empty shipment (delivery)
                expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                    basketWithMultipleNonEmptyShipments,
                    'me',
                    false,
                    null
                )
                expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id'
                    },
                    body: [
                        {
                            itemId: 'first-item',
                            productId: 'first-product',
                            quantity: 1,
                            shipmentId: 'me'
                        }
                    ]
                })
                expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'first-shipment'
                    }
                })
                // Should not touch the second shipment
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalledWith({
                    parameters: {
                        basketId: 'test-basket-id',
                        shipmentId: 'second-shipment'
                    }
                })
            })
        })

        test('should handle mixed scenario with empty "me" and other empty shipments', async () => {
            const basketWithMixedEmptyShipments = {
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
                    },
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
                        itemId: 'pickup-item',
                        productId: 'pickup-product',
                        quantity: 1,
                        shipmentId: 'pickup-shipment',
                        inventoryId: 'inventory-1'
                    }
                ]
            }

            const {result} = renderHook(() => useMultiship(basketWithMixedEmptyShipments))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            await act(async () => {
                await result.current.removeEmptyShipments(mockDefaultInventoryId)
            })

            // Should consolidate pickup shipment into "me"
            expect(mockConfigureDefaultShipmentIfNeeded).toHaveBeenCalledWith(
                basketWithMixedEmptyShipments,
                'me',
                true,
                {id: 'store-1', inventoryId: 'inventory-1'}
            )
            expect(mockUpdateItemsInBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: [
                    {
                        itemId: 'pickup-item',
                        productId: 'pickup-product',
                        quantity: 1,
                        shipmentId: 'me',
                        inventoryId: 'inventory-1'
                    }
                ]
            })

            // Should remove all empty shipments including the consolidated one
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledTimes(3)
            expect(mockRemoveShipmentFromBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id',
                    shipmentId: 'pickup-shipment'
                }
            })
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

        test('should handle items without inventory ID', async () => {
            const itemsWithoutInventory = [
                {
                    itemId: 'item-1',
                    productId: 'product-1',
                    quantity: 1
                }
            ]
            const {result} = renderHook(() => useMultiship(mockBasket))

            const mockResponse = {basketId: 'test-basket-id'}
            mockUpdateItemsInBasket.mockResolvedValue(mockResponse)

            await act(async () => {
                const response = await result.current.moveItemsToDeliveryShipment(
                    itemsWithoutInventory,
                    'me',
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
                        quantity: 1,
                        shipmentId: 'me'
                    }
                ]
            })
        })

        test('should throw error if invalid basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await expect(
                    result.current.moveItemsToDeliveryShipment(
                        mockProductItems,
                        'me',
                        mockDefaultInventoryId
                    )
                ).rejects.toThrow('Invalid basket or product items array')
            })
        })

        test('should throw error if invalid product items array', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.moveItemsToDeliveryShipment(null, 'me', mockDefaultInventoryId)
                ).rejects.toThrow('Invalid basket or product items array')
            })
        })

        test('should throw error if empty product items array', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.moveItemsToDeliveryShipment([], 'me', mockDefaultInventoryId)
                ).rejects.toThrow('Invalid basket or product items array')
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
                expect(response).toEqual(new Error('API Error'))
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

        test('should throw error if invalid basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                await expect(
                    result.current.moveItemsToPickupShipment(
                        mockProductItems,
                        'pickup-shipment',
                        'inventory-1'
                    )
                ).rejects.toThrow('Invalid basket or product items array')
            })
        })

        test('should throw error if invalid product items array', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.moveItemsToPickupShipment(null, 'pickup-shipment', 'inventory-1')
                ).rejects.toThrow('Invalid basket or product items array')
            })
        })

        test('should throw error if empty product items array', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.moveItemsToPickupShipment([], 'pickup-shipment', 'inventory-1')
                ).rejects.toThrow('Invalid basket or product items array')
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
                expect(response).toEqual(new Error('API Error'))
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to move items to pickup shipment:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })
    })

    describe('findOrCreateDeliveryShipment', () => {
        test('should return existing delivery shipment', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(false)

            await act(async () => {
                const shipmentId = await result.current.findOrCreateDeliveryShipment()
                expect(shipmentId).toBe('me')
            })
        })

        test('should create new delivery shipment if none exists', async () => {
            const basketWithoutDeliveryShipment = {
                ...mockBasket,
                shipments: [
                    {
                        shipmentId: 'pickup-shipment',
                        shippingMethod: {id: 'pickup-shipping-method'},
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            const {result} = renderHook(() => useMultiship(basketWithoutDeliveryShipment))

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            const mockNewShipmentResponse = {
                shipments: [
                    {
                        shipmentId: 'new-delivery-shipment',
                        shippingMethod: {id: 'default-shipping-method'}
                    }
                ]
            }
            mockCreateShipmentForBasket.mockResolvedValue(mockNewShipmentResponse)

            await act(async () => {
                const shipmentId = await result.current.findOrCreateDeliveryShipment()
                expect(shipmentId).toBe('new-delivery-shipment')
            })
        })
    })

    describe('findOrCreatePickupShipment', () => {
        test('should return existing pickup shipment for store', async () => {
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

            await act(async () => {
                const shipmentId = await result.current.findOrCreatePickupShipment(mockStoreInfo)
                expect(shipmentId).toBe('pickup-shipment')
            })
        })

        test('should create new pickup shipment for store if none exists', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(false)

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

            mockIsCurrentShippingMethodPickup.mockImplementation((method) => {
                return method?.id === 'pickup-shipping-method'
            })

            await act(async () => {
                const shipmentId = await result.current.findOrCreatePickupShipment(mockStoreInfo)
                expect(shipmentId).toBe('new-pickup-shipment')
            })
        })

        test('should throw error if no store info provided', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(result.current.findOrCreatePickupShipment(null)).rejects.toThrow(
                    'No store selected for pickup'
                )
            })
        })

        test('should throw error if store has no id', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const storeWithoutId = {
                ...mockStoreInfo,
                id: null
            }

            await act(async () => {
                await expect(
                    result.current.findOrCreatePickupShipment(storeWithoutId)
                ).rejects.toThrow('No store selected for pickup')
            })
        })

        test('should throw error if store has no inventory ID', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            const storeWithoutInventory = {
                ...mockStoreInfo,
                inventoryId: null
            }

            await act(async () => {
                await expect(
                    result.current.findOrCreatePickupShipment(storeWithoutInventory)
                ).rejects.toThrow('Selected store does not have an inventory ID')
            })
        })

        test('should throw error if no pickup shipping method found', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockIsCurrentShippingMethodPickup.mockReturnValue(false)
            mockGetPickupShippingMethodId.mockReturnValue(null)

            await act(async () => {
                await expect(
                    result.current.findOrCreatePickupShipment(mockStoreInfo)
                ).rejects.toThrow('No pickup shipping method found')
            })
        })
    })

    describe('getShipmentForItems', () => {
        test('should return product items unchanged when no basket', async () => {
            const {result} = renderHook(() => useMultiship(null))

            await act(async () => {
                const response = await result.current.getShipmentForItems(false, mockStoreInfo)
                expect(response).toBe('me')
            })
        })

        test('should assign delivery shipment ID when pickup is not selected', async () => {
            const {result} = renderHook(() => useMultiship(mockBasketWithPickupShipment))

            await act(async () => {
                const response = await result.current.getShipmentForItems(false, mockStoreInfo)
                // Should return items with 'me' shipment ID since findOrCreateDeliveryShipment returns 'me'
                expect(response).toBe('me')
            })
        })

        test('should assign pickup shipment ID when pickup is selected', async () => {
            mockIsCurrentShippingMethodPickup.mockReturnValue(true)
            const {result} = renderHook(() => useMultiship(mockBasketWithPickupShipment))

            await act(async () => {
                const response = await result.current.getShipmentForItems(true, mockStoreInfo)
                // Should return items with pickup shipment ID since findOrCreatePickupShipment returns a valid shipment ID
                expect(response).toBe('pickup-shipment')
            })
        })
    })
})
