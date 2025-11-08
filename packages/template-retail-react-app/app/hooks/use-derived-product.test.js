/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

import {screen} from '@testing-library/react'
import {useDerivedProduct} from '@salesforce/retail-react-app/app/hooks/use-derived-product'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useVariant} from '@salesforce/retail-react-app/app/hooks/use-variant'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'

// Mock the useVariant hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-variant', () => ({
    useVariant: jest.fn()
}))

// Mock the useSelectedStore hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-selected-store', () => ({
    useSelectedStore: jest.fn()
}))

// Ensure useMultiSite returns site.id = 'site-1' for all tests
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {id: 'site-1'},
        buildUrl: (url) => url // identity function for tests
    })
}))

const MockComponent = ({product, pickupInStore = false}) => {
    const {
        inventoryMessage,
        showInventoryMessage,
        quantity,
        variationParams,
        variant,
        isSelectedStoreOutOfStock,
        selectedStore
    } = useDerivedProduct(product, false, false, pickupInStore)

    return (
        <div>
            <div>{`Quantity: ${quantity}`}</div>
            <div>
                {showInventoryMessage} ? {inventoryMessage} :{' '}
            </div>
            <div>{JSON.stringify(variant)}</div>
            <div>{JSON.stringify(variationParams)}</div>
            <div>{`isStoreOutOfStock: ${isSelectedStoreOutOfStock}`}</div>
            <div>{JSON.stringify(selectedStore)}</div>
        </div>
    )
}

MockComponent.propTypes = {
    product: PropTypes.object,
    pickupInStore: PropTypes.bool
}

