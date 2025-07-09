/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import ProductItemList from '@salesforce/retail-react-app/app/components/product-item-list'

// Mock the ProductItem component
jest.mock('@salesforce/retail-react-app/app/components/product-item', () => {
    const PropTypes = require('prop-types')
    
    const MockedProductItem = function ({product, onItemQuantityChange, showLoading}) {
        return (
            <div>
                <span>{product.name}</span>
                <span>Quantity: {product.quantity}</span>
                {showLoading && <span>Loading...</span>}
                <button onClick={() => onItemQuantityChange(2)}>Change Quantity</button>
            </div>
        )
    }

    // Add PropTypes to silence linting errors
    MockedProductItem.propTypes = {
        product: PropTypes.shape({
            name: PropTypes.string,
            quantity: PropTypes.number
        }),
        onItemQuantityChange: PropTypes.func,
        showLoading: PropTypes.bool
    }

    return MockedProductItem
})

const mockProductItems = [
    {
        itemId: 'item1',
        productId: 'prod1',
        name: 'Test Product 1',
        quantity: 1,
        price: 10.99,
        gift: false
    },
    {
        itemId: 'item2',
        productId: 'prod2',
        name: 'Test Product 2',
        quantity: 2,
        price: 15.99,
        gift: true
    }
]

const mockProductsByItemId = {
    item1: {
        id: 'prod1',
        name: 'Test Product 1',
        inventory: {stockLevel: 10}
    },
    item2: {
        id: 'prod2',
        name: 'Test Product 2',
        inventory: {stockLevel: 5}
    }
}

const defaultProps = {
    productItems: mockProductItems,
    productsByItemId: mockProductsByItemId,
    isProductsLoading: false,
    localQuantity: {},
    localIsGiftItems: {},
    isCartItemLoading: false,
    selectedItem: null,
    onItemQuantityChange: jest.fn(),
    onRemoveItemClick: jest.fn()
}

const renderWithIntl = (component) =>
    render(
        <IntlProvider locale="en" defaultLocale="en">
            {component}
        </IntlProvider>
    )

describe('ProductItemList Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders all product items', () => {
        renderWithIntl(<ProductItemList {...defaultProps} />)

        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    })

    test('renders empty list when no product items provided', () => {
        renderWithIntl(<ProductItemList {...defaultProps} productItems={[]} />)

        expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument()
        expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument()
    })

    test('shows loading state for selected item', () => {
        const propsWithLoading = {
            ...defaultProps,
            isCartItemLoading: true,
            selectedItem: mockProductItems[0]
        }

        renderWithIntl(<ProductItemList {...propsWithLoading} />)

        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    test('calls onItemQuantityChange when quantity is changed', () => {
        const mockOnItemQuantityChange = jest.fn()
        renderWithIntl(
            <ProductItemList {...defaultProps} onItemQuantityChange={mockOnItemQuantityChange} />
        )

        const changeButtons = screen.getAllByText('Change Quantity')
        changeButtons[0].click()

        expect(mockOnItemQuantityChange).toHaveBeenCalledWith(mockProductItems[0], 2)
    })

    test('renders with custom secondary actions', () => {
        const mockRenderSecondaryActions = jest.fn(() => <div>Custom Actions</div>)
        renderWithIntl(
            <ProductItemList
                {...defaultProps}
                renderSecondaryActions={mockRenderSecondaryActions}
            />
        )

        expect(mockRenderSecondaryActions).toHaveBeenCalledTimes(2)
        // The mocked ProductItem doesn't render the secondaryActions, so we just verify the function was called
        expect(mockRenderSecondaryActions).toHaveBeenCalledWith(
            expect.objectContaining({
                productItem: mockProductItems[0],
                isAGift: false
            })
        )
    })

    test('handles bonus products correctly', () => {
        const bonusProductItems = [
            {
                ...mockProductItems[0],
                bonusProductLineItem: true
            }
        ]

        renderWithIntl(<ProductItemList {...defaultProps} productItems={bonusProductItems} />)

        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })

    test('handles local quantity state', () => {
        const localQuantity = {
            item1: 3
        }

        renderWithIntl(<ProductItemList {...defaultProps} localQuantity={localQuantity} />)

        expect(screen.getByText('Quantity: 3')).toBeInTheDocument()
    })

    test('handles local gift items state', () => {
        const localIsGiftItems = {
            item1: true
        }

        const mockRenderSecondaryActions = jest.fn(() => <div>Actions</div>)
        renderWithIntl(
            <ProductItemList
                {...defaultProps}
                localIsGiftItems={localIsGiftItems}
                renderSecondaryActions={mockRenderSecondaryActions}
            />
        )

        expect(mockRenderSecondaryActions).toHaveBeenCalledWith(
            expect.objectContaining({
                isAGift: true
            })
        )
    })
})
