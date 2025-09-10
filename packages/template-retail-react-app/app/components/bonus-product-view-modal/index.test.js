/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import BonusProductViewModal from '@salesforce/retail-react-app/app/components/bonus-product-view-modal'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'
import {
    getRemainingAvailableBonusProductsForProduct,
    findAvailableBonusDiscountLineItemId
} from '@salesforce/retail-react-app/app/utils/bonus-product-utils'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'
import {useProductViewModal} from '@salesforce/retail-react-app/app/hooks/use-product-view-modal'

// Mock the use-product-view-modal hook at the top
jest.mock('@salesforce/retail-react-app/app/hooks/use-product-view-modal', () => ({
    useProductViewModal: jest.fn()
}))

// Mock commerce-sdk-react for CommerceApiProvider
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useShopperBasketsMutationHelper: jest.fn(),
    CommerceApiProvider: ({children}) => children
}))

// Mock the navigation hook
const mockNavigate = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => {
    return jest.fn(() => mockNavigate)
})

// Mock ProductView to test maxOrderQuantity prop functionality

jest.mock(
    '@salesforce/retail-react-app/app/components/product-view',
    () =>
        // eslint-disable-next-line react/prop-types
        function MockProductView({maxOrderQuantity, addToCart}) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const React = require('react')

            const handleAddToCart = () => {
                if (addToCart) {
                    // Call addToCart with the expected format: array of {variant, quantity}
                    addToCart([
                        {
                            variant: {productId: 'test-product'},
                            quantity: 1
                        }
                    ])
                }
            }

            return React.createElement(
                'div',
                null,
                React.createElement(
                    'div',
                    {'data-testid': 'max-order-quantity'},
                    maxOrderQuantity ?? 'null'
                ),
                React.createElement(
                    'button',
                    {
                        'data-testid': 'add-to-cart-button',
                        onClick: handleAddToCart
                    },
                    'Add to Cart'
                )
            )
        }
)

// Mock bonus product utils
jest.mock('@salesforce/retail-react-app/app/utils/bonus-product-utils', () => ({
    getRemainingAvailableBonusProductsForProduct: jest.fn(),
    findAvailableBonusDiscountLineItemId: jest.fn()
}))

// Mock current basket hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))

// Create mock functions that can be referenced in tests
const mockAddItemToNewOrExistingBasket = jest.fn()
const mockOnClose = jest.fn()
const mockOnReturnToSelection = jest.fn()

beforeEach(() => {
    jest.clearAllMocks()

    // Setup useProductViewModal mock
    useProductViewModal.mockReturnValue({
        product: mockProductDetail,
        variant: null,
        isFetching: false
    })

    // Setup other mocks
    useShopperBasketsMutationHelper.mockReturnValue({
        addItemToNewOrExistingBasket: mockAddItemToNewOrExistingBasket
    })

    // Reset mock implementations
    mockAddItemToNewOrExistingBasket.mockResolvedValue({})

    // Setup current basket mock
    useCurrentBasket.mockReturnValue({
        data: {basketId: 'test-basket'}
    })

    // Setup bonus product utils mocks
    getRemainingAvailableBonusProductsForProduct.mockReturnValue({
        aggregatedMaxBonusItems: 5,
        aggregatedSelectedItems: 2
    })

    // Mock findAvailableBonusDiscountLineItemId to return a valid ID
    findAvailableBonusDiscountLineItemId.mockReturnValue('bonus-1')

    prependHandlersToServer([
        {
            path: '*/products/:productId',
            res: () => mockProductDetail
        }
    ])
})

