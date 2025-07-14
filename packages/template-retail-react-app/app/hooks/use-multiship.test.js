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

    // Mock functions for pickup shipment
    const mockIsCurrentShippingMethodPickup = jest.fn()
    const mockGetDefaultShippingMethodId = jest.fn()
    const mockGetPickupShippingMethodId = jest.fn()

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
            getPickupShippingMethodId: mockGetPickupShippingMethodId
        })

        // Default mock return values
        mockRefetchShippingMethods.mockResolvedValue({data: mockShippingMethods})
        mockGetDefaultShippingMethodId.mockReturnValue('default-shipping-method')
        mockGetPickupShippingMethodId.mockReturnValue('pickup-shipping-method')
        mockIsCurrentShippingMethodPickup.mockReturnValue(false)
    })

    describe('initialization', () => {
        test('should initialize with correct functions', () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            expect(result.current).toHaveProperty('assignDefaultShippingMethodsToShipments')
            expect(result.current).toHaveProperty('handleDeliveryOptionChange')
            expect(result.current).toHaveProperty('findExistingDeliveryShipment')
            expect(result.current).toHaveProperty('findExistingPickupShipment')
            expect(result.current).toHaveProperty('createNewDeliveryShipment')
            expect(result.current).toHaveProperty('createNewPickupShipment')
            expect(result.current).toHaveProperty('moveItemToDeliveryShipment')
            expect(result.current).toHaveProperty('moveItemToPickupShipment')
            expect(result.current).toHaveProperty('isCurrentShippingMethodPickup')
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
        test('should create new delivery shipment', async () => {
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
                const response = await result.current.createNewDeliveryShipment('test-basket-id')
                expect(response).toEqual(mockResponse)
            })

            expect(mockCreateShipmentForBasket).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'test-basket-id'
                },
                body: {}
            })
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
                    'test-basket-id',
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

        test('should throw error if no pickup shipping method found', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            mockGetPickupShippingMethodId.mockReturnValue(null)

            await act(async () => {
                await expect(
                    result.current.createNewPickupShipment('test-basket-id', mockStoreInfo)
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
                const response = await result.current.moveItemToDeliveryShipment(mockProductItem)
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
                    inventoryId: null
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
                    'delivery-shipment'
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
                    inventoryId: null
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
                    productItemWithoutInventory
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
                    result.current.moveItemToDeliveryShipment(mockProductItem)
                ).rejects.toThrow('Invalid basket or product item')
            })
        })

        test('should throw error if invalid product item', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(result.current.moveItemToDeliveryShipment(null)).rejects.toThrow(
                    'Invalid basket or product item'
                )
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
                    result.current.handleDeliveryOptionChange(mockProductItem, false, null)
                ).rejects.toThrow('Invalid basket or product item')
            })
        })

        test('should throw error if invalid product item', async () => {
            const {result} = renderHook(() => useMultiship(mockBasket))

            await act(async () => {
                await expect(
                    result.current.handleDeliveryOptionChange(null, false, null)
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
                    await result.current.handleDeliveryOptionChange(pickupProductItem, false, null)
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
                    await result.current.handleDeliveryOptionChange(pickupProductItem, false, null)
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
                        result.current.handleDeliveryOptionChange(pickupProductItem, false, null)
                    ).rejects.toThrow('Failed to create or find delivery shipment')
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
                    productItems: [mockProductItem]
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
                        }
                    ]
                }
                mockUpdateItemInBasket.mockResolvedValue(mockUpdatedBasket)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo
                    )
                })

                expect(mockUpdateItemInBasket).toHaveBeenCalled()
                // Should NOT remove 'me' shipment as it's the default shipment
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should create new pickup shipment and move item', async () => {
                const {result} = renderHook(() => useMultiship(mockBasket))

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
                    ...mockBasket,
                    productItems: [] // No remaining items in 'me' shipment
                }
                mockUpdateItemInBasket.mockResolvedValue(mockUpdatedBasket)

                await act(async () => {
                    await result.current.handleDeliveryOptionChange(
                        mockProductItem,
                        true,
                        mockStoreInfo
                    )
                })

                expect(mockCreateShipmentForBasket).toHaveBeenCalled()
                expect(mockUpdateItemInBasket).toHaveBeenCalled()
                // Should NOT remove 'me' shipment as it's the default shipment
                expect(mockRemoveShipmentFromBasket).not.toHaveBeenCalled()
            })

            test('should throw error if no store selected', async () => {
                const {result} = renderHook(() => useMultiship(mockBasket))

                mockIsCurrentShippingMethodPickup.mockReturnValue(false)

                await act(async () => {
                    await expect(
                        result.current.handleDeliveryOptionChange(mockProductItem, true, null)
                    ).rejects.toThrow('No store selected for pickup')
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
                            storeWithoutInventory
                        )
                    ).rejects.toThrow('Selected store does not have an inventory ID')
                })
            })

            test('should throw error if failed to create pickup shipment', async () => {
                const {result} = renderHook(() => useMultiship(mockBasket))

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
                            mockStoreInfo
                        )
                    ).rejects.toThrow('Failed to create or find pickup shipment')
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
                    mockStoreInfo
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
                    mockStoreInfo
                )
            })

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to remove empty source shipment custom-shipment:',
                expect.any(Error)
            )
            consoleErrorSpy.mockRestore()
        })
    })
})
