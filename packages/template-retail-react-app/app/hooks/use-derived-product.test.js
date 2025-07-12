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

// Mock the useVariant hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-variant', () => ({
    useVariant: jest.fn()
}))

const MockComponent = ({product}) => {
    const {inventoryMessage, quantity, variationParams, variant} = useDerivedProduct(product)

    return (
        <div>
            <div>{`Quantity: ${quantity}`}</div>
            <div>{inventoryMessage}</div>
            <div>{JSON.stringify(variant)}</div>
            <div>{JSON.stringify(variationParams)}</div>
        </div>
    )
}

MockComponent.propTypes = {
    product: PropTypes.object
}

describe('useDerivedProduct hook', () => {
    beforeEach(() => {
        // Reset mock before each test
        jest.clearAllMocks()
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
})
