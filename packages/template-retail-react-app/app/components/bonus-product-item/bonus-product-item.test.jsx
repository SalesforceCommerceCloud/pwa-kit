/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import BonusProductItem from '@salesforce/retail-react-app/app/components/bonus-product-item/bonus-product-item'

const baseProduct = {
    id: '1',
    productId: '1',
    productName: 'Test Product',
    title: 'Test Product'
}

const baseProductData = {
    id: '1',
    imageGroups: [
        {
            viewType: 'small',
            images: [{link: 'test-image.jpg'}]
        }
    ]
}

describe('BonusProductItem', () => {
    test('renders product name and image', () => {
        renderWithProviders(
            <BonusProductItem
                product={baseProduct}
                productData={baseProductData}
                isSelected={false}
                onToggle={jest.fn()}
                isLoading={false}
            />
        )
        expect(screen.getByText('Test Product')).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toBeInTheDocument()
        expect(screen.getByAltText('Test Product')).toBeInTheDocument()
    })

    test('renders loading state', () => {
        renderWithProviders(
            <BonusProductItem
                product={baseProduct}
                productData={baseProductData}
                isSelected={false}
                onToggle={jest.fn()}
                isLoading={true}
            />
        )
        expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    })

    test('checkbox is checked when isSelected is true', () => {
        renderWithProviders(
            <BonusProductItem
                product={baseProduct}
                productData={baseProductData}
                isSelected={true}
                onToggle={jest.fn()}
                isLoading={false}
            />
        )
        expect(screen.getByRole('checkbox')).toBeChecked()
    })

    test('checkbox is not checked when isSelected is false', () => {
        renderWithProviders(
            <BonusProductItem
                product={baseProduct}
                productData={baseProductData}
                isSelected={false}
                onToggle={jest.fn()}
                isLoading={false}
            />
        )
        expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    test('checkbox has correct aria-label', () => {
        renderWithProviders(
            <BonusProductItem
                product={baseProduct}
                productData={baseProductData}
                isSelected={false}
                onToggle={jest.fn()}
                isLoading={false}
            />
        )
        expect(screen.getByRole('checkbox')).toHaveAttribute(
            'aria-label',
            'Select bonus product: Test Product'
        )
    })
})
