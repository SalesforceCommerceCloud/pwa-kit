/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {mockedCustomerProductListsDetails} from '@salesforce/retail-react-app/app/mocks/mock-data'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import CartSecondaryButtonGroup from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'
import {screen, waitFor} from '@testing-library/react'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

const MockedComponent = ({
    onAddToWishlistClick = noop,
    onEditClick = noop,
    onRemoveItemClick = noop,
    isBonusProduct = false
}) => {
    const product = {
        ...mockedCustomerProductListsDetails.data[0],
        productName: mockedCustomerProductListsDetails.data[0].name,
        bonusProductLineItem: isBonusProduct
    }
    return (
        <ItemVariantProvider variant={product}>
            <CartSecondaryButtonGroup
                onAddToWishlistClick={onAddToWishlistClick}
                onEditClick={onEditClick}
                onRemoveItemClick={onRemoveItemClick}
            />
        </ItemVariantProvider>
    )
}

MockedComponent.propTypes = {
    onAddToWishlistClick: PropTypes.func,
    onEditClick: PropTypes.func,
    onRemoveItemClick: PropTypes.func,
    isBonusProduct: PropTypes.bool
}

beforeEach(() => {
    jest.resetModules()
})

test('renders secondary action component', async () => {
    const {user} = renderWithProviders(<MockedComponent />)
    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })
    expect(removeButton).toBeInTheDocument()
    await user.click(removeButton)

    const confirmButton = screen.getByRole('button', {name: /yes, remove item/i})
    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(confirmButton).toBeInTheDocument()
    })
})

test('renders secondary with event handlers', async () => {
    const onRemoveItemClick = jest.fn()
    const onEditClick = jest.fn()
    const onAddToWishlistClick = jest.fn()

    const {user} = renderWithProviders(
        <MockedComponent
            onAddToWishlistClick={onAddToWishlistClick}
            onEditClick={onEditClick}
            onRemoveItemClick={onRemoveItemClick}
        />
    )

    const editButton = screen.getByRole('button', {
        name: /Edit/i
    })

    expect(editButton).toBeInTheDocument()
    await user.click(editButton)
    expect(onEditClick).toHaveBeenCalledTimes(1)

    const addToWishlistButton = screen.getByRole('button', {
        name: /Add to wishlist/i
    })
    await user.click(addToWishlistButton)
    expect(onAddToWishlistClick).toHaveBeenCalledTimes(1)

    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })

    expect(removeButton).toBeInTheDocument()

    await user.click(removeButton)

    const confirmButton = screen.getByRole('button', {name: /yes, remove item/i})
    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(confirmButton).toBeInTheDocument()
    })
    await user.click(confirmButton)

    expect(onRemoveItemClick).toHaveBeenCalledTimes(1)
})

// Helper to render with a custom variant
const renderWithVariant = (variant, props = {}) => {
    return renderWithProviders(
        <ItemVariantProvider variant={variant}>
            <CartSecondaryButtonGroup {...props} />
        </ItemVariantProvider>
    )
}

describe('CartSecondaryButtonGroup Edit button conditional rendering', () => {
    test('shows Edit button for a variation product (has variationAttributes)', () => {
        const variantProduct = {
            id: 'test-variant-123',
            itemId: '123',
            variationAttributes: [{id: 'color', values: [{value: 'red'}]}]
        }
        renderWithVariant(variantProduct)
        expect(screen.getByRole('button', {name: /edit/i})).toBeInTheDocument()
    })

    test('shows Edit button for a bundle product (has bundledProductItems)', () => {
        const bundleProduct = {
            id: 'test-bundle-456',
            itemId: '456',
            bundledProductItems: [{productId: 'bundle-item-1', quantity: 1}]
        }
        renderWithVariant(bundleProduct)
        expect(screen.getByRole('button', {name: /edit/i})).toBeInTheDocument()
    })

    test('shows Edit button for a product with both variationAttributes and bundledProductItems', () => {
        const bundleVariationProduct = {
            id: 'test-bundle-variant-789',
            itemId: '789',
            variationAttributes: [{id: 'color', values: [{value: 'blue'}]}],
            bundledProductItems: [{productId: 'bundle-item-2', quantity: 2}]
        }
        renderWithVariant(bundleVariationProduct)
        expect(screen.getByRole('button', {name: /edit/i})).toBeInTheDocument()
    })

    test('does NOT show Edit button for a standard product (neither a variation nor a bundle)', () => {
        const standardProduct = {
            id: 'test-standard-101',
            itemId: '101',
            type: {item: true}
        }
        renderWithVariant(standardProduct)
        expect(screen.queryByRole('button', {name: /edit/i})).not.toBeInTheDocument()
    })

    test('shows Edit button for an empty product bundle', () => {
        const emptyBundleProduct = {
            id: 'test-empty-bundle-103',
            itemId: '103',
            bundledProductItems: []
        }
        renderWithVariant(emptyBundleProduct)
        expect(screen.getByRole('button', {name: /edit/i})).toBeInTheDocument()
    })
})

test('hides edit button and gift checkbox for bonus product but shows remove and wishlist buttons', async () => {
    renderWithProviders(<MockedComponent isBonusProduct={true} />)

    expect(screen.queryByRole('button', {name: /edit/i})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /remove/i})).toBeInTheDocument() // Remove button should be shown for bonus products
    expect(screen.queryByRole('button', {name: /add to wishlist/i})).toBeInTheDocument() // Wishlist button should now be shown for bonus products
    expect(screen.queryByRole('checkbox', {name: /this is a gift/i})).not.toBeInTheDocument()
})

describe('Bonus Product Wishlist Functionality', () => {
    test('bonus product wishlist button is clickable and calls handler', async () => {
        const onAddToWishlistClick = jest.fn()
        const {user} = renderWithProviders(
            <MockedComponent isBonusProduct={true} onAddToWishlistClick={onAddToWishlistClick} />
        )

        const wishlistButton = screen.getByRole('button', {name: /add to wishlist/i})
        expect(wishlistButton).toBeInTheDocument()

        await user.click(wishlistButton)
        expect(onAddToWishlistClick).toHaveBeenCalledTimes(1)
    })

    test('regular product shows all buttons including wishlist', async () => {
        const onAddToWishlistClick = jest.fn()
        const {user} = renderWithProviders(
            <MockedComponent isBonusProduct={false} onAddToWishlistClick={onAddToWishlistClick} />
        )

        // Regular products should show all buttons
        expect(screen.getByRole('button', {name: /edit/i})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /remove/i})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /add to wishlist/i})).toBeInTheDocument()
        expect(screen.getByRole('checkbox', {name: /this is a gift/i})).toBeInTheDocument()

        // Test wishlist functionality works for regular products too
        const wishlistButton = screen.getByRole('button', {name: /add to wishlist/i})
        await user.click(wishlistButton)
        expect(onAddToWishlistClick).toHaveBeenCalledTimes(1)
    })

    test('bonus product wishlist button receives correct product data', async () => {
        const onAddToWishlistClick = jest.fn()
        const {user} = renderWithProviders(
            <MockedComponent isBonusProduct={true} onAddToWishlistClick={onAddToWishlistClick} />
        )

        const wishlistButton = screen.getByRole('button', {name: /add to wishlist/i})
        await user.click(wishlistButton)

        // Verify the handler was called with the bonus product variant
        expect(onAddToWishlistClick).toHaveBeenCalledTimes(1)
        const calledWithProduct = onAddToWishlistClick.mock.calls[0][0]
        expect(calledWithProduct.bonusProductLineItem).toBe(true)
    })
})
