/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import usePickupShipment from '@salesforce/retail-react-app/app/hooks/use-pickup-shipment'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'

// Mock the dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutation: jest.fn(() => ({
        mutateAsync: jest.fn(),
        isLoading: false
    })),
    useShippingMethodsForShipment: jest.fn(() => ({
        refetch: jest.fn()
    }))
}))

// Use real localStorage for tests

describe('usePickupShipment', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Clear localStorage before each test
        localStorage.clear()
    })

    afterEach(() => {
        // Clean up localStorage after each test
        localStorage.clear()
    })

    test('hasPickupItems returns true when pickup items exist', () => {
        const {result} = renderHook(() => usePickupShipment())

        const productSelectionValues = [
            {
                variant: {productId: 'variant-1'},
                quantity: 1
            }
        ]
        const pickupInStoreMap = {'variant-1': true}
        const mainProduct = mockProductDetail

        const hasPickup = result.current.hasPickupItems(
            productSelectionValues,
            pickupInStoreMap,
            mainProduct
        )

        expect(hasPickup).toBe(true)
    })

    test('hasPickupItems returns false when no pickup items exist', () => {
        const {result} = renderHook(() => usePickupShipment())

        const productSelectionValues = [
            {
                variant: {productId: 'variant-1'},
                quantity: 1
            }
        ]
        const pickupInStoreMap = {} // No pickup items
        const mainProduct = mockProductDetail

        const hasPickup = result.current.hasPickupItems(
            productSelectionValues,
            pickupInStoreMap,
            mainProduct
        )

        expect(hasPickup).toBe(false)
    })

    test('addInventoryIdsToPickupItems adds inventory ID to pickup items', () => {
        const storeData = {inventoryId: 'store-123'}

        const {result} = renderHook(() => usePickupShipment())

        const productItems = [
            {productId: 'product-1', quantity: 1},
            {productId: 'product-2', quantity: 2}
        ]
        const pickupInStoreMap = {'product-1': true} // Only product-1 is pickup

        const updatedItems = result.current.addInventoryIdsToPickupItems(
            productItems,
            pickupInStoreMap,
            storeData
        )

        expect(updatedItems[0]).toEqual({
            productId: 'product-1',
            quantity: 1,
            inventoryId: 'store-123'
        })
        expect(updatedItems[1]).toEqual({
            productId: 'product-2',
            quantity: 2
        })
    })

    test('addInventoryIdsToPickupItems returns original items when no store info', () => {
        const {result} = renderHook(() => usePickupShipment())

        const productItems = [{productId: 'product-1', quantity: 1}]
        const pickupInStoreMap = {'product-1': true}

        const updatedItems = result.current.addInventoryIdsToPickupItems(
            productItems,
            pickupInStoreMap,
            null // No store info
        )

        expect(updatedItems).toEqual(productItems)
    })

    test('getPickupShippingMethodId returns pickup method ID when found', () => {
        const {result} = renderHook(() => usePickupShipment())

        const shippingMethods = {
            applicableShippingMethods: [
                {
                    id: 'standard-shipping',
                    c_storePickupEnabled: false
                },
                {
                    id: 'pickup-method-123',
                    c_storePickupEnabled: true
                },
                {
                    id: 'express-shipping',
                    c_storePickupEnabled: false
                }
            ]
        }

        const pickupMethodId = result.current.getPickupShippingMethodId(shippingMethods)

        expect(pickupMethodId).toBe('pickup-method-123')
    })

    test('getPickupShippingMethodId returns first pickup method when multiple exist', () => {
        const {result} = renderHook(() => usePickupShipment())

        const shippingMethods = {
            applicableShippingMethods: [
                {
                    id: 'pickup-method-1',
                    c_storePickupEnabled: true
                },
                {
                    id: 'pickup-method-2',
                    c_storePickupEnabled: true
                }
            ]
        }

        const pickupMethodId = result.current.getPickupShippingMethodId(shippingMethods)

        expect(pickupMethodId).toBe('pickup-method-1')
    })

    test('getPickupShippingMethodId returns null when no pickup method found', () => {
        const {result} = renderHook(() => usePickupShipment())

        const shippingMethods = {
            applicableShippingMethods: [
                {
                    id: 'standard-shipping',
                    c_storePickupEnabled: false
                },
                {
                    id: 'express-shipping'
                    // Missing c_storePickupEnabled property
                }
            ]
        }

        const pickupMethodId = result.current.getPickupShippingMethodId(shippingMethods)

        expect(pickupMethodId).toBeNull()
    })

    test('getPickupShippingMethodId returns null when shippingMethods is null', () => {
        const {result} = renderHook(() => usePickupShipment())

        const pickupMethodId = result.current.getPickupShippingMethodId(null)

        expect(pickupMethodId).toBeNull()
    })

    test('getPickupShippingMethodId returns null when shippingMethods is undefined', () => {
        const {result} = renderHook(() => usePickupShipment())

        const pickupMethodId = result.current.getPickupShippingMethodId(undefined)

        expect(pickupMethodId).toBeNull()
    })

    test('getPickupShippingMethodId returns null when applicableShippingMethods is missing', () => {
        const {result} = renderHook(() => usePickupShipment())

        const shippingMethods = {
            // Missing applicableShippingMethods property
        }

        const pickupMethodId = result.current.getPickupShippingMethodId(shippingMethods)

        expect(pickupMethodId).toBeNull()
    })

    test('getPickupShippingMethodId returns null when applicableShippingMethods is empty', () => {
        const {result} = renderHook(() => usePickupShipment())

        const shippingMethods = {
            applicableShippingMethods: []
        }

        const pickupMethodId = result.current.getPickupShippingMethodId(shippingMethods)

        expect(pickupMethodId).toBeNull()
    })

    test('getPickupShippingMethodId handles method without id property', () => {
        const {result} = renderHook(() => usePickupShipment())

        const shippingMethods = {
            applicableShippingMethods: [
                {
                    // Missing id property
                    c_storePickupEnabled: true
                }
            ]
        }

        const pickupMethodId = result.current.getPickupShippingMethodId(shippingMethods)

        expect(pickupMethodId).toBeNull()
    })

    test('hasPickupItems handles different product key combinations', () => {
        const {result} = renderHook(() => usePickupShipment())

        // Test with variant.productId
        const productSelectionValues1 = [
            {
                variant: {productId: 'variant-product-1'},
                quantity: 1
            }
        ]
        const pickupInStoreMap1 = {'variant-product-1': true}
        const mainProduct1 = mockProductDetail

        expect(
            result.current.hasPickupItems(productSelectionValues1, pickupInStoreMap1, mainProduct1)
        ).toBe(true)

        // Test with variant.id when productId is not available
        const productSelectionValues2 = [
            {
                variant: {id: 'variant-id-1'},
                quantity: 1
            }
        ]
        const pickupInStoreMap2 = {'variant-id-1': true}
        const mainProduct2 = mockProductDetail

        expect(
            result.current.hasPickupItems(productSelectionValues2, pickupInStoreMap2, mainProduct2)
        ).toBe(true)

        // Test with product.productId when variant is not available
        const productSelectionValues3 = [
            {
                product: {productId: 'product-id-1'},
                quantity: 1
            }
        ]
        const pickupInStoreMap3 = {'product-id-1': true}
        const mainProduct3 = mockProductDetail

        expect(
            result.current.hasPickupItems(productSelectionValues3, pickupInStoreMap3, mainProduct3)
        ).toBe(true)

        // Test with product.id when variant and productId are not available
        const productSelectionValues4 = [
            {
                product: {id: 'product-only-id-1'},
                quantity: 1
            }
        ]
        const pickupInStoreMap4 = {'product-only-id-1': true}
        const mainProduct4 = mockProductDetail

        expect(
            result.current.hasPickupItems(productSelectionValues4, pickupInStoreMap4, mainProduct4)
        ).toBe(true)

        // Test fallback to mainProduct.productId
        const productSelectionValues5 = [
            {
                // No variant or product
                quantity: 1
            }
        ]
        const pickupInStoreMap5 = {[mockProductDetail.id]: true} // Use mainProduct id
        const mainProduct5 = mockProductDetail

        expect(
            result.current.hasPickupItems(productSelectionValues5, pickupInStoreMap5, mainProduct5)
        ).toBe(true)

        // Test fallback to mainProduct.id when productId is not available
        const productSelectionValues6 = [
            {
                // No variant or product
                quantity: 1
            }
        ]
        const mainProduct6 = {id: 'main-product-only-id'} // Only has id, no productId
        const pickupInStoreMap6 = {[mainProduct6.id]: true}

        expect(
            result.current.hasPickupItems(productSelectionValues6, pickupInStoreMap6, mainProduct6)
        ).toBe(true)
    })

    test('addInventoryIdsToPickupItems handles different productId combinations', () => {
        const storeData = {inventoryId: 'store-123'}
        localStorage.setItem('store_test-site', JSON.stringify(storeData))

        const {result} = renderHook(() => usePickupShipment())

        // Test with productId
        const productItems1 = [{productId: 'product-1', quantity: 1}]
        const pickupInStoreMap1 = {'product-1': true}

        const updatedItems1 = result.current.addInventoryIdsToPickupItems(
            productItems1,
            pickupInStoreMap1,
            storeData
        )

        expect(updatedItems1[0]).toEqual({
            productId: 'product-1',
            quantity: 1,
            inventoryId: 'store-123'
        })

        // Test with id when productId is not available
        const productItems2 = [{id: 'item-id-1', quantity: 1}]
        const pickupInStoreMap2 = {'item-id-1': true}

        const updatedItems2 = result.current.addInventoryIdsToPickupItems(
            productItems2,
            pickupInStoreMap2,
            storeData
        )

        expect(updatedItems2[0]).toEqual({
            id: 'item-id-1',
            quantity: 1,
            inventoryId: 'store-123'
        })

        // Test mixed scenario - some items get inventory ID, others don't
        const productItems3 = [
            {productId: 'pickup-product', quantity: 1},
            {productId: 'shipping-product', quantity: 2}
        ]
        const pickupInStoreMap3 = {'pickup-product': true} // Only first item is pickup

        const updatedItems3 = result.current.addInventoryIdsToPickupItems(
            productItems3,
            pickupInStoreMap3,
            storeData
        )

        expect(updatedItems3[0]).toEqual({
            productId: 'pickup-product',
            quantity: 1,
            inventoryId: 'store-123'
        })
        expect(updatedItems3[1]).toEqual({
            productId: 'shipping-product',
            quantity: 2
        })
    })

    test('hasPickupItems returns false when no matches found in any branch', () => {
        const {result} = renderHook(() => usePickupShipment())

        const productSelectionValues = [
            {
                variant: {productId: 'variant-1'},
                quantity: 1
            }
        ]
        const pickupInStoreMap = {'different-product': true} // No match
        const mainProduct = mockProductDetail

        const hasPickup = result.current.hasPickupItems(
            productSelectionValues,
            pickupInStoreMap,
            mainProduct
        )

        expect(hasPickup).toBe(false)
    })

    describe('updatePickupShipment', () => {
        let mockMutateAsync

        beforeEach(() => {
            mockMutateAsync = jest.fn().mockResolvedValue({})
            jest.clearAllMocks()

            // Get the mocked module and update the mock to include mutateAsync
            const commerceSdkMock = jest.requireMock('@salesforce/commerce-sdk-react')
            commerceSdkMock.useShopperBasketsMutation.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isLoading: false
            })
        })

        test('configures pickup shipment successfully', async () => {
            const storeData = {inventoryId: 'store-123', id: 'store-id-456'}

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'

            await result.current.updatePickupShipment(basketId, storeData)

            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: '005' // Default pickup shipping method ID
                    },
                    c_fromStoreId: 'store-id-456',
                    shippingAddress: {}
                }
            })
        })

        test('uses custom pickupShippingMethodId when provided', async () => {
            const storeData = {inventoryId: 'store-123', id: 'store-id-456'}

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const options = {pickupShippingMethodId: 'custom-pickup-method'}

            await result.current.updatePickupShipment(basketId, storeData, options)

            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: 'custom-pickup-method'
                    },
                    c_fromStoreId: 'store-id-456',
                    shippingAddress: {}
                }
            })
        })

        test('returns early when store info is invalid and throwOnError is false', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'

            await result.current.updatePickupShipment(basketId, null) // Invalid store info

            expect(mockMutateAsync).not.toHaveBeenCalled()
        })

        test('throws error when store info is invalid and throwOnError is true', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const options = {throwOnError: true}

            await expect(
                result.current.updatePickupShipment(basketId, null, options) // Invalid store info
            ).rejects.toThrow('Failed to retrieve store information')
        })

        test('returns early when no store info exists and throwOnError is false', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'

            await result.current.updatePickupShipment(basketId, null)

            expect(mockMutateAsync).not.toHaveBeenCalled()
        })

        test('throws error when no store info exists and throwOnError is true', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const options = {throwOnError: true}

            await expect(
                result.current.updatePickupShipment(basketId, null, options)
            ).rejects.toThrow('Failed to retrieve store information')
        })

        test('returns early when store info missing inventoryId and throwOnError is false', async () => {
            const storeData = {id: 'store-id-456'} // Missing inventoryId

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'

            await result.current.updatePickupShipment(basketId, storeData)

            expect(mockMutateAsync).not.toHaveBeenCalled()
        })

        test('throws error when store info missing inventoryId and throwOnError is true', async () => {
            const storeData = {id: 'store-id-456'} // Missing inventoryId

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const options = {throwOnError: true}

            await expect(
                result.current.updatePickupShipment(basketId, storeData, options)
            ).rejects.toThrow('No store inventory ID found')
        })

        test('logs warning when mutation fails and throwOnError is false', async () => {
            const storeData = {inventoryId: 'store-123', id: 'store-id-456'}

            const mutationError = new Error('Mutation failed')
            mockMutateAsync.mockRejectedValue(mutationError)

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'

            await result.current.updatePickupShipment(basketId, storeData)

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to configure pickup shipment:',
                mutationError
            )

            consoleSpy.mockRestore()
        })

        test('throws error when mutation fails and throwOnError is true', async () => {
            const storeData = {inventoryId: 'store-123', id: 'store-id-456'}
            localStorage.setItem('store_test-site', JSON.stringify(storeData))

            const mutationError = new Error('Mutation failed')
            mockMutateAsync.mockRejectedValue(mutationError)

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const options = {throwOnError: true}

            await expect(
                result.current.updatePickupShipment(basketId, storeData, options)
            ).rejects.toThrow('Mutation failed')
        })
    })

    describe('configureDefaultShipmentIfNeeded', () => {
        let mockMutateAsync
        let mockRefetchShippingMethods

        beforeEach(() => {
            mockMutateAsync = jest.fn().mockResolvedValue({})
            mockRefetchShippingMethods = jest.fn().mockResolvedValue({
                data: {
                    applicableShippingMethods: [
                        {
                            id: 'standard-shipping'
                        },
                        {
                            id: 'pickup-method-123',
                            c_storePickupEnabled: true
                        }
                    ],
                    defaultShippingMethodId: 'standard-shipping'
                }
            })

            jest.clearAllMocks()

            // Get the mocked module and update the mock to include mutateAsync and refetch
            const commerceSdkMock = jest.requireMock('@salesforce/commerce-sdk-react')
            commerceSdkMock.useShopperBasketsMutation.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isLoading: false
            })
            commerceSdkMock.useShippingMethodsForShipment.mockReturnValue({
                refetch: mockRefetchShippingMethods
            })
        })

        test('configures pickup shipment when pickup selected but current method is not pickup', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketResponse = {
                basketId: 'basket-123',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {
                            id: 'standard-shipping'
                        }
                    }
                ]
            }
            const targetShipmentId = 'me'
            const hasAnyPickupSelected = true
            const selectedStore = {id: 'store-1', inventoryId: 'inv-1'}

            await result.current.configureDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

            // Should fetch shipping methods
            expect(mockRefetchShippingMethods).toHaveBeenCalled()

            // Should configure pickup shipment (single call with shipping address cleared)
            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: 'pickup-method-123'
                    },
                    c_fromStoreId: 'store-1',
                    shippingAddress: {}
                }
            })
        })

        test('configures regular shipping when pickup not selected but current method is pickup', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketResponse = {
                basketId: 'basket-123',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {
                            id: 'pickup-method-123',
                            c_storePickupEnabled: true
                        }
                    }
                ]
            }
            const targetShipmentId = 'me'
            const hasAnyPickupSelected = false
            const selectedStore = {id: 'store-1', inventoryId: 'inv-1'}

            await result.current.configureDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

            // Should fetch shipping methods
            expect(mockRefetchShippingMethods).toHaveBeenCalled()

            // Should configure regular shipping method (single call with shipping address cleared)
            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: 'standard-shipping'
                    },
                    c_fromStoreId: null,
                    shippingAddress: {}
                }
            })
        })

        test('does not configure shipping when targetShipmentId is not default shipment', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketResponse = {
                basketId: 'basket-123',
                shipments: [
                    {
                        shipmentId: 'custom-shipment-456',
                        shippingMethod: {
                            id: 'standard-shipping',
                            c_storePickupEnabled: false
                        }
                    }
                ]
            }
            const targetShipmentId = 'custom-shipment-456'
            const hasAnyPickupSelected = true
            const selectedStore = {id: 'store-1', inventoryId: 'inv-1'}

            await result.current.configureDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

            // Should not make any API calls since it returns early
            expect(mockMutateAsync).not.toHaveBeenCalled()
            expect(mockRefetchShippingMethods).not.toHaveBeenCalled()
        })

        test('does not configure shipping when pickup selection matches current method', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketResponse = {
                basketId: 'basket-123',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {
                            id: 'pickup-method-123',
                            c_storePickupEnabled: true
                        },
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            const targetShipmentId = 'me'
            const hasAnyPickupSelected = true // Pickup selected and current method is pickup
            const selectedStore = {id: 'store-1', inventoryId: 'inv-1'}

            await result.current.configureDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

            expect(mockMutateAsync).not.toHaveBeenCalled()
            expect(mockRefetchShippingMethods).not.toHaveBeenCalled()
        })

        test('does not configure shipping when no pickup selected and current method is not pickup', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketResponse = {
                basketId: 'basket-123',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {
                            id: 'standard-shipping',
                            c_storePickupEnabled: false
                        },
                        c_fromStoreId: null
                    }
                ]
            }
            const targetShipmentId = 'me'
            const hasAnyPickupSelected = false // No pickup selected and current method is not pickup
            const selectedStore = {id: 'store-1', inventoryId: 'inv-1'}

            await result.current.configureDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

            expect(mockMutateAsync).not.toHaveBeenCalled()
            expect(mockRefetchShippingMethods).not.toHaveBeenCalled()
        })

        test('configures pickup shipment when store is different', async () => {
            const {result} = renderHook(() => usePickupShipment())
            const basketResponse = {
                basketId: 'basket-123',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {
                            id: 'pickup-method-123',
                            c_storePickupEnabled: true
                        },
                        c_fromStoreId: 'store-1'
                    }
                ]
            }
            const targetShipmentId = 'me'
            const hasAnyPickupSelected = true
            const selectedStore = {id: 'store-2', inventoryId: 'inv-2'}
            await result.current.configureDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )
            // Should fetch shipping methods
            expect(mockRefetchShippingMethods).toHaveBeenCalled()
            // Should configure pickup shipment with the new store
            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: 'pickup-method-123'
                    },
                    c_fromStoreId: 'store-2',
                    shippingAddress: {}
                }
            })
        })

        test('handles case when no pickup shipping method is found', async () => {
            mockRefetchShippingMethods.mockResolvedValue({
                data: {
                    applicableShippingMethods: [
                        {
                            id: 'standard-shipping',
                            c_storePickupEnabled: false
                        }
                    ],
                    defaultShippingMethodId: 'standard-shipping'
                }
            })

            const {result} = renderHook(() => usePickupShipment())

            const basketResponse = {
                basketId: 'basket-123',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {
                            id: 'standard-shipping',
                            c_storePickupEnabled: false
                        }
                    }
                ]
            }
            const targetShipmentId = 'me'
            const hasAnyPickupSelected = true
            const selectedStore = {id: 'store-1', inventoryId: 'inv-1'}

            await result.current.configureDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

            // Should fetch methods and configure pickup with null shipping method ID (which will use default)
            expect(mockRefetchShippingMethods).toHaveBeenCalled()

            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: null
                    },
                    c_fromStoreId: 'store-1',
                    shippingAddress: {}
                }
            })
        })

        test('handles case when no default shipping method is found', async () => {
            mockRefetchShippingMethods.mockResolvedValue({
                data: {
                    applicableShippingMethods: [
                        {
                            id: 'pickup-method-123',
                            c_storePickupEnabled: true
                        }
                    ]
                    // No defaultShippingMethodId
                }
            })

            const {result} = renderHook(() => usePickupShipment())

            const basketResponse = {
                basketId: 'basket-123',
                shipments: [
                    {
                        shipmentId: 'me',
                        shippingMethod: {
                            id: 'pickup-method-123',
                            c_storePickupEnabled: true
                        }
                    }
                ]
            }
            const targetShipmentId = 'me'
            const hasAnyPickupSelected = false
            const selectedStore = {id: 'store-1', inventoryId: 'inv-1'}

            await result.current.configureDefaultShipmentIfNeeded(
                basketResponse,
                targetShipmentId,
                hasAnyPickupSelected,
                selectedStore
            )

            // Should configure regular shipping with null shipping method ID
            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: null
                    },
                    c_fromStoreId: null,
                    shippingAddress: {}
                }
            })
        })
    })

    describe('updateDeliveryShipment', () => {
        let mockMutateAsync

        beforeEach(() => {
            mockMutateAsync = jest.fn().mockResolvedValue({})
            jest.clearAllMocks()

            // Get the mocked module and update the mock to include mutateAsync
            const commerceSdkMock = jest.requireMock('@salesforce/commerce-sdk-react')
            commerceSdkMock.useShopperBasketsMutation.mockReturnValue({
                mutateAsync: mockMutateAsync,
                isLoading: false
            })
        })

        test('configures regular shipping method successfully', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const shippingMethodId = 'standard-shipping'

            await result.current.updateDeliveryShipment(basketId, shippingMethodId)

            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: 'standard-shipping'
                    },
                    c_fromStoreId: null,
                    shippingAddress: {}
                }
            })
        })

        test('logs warning when mutation fails and throwOnError is false', async () => {
            const mutationError = new Error('Regular shipping mutation failed')
            mockMutateAsync.mockRejectedValue(mutationError)

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const shippingMethodId = 'standard-shipping'

            await result.current.updateDeliveryShipment(basketId, shippingMethodId)

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to configure regular shipping method:',
                mutationError
            )

            consoleSpy.mockRestore()
        })

        test('throws error when mutation fails and throwOnError is true', async () => {
            const mutationError = new Error('Regular shipping mutation failed')
            mockMutateAsync.mockRejectedValue(mutationError)

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const shippingMethodId = 'standard-shipping'
            const throwOnError = true

            await expect(
                result.current.updateDeliveryShipment(basketId, shippingMethodId, throwOnError)
            ).rejects.toThrow('Regular shipping mutation failed')
        })
    })

    describe('getDefaultShippingMethodId', () => {
        test('returns default shipping method ID when found', () => {
            const {result} = renderHook(() => usePickupShipment())

            const shippingMethods = {
                defaultShippingMethodId: 'standard-shipping'
            }

            const defaultMethodId = result.current.getDefaultShippingMethodId(shippingMethods)

            expect(defaultMethodId).toBe('standard-shipping')
        })

        test('returns null when defaultShippingMethodId is missing', () => {
            const {result} = renderHook(() => usePickupShipment())

            const shippingMethods = {}

            const defaultMethodId = result.current.getDefaultShippingMethodId(shippingMethods)

            expect(defaultMethodId).toBeNull()
        })

        test('returns null when shippingMethods is null', () => {
            const {result} = renderHook(() => usePickupShipment())

            const defaultMethodId = result.current.getDefaultShippingMethodId(null)

            expect(defaultMethodId).toBeNull()
        })
    })

    describe('isCurrentShippingMethodPickup', () => {
        test('returns true when shipping method has c_storePickupEnabled = true', () => {
            const {result} = renderHook(() => usePickupShipment())

            const shippingMethod = {
                id: 'pickup-method',
                c_storePickupEnabled: true
            }

            const isPickup = result.current.isCurrentShippingMethodPickup(shippingMethod)

            expect(isPickup).toBe(true)
        })

        test('returns false when shipping method has c_storePickupEnabled = false', () => {
            const {result} = renderHook(() => usePickupShipment())

            const shippingMethod = {
                id: 'standard-shipping',
                c_storePickupEnabled: false
            }

            const isPickup = result.current.isCurrentShippingMethodPickup(shippingMethod)

            expect(isPickup).toBe(false)
        })

        test('returns false when shipping method has no c_storePickupEnabled property', () => {
            const {result} = renderHook(() => usePickupShipment())

            const shippingMethod = {
                id: 'standard-shipping'
            }

            const isPickup = result.current.isCurrentShippingMethodPickup(shippingMethod)

            expect(isPickup).toBe(false)
        })

        test('returns false when shipping method is null', () => {
            const {result} = renderHook(() => usePickupShipment())

            const isPickup = result.current.isCurrentShippingMethodPickup(null)

            expect(isPickup).toBe(false)
        })
    })

    describe('hook initialization with basket parameter', () => {
        test('initializes hook with basket parameter', () => {
            const basket = {
                basketId: 'test-basket-123'
            }

            const {result} = renderHook(() => usePickupShipment(basket))

            // Verify that all expected functions are returned
            expect(result.current.updatePickupShipment).toBeDefined()
            expect(result.current.updateDeliveryShipment).toBeDefined()
            expect(result.current.configureDefaultShipmentIfNeeded).toBeDefined()
            expect(result.current.hasPickupItems).toBeDefined()
            expect(result.current.addInventoryIdsToPickupItems).toBeDefined()
            expect(result.current.getPickupShippingMethodId).toBeDefined()
            expect(result.current.getDefaultShippingMethodId).toBeDefined()
            expect(result.current.isCurrentShippingMethodPickup).toBeDefined()
            expect(result.current.updateShipmentForBasketMutation).toBeDefined()
        })

        test('initializes hook without basket parameter', () => {
            const {result} = renderHook(() => usePickupShipment())

            // Verify that all expected functions are returned
            expect(result.current.updatePickupShipment).toBeDefined()
            expect(result.current.updateDeliveryShipment).toBeDefined()
            expect(result.current.configureDefaultShipmentIfNeeded).toBeDefined()
            expect(result.current.hasPickupItems).toBeDefined()
            expect(result.current.addInventoryIdsToPickupItems).toBeDefined()
            expect(result.current.getPickupShippingMethodId).toBeDefined()
            expect(result.current.getDefaultShippingMethodId).toBeDefined()
            expect(result.current.isCurrentShippingMethodPickup).toBeDefined()
            expect(result.current.updateShipmentForBasketMutation).toBeDefined()
        })
    })
})