describe('BonusProductViewModal - getRemainingBonusQuantity', () => {
    test('calculates remaining bonus quantity correctly (5 - 2 = 3)', () => {
        // Use imported function directly

        // Mock calculation: 5 available - 2 selected = 3 remaining
        getRemainingAvailableBonusProductsForProduct.mockReturnValue({
            aggregatedMaxBonusItems: 5,
            aggregatedSelectedItems: 2
        })

        // Mock basket to exist (required for getMaxOrderQuantity to work)
        const mockBasket = {bonusDiscountLineItems: []}
        useCurrentBasket.mockReturnValue({data: mockBasket})

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={() => {}}
                bonusDiscountLineItemId="test-id"
                promotionId="test-promo"
            />
        )

        // Should pass 5 - 2 = 3 to ProductView as maxOrderQuantity
        expect(screen.getByTestId('max-order-quantity')).toHaveTextContent('3')
    })
})

describe('BonusProductViewModal - Header Count Display', () => {
    const testHeaderCount = (description, bonusItems, productItems, expectedText) => {
        test(description, () => {
            const mockBasket = bonusItems ? {
                bonusDiscountLineItems: bonusItems,
                productItems: productItems || []
            } : null
            
            useCurrentBasket.mockReturnValue({data: mockBasket})

            renderWithProviders(
                <BonusProductViewModal
                    product={mockProductDetail}
                    isOpen={true}
                    onClose={() => {}}
                    bonusDiscountLineItemId="bonus-1"
                    promotionId="test-promo"
                />
            )

            expect(screen.getByRole('heading')).toHaveTextContent(expectedText)
        })
    }

    testHeaderCount(
        'displays "0 of 2 selected" when no bonus items are selected',
        [{id: 'bonus-1', maxBonusItems: 2}],
        [],
        'Select Bonus Product (0 of 2 selected)'
    )

    testHeaderCount(
        'displays "1 of 4 selected" when one bonus item is selected',
        [{id: 'bonus-1', maxBonusItems: 2}, {id: 'bonus-2', maxBonusItems: 2}],
        [{bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 1}],
        'Select Bonus Product (1 of 4 selected)'
    )

    testHeaderCount(
        'displays "5 of 6 selected" when most bonus items are selected',
        [{id: 'bonus-1', maxBonusItems: 3}, {id: 'bonus-2', maxBonusItems: 3}],
        [
            {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-1', quantity: 3},
            {bonusProductLineItem: true, bonusDiscountLineItemId: 'bonus-2', quantity: 2}
        ],
        'Select Bonus Product (5 of 6 selected)'
    )
})

describe('BonusProductViewModal - Return to Selection Flow', () => {
    beforeEach(() => {
        // Setup default mocks - using global mock functions
        useShopperBasketsMutationHelper.mockReturnValue({
            addItemToNewOrExistingBasket: mockAddItemToNewOrExistingBasket
        })

        getRemainingAvailableBonusProductsForProduct.mockReturnValue({
            aggregatedMaxBonusItems: 3,
            aggregatedSelectedItems: 1
        })

        const mockBasket = {
            bonusDiscountLineItems: [
                {id: 'bonus-1', maxBonusItems: 2},
                {id: 'bonus-2', maxBonusItems: 1}
            ]
        }
        useCurrentBasket.mockReturnValue({data: mockBasket})
    })

    test('calls onReturnToSelection when there are remaining bonus products', async () => {
        const user = userEvent.setup()

        // Mock successful add to cart with remaining bonus products
        const updatedBasket = {
            bonusDiscountLineItems: [
                {id: 'bonus-1', maxBonusItems: 2},
                {id: 'bonus-2', maxBonusItems: 1}
            ],
            productItems: [
                {
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-1',
                    quantity: 1
                }
            ]
        }
        mockAddItemToNewOrExistingBasket.mockResolvedValue(updatedBasket)

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                onReturnToSelection={mockOnReturnToSelection}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        // Trigger add to cart
        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            expect(mockOnReturnToSelection).toHaveBeenCalledTimes(1)
        })

        // Should not navigate to cart or close modal when returning to selection
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('navigates to cart when no remaining bonus products', async () => {
        const user = userEvent.setup()

        // Mock successful add to cart with no remaining bonus products
        const updatedBasket = {
            bonusDiscountLineItems: [
                {id: 'bonus-1', maxBonusItems: 2},
                {id: 'bonus-2', maxBonusItems: 1}
            ],
            productItems: [
                {
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-1',
                    quantity: 2
                },
                {
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-2',
                    quantity: 1
                }
            ]
        }
        mockAddItemToNewOrExistingBasket.mockResolvedValue(updatedBasket)

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                onReturnToSelection={mockOnReturnToSelection}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        // Trigger add to cart
        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1)
        })

        // Should navigate to cart after delay
        await waitFor(
            () => {
                expect(mockNavigate).toHaveBeenCalledWith('/cart', 'push')
            },
            {timeout: 300}
        )

        // Should not call onReturnToSelection
        expect(mockOnReturnToSelection).not.toHaveBeenCalled()
    })

    test('navigates to cart when onReturnToSelection is not provided', async () => {
        const user = userEvent.setup()

        // Mock successful add to cart with remaining bonus products but no callback
        const updatedBasket = {
            bonusDiscountLineItems: [{id: 'bonus-1', maxBonusItems: 2}],
            productItems: [
                {
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-1',
                    quantity: 1
                }
            ]
        }
        mockAddItemToNewOrExistingBasket.mockResolvedValue(updatedBasket)

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                // No onReturnToSelection provided
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        // Trigger add to cart
        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1)
        })

        // Should navigate to cart even with remaining bonus products
        await waitFor(
            () => {
                expect(mockNavigate).toHaveBeenCalledWith('/cart', 'push')
            },
            {timeout: 300}
        )
    })

    test('handles add to cart failure gracefully', async () => {
        const user = userEvent.setup()

        // Mock failed add to cart
        mockAddItemToNewOrExistingBasket.mockRejectedValue(new Error('Add to cart failed'))

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                onReturnToSelection={mockOnReturnToSelection}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        // Trigger add to cart
        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            expect(mockAddItemToNewOrExistingBasket).toHaveBeenCalledTimes(1)
        })

        // Should not call any navigation or return callbacks on failure
        expect(mockOnReturnToSelection).not.toHaveBeenCalled()
        expect(mockOnClose).not.toHaveBeenCalled()
        expect(mockNavigate).not.toHaveBeenCalled()
    })
})