describe('useDerivedProduct hook', () => {
    beforeEach(() => {
        // Reset mock before each test
        jest.clearAllMocks()

        // Default mock for useSelectedStore - no store selected
        useSelectedStore.mockReturnValue({
            selectedStore: null,
            isLoading: false,
            error: null,
            hasSelectedStore: false
        })
    })

    test('should not show out of stock message when stockLevel is greater then 0 and greater then asked quantity', () => {
        // Mock useVariant to return a valid variant
        useVariant.mockReturnValue({
            orderable: true,
            price: 299.99,
            productId: '750518699578M',
            variationValues: {color: 'BLACKFB', size: '038', width: 'V'}
        })

        renderWithProviders(<MockComponent product={mockProductDetail} />)

        expect(screen.getByText(/Quantity: 1/)).toBeInTheDocument()
        expect(
            screen.getByText(
                /{"orderable":true,"price":299.99,"productId":"750518699578M","variationValues":{"color":"BLACKFB","size":"038","width":"V"}}/
            )
        ).toBeInTheDocument()
    })

    test('should show out of stock message when stockLevel is 0', () => {
        // Mock useVariant to return a valid variant
        useVariant.mockReturnValue({
            orderable: true,
            price: 299.99,
            productId: '750518699578M',
            variationValues: {color: 'BLACKFB', size: '038', width: 'V'}
        })

        const mockData = {
            ...mockProductDetail,
            inventory: {
                ats: 0,
                backorderable: false,
                id: 'inventory_m',
                orderable: false,
                preorderable: false,
                stockLevel: 0
            }
        }

        renderWithProviders(<MockComponent product={mockData} />)

        expect(screen.getByText(/Out of stock/)).toBeInTheDocument()
    })

    test('should show unfulfillable messsage when stockLevel is less then asked quantity', () => {
        // Mock useVariant to return a valid variant
        useVariant.mockReturnValue({
            orderable: true,
            price: 299.99,
            productId: '750518699578M',
            variationValues: {color: 'BLACKFB', size: '038', width: 'V'}
        })

        const mockData = {
            ...mockProductDetail,
            quantity: 10,
            inventory: {
                ats: 0,
                backorderable: false,
                id: 'inventory_m',
                orderable: false,
                preorderable: false,
                stockLevel: 5
            }
        }

        renderWithProviders(<MockComponent product={mockData} />)

        expect(screen.getByText(/Only 5 left!/)).toBeInTheDocument()
    })

    test('should show of stock message for bundle products', () => {
        // Mock useVariant to return null for bundle products (bundles don't have variants)
        useVariant.mockReturnValue(null)

        const mockBundleData = {
            ...mockProductDetail,
            type: {
                bundle: true
            },
            inventory: {
                ats: 10,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 10
            }
        }

        renderWithProviders(<MockComponent product={mockBundleData} />)

        // Bundle products should not show out of stock message when inventory is available
        expect(screen.queryByText(/Out of stock/)).not.toBeInTheDocument()
    })

    test('should show unfulfillable message for bundle products', () => {
        // Mock useVariant to return null for bundle products (bundles don't have variants)
        useVariant.mockReturnValue(null)

        const mockBundleData = {
            ...mockProductDetail,
            type: {
                bundle: true
            },
            quantity: 15,
            inventory: {
                ats: 5,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 5
            }
        }

        renderWithProviders(<MockComponent product={mockBundleData} />)

        expect(screen.getByText(/Only 5 left!/)).toBeInTheDocument()
    })

    test('for standard product, inventory message should be shown when product out of stock', () => {
        const product = {
            id: 'new-standard-product',
            inventory: {
                ats: 0,
                backorderable: false,
                id: 'inventory_m',
                orderable: false,
                preorderable: false,
                stockLevel: 0
            },
            minOrderQuantity: 1,
            name: 'Standard Collar Shirt',
            stepQuantity: 1,
            type: {item: true}
        }
        renderWithProviders(<MockComponent product={product} />)
        expect(screen.getByText(/Out of stock/i)).toBeInTheDocument()
    })

    test('for standard product, inventory message should NOT be shown when product in stock', () => {
        const product = {
            id: 'new-standard-product',
            inventory: {
                ats: 10,
                backorderable: false,
                id: 'inventory_m',
                orderable: true,
                preorderable: false,
                stockLevel: 10
            },
            minOrderQuantity: 1,
            name: 'Standard Collar Shirt',
            stepQuantity: 1,
            type: {item: true}
        }
        renderWithProviders(<MockComponent product={product} />)
        expect(screen.queryByText(/Out of stock/i)).not.toBeInTheDocument()
    })

    describe('when store is selected', () => {
        const inventoryId = 'inventory_m_store_store1'
        test('when store is selected, should return product is in stock when storestockLevel is greater then 0 and greater then asked quantity', () => {
            // Mock useSelectedStore to return a store with inventoryId
            useSelectedStore.mockReturnValue({
                selectedStore: {inventoryId},
                isLoading: false,
                error: null,
                hasSelectedStore: true
            })

            // Mock useVariant to return a valid variant
            useVariant.mockReturnValue({
                orderable: true,
                price: 299.99,
                productId: '750518699578M',
                variationValues: {color: 'BLACKFB', size: '038', width: 'V'}
            })

            const mockData = {
                ...mockProductDetail,
                quantity: 10,
                inventories: [
                    {
                        ats: 0,
                        backorderable: false,
                        id: 'inventory_m_store_store1',
                        orderable: true,
                        preorderable: false,
                        stockLevel: 15
                    }
                ]
            }

            renderWithProviders(<MockComponent product={mockData} />)

            expect(screen.getByText(/isStoreOutOfStock: false/)).toBeInTheDocument()
        })

        test('when store is selected, should return product is out of stock message when storestockLevel is 0 or less then asked quantity', () => {
            // Mock useSelectedStore to return a store with inventoryId
            useSelectedStore.mockReturnValue({
                selectedStore: {inventoryId},
                isLoading: false,
                error: null,
                hasSelectedStore: true
            })

            // Mock useVariant to return a valid variant
            useVariant.mockReturnValue({
                orderable: true,
                price: 299.99,
                productId: '750518699578M',
                variationValues: {color: 'BLACKFB', size: '038', width: 'V'}
            })

            const mockData = {
                ...mockProductDetail,
                quantity: 10,
                inventories: [
                    {
                        ats: 0,
                        backorderable: false,
                        id: 'inventory_m_store_store1',
                        orderable: true,
                        preorderable: false,
                        stockLevel: 5
                    }
                ]
            }

            renderWithProviders(<MockComponent product={mockData} />)

            expect(screen.getByText(/isStoreOutOfStock: true/)).toBeInTheDocument()
        })

        test('when store is selected, should show selected store info', () => {
            // Mock useSelectedStore to return a store with inventoryId
            useSelectedStore.mockReturnValue({
                selectedStore: {inventoryId},
                isLoading: false,
                error: null,
                hasSelectedStore: true
            })

            // Mock useVariant to return a valid variant
            useVariant.mockReturnValue({
                orderable: true,
                price: 299.99,
                productId: '750518699578M',
                variationValues: {color: 'BLACKFB', size: '038', width: 'V'}
            })

            const mockData = {
                ...mockProductDetail,
                quantity: 10,
                inventories: [
                    {
                        ats: 0,
                        backorderable: false,
                        id: 'inventory_m_store_store1',
                        orderable: false,
                        preorderable: false,
                        stockLevel: 5
                    }
                ]
            }

            renderWithProviders(<MockComponent product={mockData} />)

            expect(
                screen.getByText(/{"inventoryId":"inventory_m_store_store1"}/)
            ).toBeInTheDocument()
        })

        test('when pickupInStore is true and store has no stock, should show out of stock message', () => {
            // Mock useSelectedStore to return a store with inventoryId
            useSelectedStore.mockReturnValue({
                selectedStore: {inventoryId},
                isLoading: false,
                error: null,
                hasSelectedStore: true
            })

            // Mock useVariant to return a valid variant
            useVariant.mockReturnValue({
                orderable: true,
                price: 299.99,
                productId: '750518699578M',
                variationValues: {color: 'BLACKFB', size: '038', width: 'V'}
            })

            const mockData = {
                ...mockProductDetail,
                quantity: 10,
                // Default inventory has plenty of stock
                inventory: {
                    ats: 50,
                    backorderable: false,
                    id: 'inventory_m',
                    orderable: true,
                    preorderable: false,
                    stockLevel: 50
                },
                // Store inventory has no stock
                inventories: [
                    {
                        ats: 5,
                        backorderable: false,
                        id: 'inventory_m_store_store1',
                        orderable: true,
                        preorderable: false,
                        stockLevel: 0
                    }
                ]
            }

            renderWithProviders(<MockComponent product={mockData} pickupInStore={true} />)

            // Should show out of stock message based on store inventory stock level being 0
            expect(screen.getByText(/Out of stock/)).toBeInTheDocument()
            expect(screen.getByText(/isStoreOutOfStock: true/)).toBeInTheDocument()
        })

        test('when pickupInStore is true and store has limited stock, should show unfulfillable message', () => {
            // Mock useSelectedStore to return a store with inventoryId
            useSelectedStore.mockReturnValue({
                selectedStore: {inventoryId},
                isLoading: false,
                error: null,
                hasSelectedStore: true
            })

            useVariant.mockReturnValue(null)

            const mockData = {
                ...mockProductDetail,
                type: {
                    bundle: true
                },
                quantity: 10,
                // Default inventory has plenty of stock
                inventory: {
                    ats: 50,
                    backorderable: false,
                    id: 'inventory_m',
                    orderable: true,
                    preorderable: false,
                    stockLevel: 50
                },
                // Store inventory has limited stock but is orderable
                inventories: [
                    {
                        ats: 5,
                        backorderable: false,
                        id: 'inventory_m_store_store1',
                        orderable: true,
                        preorderable: false,
                        stockLevel: 5
                    }
                ]
            }

            renderWithProviders(<MockComponent product={mockData} pickupInStore={true} />)

            // Limited stock shows unfulfillable message
            expect(screen.getByText(/Only 5 left!/)).toBeInTheDocument()
            expect(screen.getByText(/isStoreOutOfStock: true/)).toBeInTheDocument()
        })
    })
})
