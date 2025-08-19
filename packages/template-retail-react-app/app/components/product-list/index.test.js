/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ProductList from '@salesforce/retail-react-app/app/components/product-list/index'

// Mock the main ItemVariantProvider component to isolate ProductList testing
// This prevents complex child component rendering and focuses tests on ProductList logic
jest.mock(
    '@salesforce/retail-react-app/app/components/item-variant',
    () =>
        // eslint-disable-next-line react/prop-types
        function MockItemVariantProvider({children}) {
            return <div data-testid="item-variant-provider">{children}</div>
        }
)

// Mock the product image component to avoid image loading dependencies in tests
// Returns a simple div that can be easily tested and doesn't require actual image assets
jest.mock(
    '@salesforce/retail-react-app/app/components/item-variant/item-image',
    () =>
        function MockCartItemVariantImage() {
            return <div data-testid="cart-item-image">Image</div>
        }
)

// Mock the product name component to provide predictable text content for testing
// Eliminates dependencies on complex name formatting logic and internationalization
jest.mock(
    '@salesforce/retail-react-app/app/components/item-variant/item-name',
    () =>
        function MockCartItemVariantName() {
            return <div data-testid="cart-item-name">Product Name</div>
        }
)

// Mock the product attributes component to avoid complex attribute rendering logic
// Simplifies testing by providing consistent attribute display without variant-specific logic
jest.mock(
    '@salesforce/retail-react-app/app/components/item-variant/item-attributes',
    () =>
        function MockCartItemVariantAttributes() {
            return <div data-testid="cart-item-attributes">Product Attributes</div>
        }
)

// Mock the product price component to avoid currency formatting and pricing calculation dependencies
// Provides consistent price display for testing without external formatting libraries
jest.mock(
    '@salesforce/retail-react-app/app/components/item-variant/item-price',
    () =>
        function MockCartItemVariantPrice() {
            return <div data-testid="cart-item-price">$99.99</div>
        }
)

describe('ProductList', () => {
    const mockVariants = [
        {
            // Order item data
            itemId: 'item1',
            productId: 'prod1',
            quantity: 1,
            price: 29.99,
            // Product data (merged)
            id: 'prod1',
            name: 'Test Product 1',
            productName: 'Test Product 1',
            imageGroups: [
                {
                    viewType: 'small',
                    images: [{disBaseLink: '/image1.jpg', alt: 'Product 1'}]
                }
            ],
            isProductUnavailable: false
        },
        {
            // Order item data
            itemId: 'item2',
            productId: 'prod2',
            quantity: 2,
            price: 39.99,
            // Product data (merged)
            id: 'prod2',
            name: 'Test Product 2',
            productName: 'Test Product 2',
            imageGroups: [
                {
                    viewType: 'small',
                    images: [{disBaseLink: '/image2.jpg', alt: 'Product 2'}]
                }
            ],
            isProductUnavailable: false
        }
    ]

    const defaultProps = {
        variants: mockVariants,
        currency: 'USD'
    }

    test('displays all product variants', () => {
        renderWithProviders(<ProductList {...defaultProps} />)

        const providers = screen.getAllByTestId('item-variant-provider')
        expect(providers).toHaveLength(2)

        expect(screen.getAllByTestId('cart-item-image')).toHaveLength(2)
        expect(screen.getAllByTestId('cart-item-name')).toHaveLength(2)
        expect(screen.getAllByTestId('cart-item-attributes')).toHaveLength(2)
        expect(screen.getAllByTestId('cart-item-price')).toHaveLength(2)
    })

    test('shows nothing when no variants are provided', () => {
        renderWithProviders(<ProductList variants={[]} currency="USD" />)

        expect(screen.queryByTestId('item-variant-provider')).not.toBeInTheDocument()
    })

    test('adapts display based on customization settings', () => {
        renderWithProviders(
            <ProductList {...defaultProps} imageWidth="16" padding={6} spacing={3} />
        )

        expect(screen.getAllByTestId('item-variant-provider')).toHaveLength(2)
    })

    test('adjusts layout for different screen sizes', () => {
        renderWithProviders(
            <ProductList {...defaultProps} imageWidth={[20, 36]} padding={[4, 6]} />
        )

        expect(screen.getAllByTestId('item-variant-provider')).toHaveLength(2)
    })

    test('displays variants without currency information', () => {
        renderWithProviders(<ProductList variants={mockVariants} />)

        expect(screen.getAllByTestId('item-variant-provider')).toHaveLength(2)
    })

    test('displays variants even when some data is incomplete', () => {
        const variantsWithoutItemId = [
            {
                productId: 'prod1',
                id: 'prod1',
                name: 'Test Product 1',
                quantity: 1,
                price: 29.99,
                isProductUnavailable: false
                // No itemId property
            },
            {
                productId: 'prod2',
                id: 'prod2',
                name: 'Test Product 2',
                quantity: 2,
                price: 39.99,
                isProductUnavailable: false
                // No itemId property
            }
        ]

        renderWithProviders(<ProductList variants={variantsWithoutItemId} currency="USD" />)

        expect(screen.getAllByTestId('item-variant-provider')).toHaveLength(2)
    })

    test('renders product borders and borders are visible', () => {
        renderWithProviders(<ProductList {...defaultProps} />)

        // Check that product containers have borders (hard-coded styling)
        const containers = screen
            .getAllByTestId('item-variant-provider')
            .map((el) => el.parentElement)
        containers.forEach((container) => {
            expect(container).toHaveStyle('border: 1px solid')
        })
    })
})
