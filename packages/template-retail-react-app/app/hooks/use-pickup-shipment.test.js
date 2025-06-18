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
})