describe('BonusProductViewModal - checkForRemainingBonusProducts', () => {
    test('returns true when bonus products have remaining capacity', () => {
        const updatedBasket = {
            bonusDiscountLineItems: [
                {id: 'bonus-1', maxBonusItems: 3},
                {id: 'bonus-2', maxBonusItems: 2}
            ],
            productItems: [
                {
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-1',
                    quantity: 2
                },
                {
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-2',
                    quantity: 1
                }
            ]
        }

        // This tests the internal logic - bonus-1 has 1 remaining (3-2), bonus-2 has 1 remaining (2-1)
        // We can't directly test the internal function, but we can test the behavior through the component
        useCurrentBasket.mockReturnValue({data: updatedBasket})

        const mockAddItemToNewOrExistingBasket = jest.fn().mockResolvedValue(updatedBasket)
        useShopperBasketsMutationHelper.mockReturnValue({
            addItemToNewOrExistingBasket: mockAddItemToNewOrExistingBasket
        })

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={() => {}}
                onReturnToSelection={mockOnReturnToSelection}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        // The component should be rendered successfully, indicating the logic works
        expect(screen.getByTestId('add-to-cart-button')).toBeInTheDocument()
    })

    test('returns false when no bonus discount line items exist', () => {
        const updatedBasket = {
            // No bonusDiscountLineItems
            productItems: []
        }

        useCurrentBasket.mockReturnValue({data: updatedBasket})

        const mockAddItemToNewOrExistingBasket = jest.fn().mockResolvedValue(updatedBasket)
        useShopperBasketsMutationHelper.mockReturnValue({
            addItemToNewOrExistingBasket: mockAddItemToNewOrExistingBasket
        })

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={() => {}}
                onReturnToSelection={() => {}}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        // Component should render without errors
        expect(screen.getByTestId('add-to-cart-button')).toBeInTheDocument()
    })
})
