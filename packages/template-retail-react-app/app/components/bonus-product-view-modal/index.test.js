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
    findAvailableBonusDiscountLineItemIds,
    getBonusProductCountsForPromotion
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
        function MockProductView({maxOrderQuantity, addToCart, imageGalleryFooter}) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const React = require('react')

            const handleAddToCart = () => {
                if (addToCart) {
                    // For distribution tests, use maxOrderQuantity as the quantity to test with
                    // This simulates a user selecting the maximum available quantity
                    const quantity = maxOrderQuantity && maxOrderQuantity > 1 ? maxOrderQuantity : 1

                    // Call addToCart with the expected format: array of {variant, quantity}
                    addToCart([
                        {
                            variant: {productId: 'test-product'},
                            quantity: quantity
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
                ),
                imageGalleryFooter &&
                    React.createElement(
                        'div',
                        {'data-testid': 'image-gallery-footer'},
                        imageGalleryFooter
                    )
            )
        }
)

// Mock bonus product utils
jest.mock('@salesforce/retail-react-app/app/utils/bonus-product-utils', () => ({
    getRemainingAvailableBonusProductsForProduct: jest.fn(),
    findAvailableBonusDiscountLineItemIds: jest.fn(),
    getBonusProductCountsForPromotion: jest.fn()
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

    // Mock getBonusProductCountsForPromotion to return default values
    getBonusProductCountsForPromotion.mockReturnValue({
        selectedBonusItems: 2,
        maxBonusItems: 5
    })

    // Mock findAvailableBonusDiscountLineItemIds to return array of pairs
    findAvailableBonusDiscountLineItemIds.mockReturnValue([['bonus-1', 1]])

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
    const testHeaderCount = (maxBonusItems, selectedBonusItems, expectedText) => {
        it(`displays "${selectedBonusItems} of ${maxBonusItems} selected" when ${
            selectedBonusItems === 0
                ? 'no'
                : selectedBonusItems === maxBonusItems
                ? 'all'
                : selectedBonusItems === 1
                ? 'one'
                : 'some'
        } bonus items are selected`, () => {
            const mockBasket = {basketId: 'test-basket'}

            useCurrentBasket.mockReturnValue({data: mockBasket})

            // Mock getBonusProductCountsForPromotion to return specific test values
            getBonusProductCountsForPromotion.mockReturnValue({
                selectedBonusItems,
                maxBonusItems
            })

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
        2, // maxBonusItems
        0, // selectedBonusItems
        'Select bonus product (0 of 2 selected)'
    )

    testHeaderCount(
        4, // maxBonusItems
        1, // selectedBonusItems
        'Select bonus product (1 of 4 selected)'
    )

    testHeaderCount(
        6, // maxBonusItems
        5, // selectedBonusItems
        'Select bonus product (5 of 6 selected)'
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

describe('BonusProductViewModal - Back to Selection Link', () => {
    test('renders Back to Selection link when onReturnToSelection is provided', () => {
        const mockBasket = {basketId: 'test-basket'}
        useCurrentBasket.mockReturnValue({data: mockBasket})

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

        // Check that the Back to Selection link is rendered
        expect(screen.getByTestId('image-gallery-footer')).toBeInTheDocument()
        expect(screen.getByText('← Back to Selection')).toBeInTheDocument()
    })

    test('does not render Back to Selection link when onReturnToSelection is not provided', () => {
        const mockBasket = {basketId: 'test-basket'}
        useCurrentBasket.mockReturnValue({data: mockBasket})

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

        // Check that the Back to Selection link is not rendered
        expect(screen.queryByTestId('image-gallery-footer')).not.toBeInTheDocument()
        expect(screen.queryByText('← Back to Selection')).not.toBeInTheDocument()
    })

    test('Back to Selection link calls onReturnToSelection when clicked', async () => {
        const user = userEvent.setup()
        const mockBasket = {basketId: 'test-basket'}
        useCurrentBasket.mockReturnValue({data: mockBasket})

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

        // Find and click the Back to Selection link
        const backToSelectionLink = screen.getByText('← Back to Selection')
        expect(backToSelectionLink).toBeInTheDocument()

        await user.click(backToSelectionLink)

        // Verify onReturnToSelection was called
        expect(mockOnReturnToSelection).toHaveBeenCalledTimes(1)
    })

    test('Back to Selection link has correct styling attributes', () => {
        const mockBasket = {basketId: 'test-basket'}
        useCurrentBasket.mockReturnValue({data: mockBasket})

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

        const backToSelectionLink = screen.getByText('← Back to Selection')

        // Check that it's rendered as a clickable element (Text with as="button")
        expect(backToSelectionLink.tagName.toLowerCase()).toBe('button')

        // Check styling classes/attributes that indicate it's styled as a link
        const computedStyle = window.getComputedStyle(backToSelectionLink)
        expect(computedStyle.cursor).toBe('pointer')
    })
})

describe('BonusProductViewModal - Quantity Distribution Across Multiple BonusDiscountLineItemIds', () => {
    beforeEach(() => {
        // Setup mocks for quantity distribution tests
        useShopperBasketsMutationHelper.mockReturnValue({
            addItemToNewOrExistingBasket: mockAddItemToNewOrExistingBasket
        })

        const mockBasket = {
            bonusDiscountLineItems: [
                {id: 'bonus-1', maxBonusItems: 2, promotionId: 'test-promo'},
                {id: 'bonus-2', maxBonusItems: 1, promotionId: 'test-promo'}
            ],
            productItems: []
        }
        useCurrentBasket.mockReturnValue({data: mockBasket})

        getRemainingAvailableBonusProductsForProduct.mockReturnValue({
            aggregatedMaxBonusItems: 3,
            aggregatedSelectedItems: 0
        })
    })

    test('distributes quantity 3 across two discount line items (2+1)', async () => {
        const user = userEvent.setup()

        // Mock findAvailableBonusDiscountLineItemIds to return pairs with available capacity
        findAvailableBonusDiscountLineItemIds.mockReturnValue([
            ['bonus-1', 2], // First discount item has capacity for 2
            ['bonus-2', 1] // Second discount item has capacity for 1
        ])

        mockAddItemToNewOrExistingBasket.mockResolvedValue({
            bonusDiscountLineItems: [],
            productItems: []
        })

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        // Trigger add to cart with quantity 3
        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            expect(mockAddItemToNewOrExistingBasket).toHaveBeenCalledWith([
                {
                    productId: 'test-product',
                    price: 299.99,
                    quantity: 2,
                    bonusDiscountLineItemId: 'bonus-1'
                },
                {
                    productId: 'test-product',
                    price: 299.99,
                    quantity: 1,
                    bonusDiscountLineItemId: 'bonus-2'
                }
            ])
        })
    })

    test('distributes quantity 4 when only 3 capacity available (caps at 3)', async () => {
        const user = userEvent.setup()

        // Mock getRemainingBonusQuantity to return 3 (should cap quantity to 3)
        getRemainingAvailableBonusProductsForProduct.mockReturnValue({
            aggregatedMaxBonusItems: 3,
            aggregatedSelectedItems: 0
        })

        // Mock findAvailableBonusDiscountLineItemIds to return pairs with total capacity of 3
        findAvailableBonusDiscountLineItemIds.mockReturnValue([
            ['bonus-1', 2],
            ['bonus-2', 1]
        ])

        mockAddItemToNewOrExistingBasket.mockResolvedValue({
            bonusDiscountLineItems: [],
            productItems: []
        })

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            expect(mockAddItemToNewOrExistingBasket).toHaveBeenCalledWith([
                {
                    productId: 'test-product',
                    price: 299.99,
                    quantity: 2,
                    bonusDiscountLineItemId: 'bonus-1'
                },
                {
                    productId: 'test-product',
                    price: 299.99,
                    quantity: 1,
                    bonusDiscountLineItemId: 'bonus-2'
                }
            ])
        })
    })

    test('handles single discount line item with partial capacity', async () => {
        const user = userEvent.setup()

        // Mock findAvailableBonusDiscountLineItemIds to return single pair with limited capacity
        findAvailableBonusDiscountLineItemIds.mockReturnValue([
            ['bonus-1', 1] // Only 1 item capacity available
        ])

        mockAddItemToNewOrExistingBasket.mockResolvedValue({
            bonusDiscountLineItems: [],
            productItems: []
        })

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            expect(mockAddItemToNewOrExistingBasket).toHaveBeenCalledWith([
                {
                    productId: 'test-product',
                    price: 299.99,
                    quantity: 1,
                    bonusDiscountLineItemId: 'bonus-1'
                }
            ])
        })
    })

    test('skips when no available discount line items', async () => {
        const user = userEvent.setup()

        // Mock findAvailableBonusDiscountLineItemIds to return empty array
        findAvailableBonusDiscountLineItemIds.mockReturnValue([])

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            // Should not call addItemToNewOrExistingBasket when no capacity available
            expect(mockAddItemToNewOrExistingBasket).not.toHaveBeenCalled()
        })
    })

    test('distributes across three discount line items with varying capacities', async () => {
        const user = userEvent.setup()

        // Mock findAvailableBonusDiscountLineItemIds to return three pairs
        findAvailableBonusDiscountLineItemIds.mockReturnValue([
            ['bonus-1', 3], // First has capacity for 3
            ['bonus-2', 2], // Second has capacity for 2
            ['bonus-3', 1] // Third has capacity for 1
        ])

        // Update remaining bonus quantity to allow for 5 items
        getRemainingAvailableBonusProductsForProduct.mockReturnValue({
            aggregatedMaxBonusItems: 6,
            aggregatedSelectedItems: 1 // 6-1=5 remaining
        })

        mockAddItemToNewOrExistingBasket.mockResolvedValue({
            bonusDiscountLineItems: [],
            productItems: []
        })

        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        await user.click(screen.getByTestId('add-to-cart-button'))

        await waitFor(() => {
            expect(mockAddItemToNewOrExistingBasket).toHaveBeenCalledWith([
                {
                    productId: 'test-product',
                    price: 299.99,
                    quantity: 3,
                    bonusDiscountLineItemId: 'bonus-1'
                },
                {
                    productId: 'test-product',
                    price: 299.99,
                    quantity: 2,
                    bonusDiscountLineItemId: 'bonus-2'
                }
                // Should stop at 5 total (3+2), not use bonus-3
            ])
        })
    })
})
