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
    }))
}))

jest.mock('./use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {id: 'test-site'}
    })
}))

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
}
Object.defineProperty(window, 'localStorage', {value: localStorageMock})

describe('usePickupShipment', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        localStorageMock.getItem.mockClear()
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

    test('getStoreInfo returns parsed store data from localStorage', () => {
        const storeData = {inventoryId: 'store-123', name: 'Test Store'}
        localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

        const {result} = renderHook(() => usePickupShipment())

        const storeInfo = result.current.getStoreInfo()

        expect(localStorageMock.getItem).toHaveBeenCalledWith('store_test-site')
        expect(storeInfo).toEqual(storeData)
    })

    test('getStoreInfo returns null when localStorage throws error', () => {
        localStorageMock.getItem.mockImplementation(() => {
            throw new Error('localStorage error')
        })

        const {result} = renderHook(() => usePickupShipment())

        const storeInfo = result.current.getStoreInfo()

        expect(storeInfo).toBeNull()
    })

    test('addInventoryIdsToPickupItems adds inventory ID to pickup items', () => {
        const storeData = {inventoryId: 'store-123'}
        localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

        const {result} = renderHook(() => usePickupShipment())

        const productItems = [
            {productId: 'product-1', quantity: 1},
            {productId: 'product-2', quantity: 2}
        ]
        const pickupInStoreMap = {'product-1': true} // Only product-1 is pickup

        const updatedItems = result.current.addInventoryIdsToPickupItems(
            productItems,
            pickupInStoreMap
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
        localStorageMock.getItem.mockReturnValue(null)

        const {result} = renderHook(() => usePickupShipment())

        const productItems = [{productId: 'product-1', quantity: 1}]
        const pickupInStoreMap = {'product-1': true}

        const updatedItems = result.current.addInventoryIdsToPickupItems(
            productItems,
            pickupInStoreMap
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
        localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

        const {result} = renderHook(() => usePickupShipment())

        // Test with productId
        const productItems1 = [{productId: 'product-1', quantity: 1}]
        const pickupInStoreMap1 = {'product-1': true}

        const updatedItems1 = result.current.addInventoryIdsToPickupItems(
            productItems1,
            pickupInStoreMap1
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
            pickupInStoreMap2
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
            pickupInStoreMap3
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

    describe('configurePickupShipment', () => {
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

        test('configures pickup shipment successfully with pickup items', async () => {
            const storeData = {inventoryId: 'store-123', id: 'store-id-456'}
            localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [
                {productId: 'product-1', inventoryId: 'store-123', quantity: 1},
                {productId: 'product-2', quantity: 2} // No inventoryId, not a pickup item
            ]

            await result.current.configurePickupShipment(basketId, productItems)

            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: '005' // Default pickup shipping method ID
                    },
                    c_fromStoreId: 'store-id-456'
                }
            })
        })

        test('uses custom pickupShippingMethodId when provided', async () => {
            const storeData = {inventoryId: 'store-123', id: 'store-id-456'}
            localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]
            const options = {pickupShippingMethodId: 'custom-pickup-method'}

            await result.current.configurePickupShipment(basketId, productItems, options)

            expect(mockMutateAsync).toHaveBeenCalledWith({
                parameters: {
                    basketId: 'basket-123',
                    shipmentId: 'me'
                },
                body: {
                    shippingMethod: {
                        id: 'custom-pickup-method'
                    },
                    c_fromStoreId: 'store-id-456'
                }
            })
        })

        test('returns early when no pickup items exist', async () => {
            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [
                {productId: 'product-1', quantity: 1}, // No inventoryId
                {productId: 'product-2', quantity: 2} // No inventoryId
            ]

            await result.current.configurePickupShipment(basketId, productItems)

            expect(mockMutateAsync).not.toHaveBeenCalled()
            expect(localStorageMock.getItem).not.toHaveBeenCalled()
        })

        test('returns early when localStorage throws error and throwOnError is false', async () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage error')
            })

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]

            await result.current.configurePickupShipment(basketId, productItems)

            expect(mockMutateAsync).not.toHaveBeenCalled()
        })

        test('throws error when localStorage throws error and throwOnError is true', async () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage error')
            })

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]
            const options = {throwOnError: true}

            await expect(
                result.current.configurePickupShipment(basketId, productItems, options)
            ).rejects.toThrow('Failed to retrieve store information')
        })

        test('returns early when no store info exists and throwOnError is false', async () => {
            localStorageMock.getItem.mockReturnValue(null)

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]

            await result.current.configurePickupShipment(basketId, productItems)

            expect(mockMutateAsync).not.toHaveBeenCalled()
        })

        test('throws error when no store info exists and throwOnError is true', async () => {
            localStorageMock.getItem.mockReturnValue(null)

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]
            const options = {throwOnError: true}

            await expect(
                result.current.configurePickupShipment(basketId, productItems, options)
            ).rejects.toThrow('No store inventory ID found')
        })

        test('returns early when store info missing inventoryId and throwOnError is false', async () => {
            const storeData = {id: 'store-id-456'} // Missing inventoryId
            localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]

            await result.current.configurePickupShipment(basketId, productItems)

            expect(mockMutateAsync).not.toHaveBeenCalled()
        })

        test('throws error when store info missing inventoryId and throwOnError is true', async () => {
            const storeData = {id: 'store-id-456'} // Missing inventoryId
            localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]
            const options = {throwOnError: true}

            await expect(
                result.current.configurePickupShipment(basketId, productItems, options)
            ).rejects.toThrow('No store inventory ID found')
        })

        test('logs warning when mutation fails and throwOnError is false', async () => {
            const storeData = {inventoryId: 'store-123', id: 'store-id-456'}
            localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

            const mutationError = new Error('Mutation failed')
            mockMutateAsync.mockRejectedValue(mutationError)

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]

            await result.current.configurePickupShipment(basketId, productItems)

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to configure pickup shipment:',
                mutationError
            )

            consoleSpy.mockRestore()
        })

        test('throws error when mutation fails and throwOnError is true', async () => {
            const storeData = {inventoryId: 'store-123', id: 'store-id-456'}
            localStorageMock.getItem.mockReturnValue(JSON.stringify(storeData))

            const mutationError = new Error('Mutation failed')
            mockMutateAsync.mockRejectedValue(mutationError)

            const {result} = renderHook(() => usePickupShipment())

            const basketId = 'basket-123'
            const productItems = [{productId: 'product-1', inventoryId: 'store-123', quantity: 1}]
            const options = {throwOnError: true}

            await expect(
                result.current.configurePickupShipment(basketId, productItems, options)
            ).rejects.toThrow('Mutation failed')
        })
    })
})
