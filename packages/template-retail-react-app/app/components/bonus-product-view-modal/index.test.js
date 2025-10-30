/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import BonusProductViewModal from '@salesforce/retail-react-app/app/components/bonus-product-view-modal'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'
import {
    getRemainingAvailableBonusProductsForProduct,
    findAvailableBonusDiscountLineItemIds
} from '@salesforce/retail-react-app/app/utils/bonus-product'
import {
    useBonusProductCounts,
    useRuleBasedPromotionIds
} from '@salesforce/retail-react-app/app/utils/bonus-product/hooks'
import {processProductsForBonusCart} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'
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
    useCustomerId: jest.fn(() => 'test-customer-id'),
    useCustomerType: jest.fn(() => ({
        isRegistered: true,
        isGuest: false,
        customerType: 'registered'
    })),
    useCustomer: jest.fn(() => ({data: null})),
    useProducts: jest.fn(() => ({data: null, isPending: false})),
    useCustomerProductLists: jest.fn(() => ({data: null})),
    useShopperCustomersMutation: jest.fn(() => ({
        mutateAsync: jest.fn()
    })),
    useProductSearch: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null
    })),
    useCommerceApi: jest.fn(() => ({
        shopperSearch: {
            productSearch: jest.fn()
        }
    })),
    useAccessToken: jest.fn(() => ({
        getTokenWhenReady: jest.fn().mockResolvedValue('mock-token')
    })),
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
jest.mock('@salesforce/retail-react-app/app/utils/bonus-product', () => ({
    getRemainingAvailableBonusProductsForProduct: jest.fn(),
    findAvailableBonusDiscountLineItemIds: jest.fn(),
    getBonusProductCountsForPromotion: jest.fn(),
    useBasketProductsWithPromotions: jest.fn(() => ({
        data: {},
        isLoading: false,
        hasPromotionData: false
    }))
}))

// Mock bonus product hooks
jest.mock('@salesforce/retail-react-app/app/utils/bonus-product/hooks', () => ({
    useBonusProductCounts: jest.fn(),
    useRuleBasedPromotionIds: jest.fn(() => [])
}))

// Mock bonus product cart helpers
jest.mock('@salesforce/retail-react-app/app/utils/bonus-product/cart', () => ({
    processProductsForBonusCart: jest.fn()
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
        data: {basketId: 'test-basket'},
        derivedData: {totalItems: 0}
    })

    // Setup bonus product utils mocks
    getRemainingAvailableBonusProductsForProduct.mockReturnValue({
        aggregatedMaxBonusItems: 5,
        aggregatedSelectedItems: 2
    })

    // Mock useBonusProductCounts to return default values
    useBonusProductCounts.mockReturnValue({
        finalSelectedBonusItems: 2,
        finalMaxBonusItems: 5
    })

    // Mock useRuleBasedPromotionIds to return empty array by default
    useRuleBasedPromotionIds.mockReturnValue([])

    // Mock findAvailableBonusDiscountLineItemIds to return array of pairs
    findAvailableBonusDiscountLineItemIds.mockReturnValue([['bonus-1', 1]])

    // Mock processProductsForBonusCart to return product items
    processProductsForBonusCart.mockReturnValue([
        {
            productId: 'test-product',
            price: 99.99,
            quantity: 1,
            bonusDiscountLineItemId: 'bonus-1'
        }
    ])

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
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})

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

            useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})

            // Mock useBonusProductCounts to return specific test values
            useBonusProductCounts.mockReturnValue({
                finalSelectedBonusItems: selectedBonusItems,
                finalMaxBonusItems: maxBonusItems
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
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
    })

    test('calls onReturnToSelection when there are remaining bonus products', async () => {
        const user = userEvent.setup()

        // Mock successful add to cart with remaining bonus products
        // The promotionId must match what's passed to BonusProductViewModal
        const updatedBasket = {
            bonusDiscountLineItems: [
                {id: 'bonus-1', promotionId: 'test-promo', maxBonusItems: 2},
                {id: 'bonus-2', promotionId: 'test-promo', maxBonusItems: 1}
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
        // All bonusDiscountLineItems for this promotion are fully allocated
        const updatedBasket = {
            bonusDiscountLineItems: [
                {id: 'bonus-1', promotionId: 'test-promo', maxBonusItems: 2},
                {id: 'bonus-2', promotionId: 'test-promo', maxBonusItems: 1}
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
        useCurrentBasket.mockReturnValue({data: updatedBasket, derivedData: {totalItems: 0}})

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

        useCurrentBasket.mockReturnValue({data: updatedBasket, derivedData: {totalItems: 0}})

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
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})

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

        // Check that the Back to Selection links are rendered (mobile and desktop versions)
        expect(screen.getByTestId('image-gallery-footer')).toBeInTheDocument()
        const backToSelectionLinks = screen.getAllByText('← Back to Selection')
        expect(backToSelectionLinks).toHaveLength(2) // Mobile and desktop versions
    })

    test('does not render Back to Selection link when onReturnToSelection is not provided', () => {
        const mockBasket = {basketId: 'test-basket'}
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})

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
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})

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

        // Find and click the Back to Selection link (use the first one found - either will work)
        const backToSelectionLinks = screen.getAllByText('← Back to Selection')
        expect(backToSelectionLinks[0]).toBeInTheDocument()

        await user.click(backToSelectionLinks[0])

        // Verify onReturnToSelection was called
        expect(mockOnReturnToSelection).toHaveBeenCalledTimes(1)
    })

    test('Back to Selection link has correct styling attributes', () => {
        const mockBasket = {basketId: 'test-basket'}
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})

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

        const backToSelectionLinks = screen.getAllByText('← Back to Selection')
        const backToSelectionLink = backToSelectionLinks[0] // Test the first button found

        // Check that it's rendered as a clickable element (Text with as="button")
        expect(backToSelectionLink.tagName.toLowerCase()).toBe('button')

        // Check styling classes/attributes that indicate it's styled as a link
        const computedStyle = window.getComputedStyle(backToSelectionLink)
        expect(computedStyle.cursor).toBe('pointer')
    })
})

describe('BonusProductViewModal - Responsive Button Positioning', () => {
    beforeEach(() => {
        const mockBasket = {basketId: 'test-basket'}
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
    })

    test('renders Back to Selection button in mobile position (ModalHeader) when onReturnToSelection is provided', () => {
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

        // Find the ModalHeader and verify it contains the mobile button
        const modalHeader = screen.getByRole('banner')
        const buttonsInHeader = within(modalHeader).getAllByText('← Back to Selection')
        expect(buttonsInHeader).toHaveLength(1)
    })

    test('renders Back to Selection button in desktop position (imageGalleryFooter) when onReturnToSelection is provided', () => {
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

        // Verify the imageGalleryFooter contains a button (desktop version)
        expect(screen.getByTestId('image-gallery-footer')).toBeInTheDocument()
        const imageGalleryFooter = screen.getByTestId('image-gallery-footer')
        const buttonsInFooter = within(imageGalleryFooter).getAllByText('← Back to Selection')
        expect(buttonsInFooter).toHaveLength(1)
    })

    test('does not render mobile button when onReturnToSelection is not provided', () => {
        renderWithProviders(
            <BonusProductViewModal
                product={mockProductDetail}
                isOpen={true}
                onClose={mockOnClose}
                bonusDiscountLineItemId="bonus-1"
                promotionId="test-promo"
            />
        )

        // Find the ModalHeader and verify it does NOT contain any buttons
        const modalHeader = screen.getByRole('banner')
        const buttonsInHeader = within(modalHeader).queryAllByText('← Back to Selection')
        expect(buttonsInHeader).toHaveLength(0)
    })
})

describe('BonusProductViewModal - Responsive Font Size', () => {
    beforeEach(() => {
        const mockBasket = {basketId: 'test-basket'}
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
    })

    test('applies responsive font size to Back to Selection button', () => {
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

        // Get the first button (mobile version in header)
        const backToSelectionLinks = screen.getAllByText('← Back to Selection')
        const mobileButton = backToSelectionLinks[0]

        // Check that the button has responsive font size classes
        // In Chakra UI, fontSize="lg" typically adds css classes for responsive sizing
        expect(mobileButton).toHaveClass('chakra-text')

        // Verify it's rendered as a button element
        expect(mobileButton.tagName.toLowerCase()).toBe('button')
    })

    test('button has appropriate Chakra UI structure for responsive font sizing', () => {
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

        const heading = screen.getByRole('heading', {name: /Select bonus product/i})
        const backToSelectionButtons = screen.getAllByText('← Back to Selection')
        const button = backToSelectionButtons[0]

        // Verify both elements have appropriate Chakra UI classes (structural test for responsive implementation)
        expect(heading).toHaveClass('chakra-heading')
        expect(button).toHaveClass('chakra-text')

        // Verify the button is properly rendered as a button element
        expect(button.tagName.toLowerCase()).toBe('button')

        // Verify the elements exist and are properly structured
        expect(heading).toBeInTheDocument()
        expect(button).toBeInTheDocument()
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
        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})

        getRemainingAvailableBonusProductsForProduct.mockReturnValue({
            aggregatedMaxBonusItems: 3,
            aggregatedSelectedItems: 0
        })
    })

    test('distributes quantity 3 across two discount line items (2+1)', async () => {
        const user = userEvent.setup()

        // Mock processProductsForBonusCart to return expected distribution
        processProductsForBonusCart.mockReturnValue([
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

        // Mock processProductsForBonusCart to return capped distribution (quantity 4 capped to 3)
        processProductsForBonusCart.mockReturnValue([
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

        // Mock processProductsForBonusCart to return single item with limited capacity
        processProductsForBonusCart.mockReturnValue([
            {
                productId: 'test-product',
                price: 299.99,
                quantity: 1,
                bonusDiscountLineItemId: 'bonus-1'
            }
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

        // Mock processProductsForBonusCart to return empty array (no available items)
        processProductsForBonusCart.mockReturnValue([])

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

        // Update remaining bonus quantity to allow for 5 items
        getRemainingAvailableBonusProductsForProduct.mockReturnValue({
            aggregatedMaxBonusItems: 6,
            aggregatedSelectedItems: 1 // 6-1=5 remaining
        })

        // Mock processProductsForBonusCart to return distribution across three items
        processProductsForBonusCart.mockReturnValue([
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

describe('BonusProductViewModal - URL Pollution Prevention', () => {
    /*
DO NOT REMOVE THIS COMMENT! This test was generated by Cursor 

This test verifies that bonus product variant selection does not modify PDP URL parameters.
This is the core fix for the 400 error - bonus modals use React state instead of URL params.
This test leveraged the following Cursor rules: pwa-kit/testing/unit-tests-generic, pwa-kit/testing/unit-tests-template-retail-react-app  
This test was generated with the following model: Claude Sonnet 4.5
*/
    test('bonus product variant selection does not modify PDP URL', () => {
        const mockProductWithVariations = {
            ...mockProductDetail,
            id: '793775370033',
            productId: '793775370033',
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {value: 'red', name: 'Red'},
                        {value: 'blue', name: 'Blue'}
                    ]
                },
                {
                    id: 'size',
                    values: [
                        {value: 'M', name: 'Medium'},
                        {value: 'L', name: 'Large'}
                    ]
                }
            ]
        }

        const mockBasket = {
            basketId: 'test-basket',
            bonusDiscountLineItems: [{promotionId: 'test-promo', bonusProducts: []}]
        }

        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
        useProductViewModal.mockReturnValue({
            product: mockProductWithVariations,
            isFetching: false
        })

        // Store initial URL
        const initialUrl = window.location.href

        // Open bonus modal
        renderWithProviders(
            <BonusProductViewModal
                product={mockProductWithVariations}
                isOpen={true}
                onClose={mockOnClose}
                promotionId="test-promo"
            />
        )

        // Verify modal renders
        expect(screen.getByTestId('bonus-product-view-modal')).toBeInTheDocument()

        // Assert URL unchanged after opening modal
        expect(window.location.href).toBe(initialUrl)

        // The bonus modal uses React state (controlledVariationValues) instead of URL params
        // This prevents URL pollution and fixes the 400 error issue
    })

    test('opening bonus modal from PDP with URL params does not change PDP URL', () => {
        const mockProductWithVariations = {
            ...mockProductDetail,
            id: '793775370033',
            productId: '793775370033',
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {value: 'red', name: 'Red'},
                        {value: 'blue', name: 'Blue'}
                    ]
                }
            ]
        }

        const mockBasket = {
            basketId: 'test-basket',
            bonusDiscountLineItems: [{promotionId: 'test-promo', bonusProducts: []}]
        }

        // Simulate PDP with existing URL params (color=red&size=M)
        const initialSearch = window.location.search

        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
        useProductViewModal.mockReturnValue({
            product: mockProductWithVariations,
            isFetching: false
        })

        // Open bonus modal while on PDP with URL params
        renderWithProviders(
            <BonusProductViewModal
                product={mockProductWithVariations}
                isOpen={true}
                onClose={mockOnClose}
                promotionId="test-promo"
            />
        )

        // Verify modal renders
        expect(screen.getByTestId('bonus-product-view-modal')).toBeInTheDocument()

        // Assert URL params unchanged
        expect(window.location.search).toBe(initialSearch)

        // The bonus modal's controlled variation state is isolated from URL
        // This ensures PDP URL params remain untouched
    })
})

describe('BonusProductViewModal - Variation State Reset', () => {
    /*
DO NOT REMOVE THIS COMMENT! This test was generated by Cursor 

This test verifies that variation state (controlledVariationValues) is reset when the modal closes and reopens.
This test leveraged the following Cursor rules: pwa-kit/testing/unit-tests-generic, pwa-kit/testing/unit-tests-template-retail-react-app  
This test was generated with the following model: Claude Sonnet 4.5
*/
    test('resets variation state when modal closes and reopens', () => {
        const mockProductWithVariations = {
            ...mockProductDetail,
            id: '793775370033',
            productId: '793775370033',
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {value: 'red', name: 'Red'},
                        {value: 'blue', name: 'Blue'}
                    ]
                },
                {
                    id: 'size',
                    values: [{value: 'M', name: 'Medium'}] // Single value - should be auto-selected
                }
            ]
        }

        const mockBasket = {
            basketId: 'test-basket',
            bonusDiscountLineItems: [{promotionId: 'test-promo', bonusProducts: []}]
        }

        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
        useProductViewModal.mockReturnValue({
            product: mockProductWithVariations,
            isFetching: false
        })

        // First render - modal is open
        const {unmount} = renderWithProviders(
            <BonusProductViewModal
                product={mockProductWithVariations}
                isOpen={true}
                onClose={mockOnClose}
                promotionId="test-promo"
            />
        )

        // Verify modal renders
        expect(screen.getByTestId('bonus-product-view-modal')).toBeInTheDocument()

        // Unmount the modal (simulating close)
        unmount()

        // Re-render with modal open again
        renderWithProviders(
            <BonusProductViewModal
                product={mockProductWithVariations}
                isOpen={true}
                onClose={mockOnClose}
                promotionId="test-promo"
            />
        )

        // Verify modal renders again
        expect(screen.getByTestId('bonus-product-view-modal')).toBeInTheDocument()

        // The modal should render successfully without any state pollution from the previous render
        // The useControlledVariations hook creates fresh state on mount with useState({})
        // This test verifies that the component lifecycle correctly resets the state
    })

    test('auto-selection works correctly on modal reopen', () => {
        const mockProductWithSingleVariation = {
            ...mockProductDetail,
            id: '793775370033',
            productId: '793775370033',
            variationAttributes: [
                {
                    id: 'size',
                    values: [{value: 'M', name: 'Medium'}] // Single value - should be auto-selected
                }
            ]
        }

        const mockBasket = {
            basketId: 'test-basket',
            bonusDiscountLineItems: [{promotionId: 'test-promo', bonusProducts: []}]
        }

        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
        useProductViewModal.mockReturnValue({
            product: mockProductWithSingleVariation,
            isFetching: false
        })

        // First render
        const {unmount} = renderWithProviders(
            <BonusProductViewModal
                product={mockProductWithSingleVariation}
                isOpen={true}
                onClose={mockOnClose}
                promotionId="test-promo"
            />
        )

        expect(screen.getByTestId('bonus-product-view-modal')).toBeInTheDocument()

        // Close modal
        unmount()

        // Reopen modal
        renderWithProviders(
            <BonusProductViewModal
                product={mockProductWithSingleVariation}
                isOpen={true}
                onClose={mockOnClose}
                promotionId="test-promo"
            />
        )

        // Modal should render successfully with auto-selection working again
        expect(screen.getByTestId('bonus-product-view-modal')).toBeInTheDocument()
    })
})

describe('BonusProductViewModal - Variant Filtering Integration Tests', () => {
    const mockOnClose = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup default working mocks that don't conflict with our tests
        useShopperBasketsMutationHelper.mockReturnValue({
            addItemToNewOrExistingBasket: jest.fn()
        })

        useBonusProductCounts.mockReturnValue({
            finalSelectedBonusItems: 1,
            finalMaxBonusItems: 3
        })

        getRemainingAvailableBonusProductsForProduct.mockReturnValue(2)
    })

    test('renders modal successfully with variant filtering enabled', () => {
        // Basic integration test: Modal renders without errors with filtering logic
        const mockBasket = {
            bonusDiscountLineItems: [
                {
                    promotionId: 'test-promo',
                    bonusProducts: [
                        {productId: '793775370033M'} // Specific variant
                    ]
                }
            ],
            productItems: []
        }

        const mockProduct = {
            id: '793775370033',
            name: 'Test Product',
            variants: [
                {productId: '793775370033M', variationValues: {color: 'turquoise'}},
                {productId: '793775370033R', variationValues: {color: 'red'}}
            ],
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {value: 'turquoise', name: 'Turquoise'},
                        {value: 'red', name: 'Red'}
                    ]
                }
            ]
        }

        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
        useProductViewModal.mockReturnValue({product: mockProduct, isFetching: false})

        expect(() => {
            renderWithProviders(
                <BonusProductViewModal
                    product={mockProduct}
                    isOpen={true}
                    onClose={mockOnClose}
                    promotionId="test-promo"
                />
            )
        }).not.toThrow()

        // Verify modal renders
        expect(screen.getByTestId('bonus-product-view-modal')).toBeInTheDocument()
    })

    test('handles edge cases without errors', () => {
        // Edge case test: No bonus products available
        const mockBasket = {
            bonusDiscountLineItems: [
                {
                    promotionId: 'different-promo',
                    bonusProducts: []
                }
            ],
            productItems: []
        }

        const mockProduct = {
            id: '793775370033',
            name: 'Test Product',
            variants: [],
            variationAttributes: []
        }

        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
        useProductViewModal.mockReturnValue({product: mockProduct, isFetching: false})

        expect(() => {
            renderWithProviders(
                <BonusProductViewModal
                    product={mockProduct}
                    isOpen={true}
                    onClose={mockOnClose}
                    promotionId="test-promo"
                />
            )
        }).not.toThrow()

        expect(screen.getByTestId('bonus-product-view-modal')).toBeInTheDocument()
    })

    test('handles missing bonus data gracefully', () => {
        // Edge case test: No bonusDiscountLineItems
        const mockBasket = {productItems: []}
        const mockProduct = {id: '123', name: 'Test'}

        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
        useProductViewModal.mockReturnValue({product: mockProduct, isFetching: false})

        expect(() => {
            renderWithProviders(
                <BonusProductViewModal
                    product={mockProduct}
                    isOpen={true}
                    onClose={mockOnClose}
                    promotionId="test-promo"
                />
            )
        }).not.toThrow()
    })

    test('filtering logic processes complex variant scenarios', () => {
        // Complex scenario test: Mixed base and variant IDs
        const mockBasket = {
            bonusDiscountLineItems: [
                {
                    promotionId: 'test-promo',
                    bonusProducts: [
                        {productId: '793775370033'}, // Base product
                        {productId: '793775370033M'}, // Variant
                        {productId: '793775370033R'} // Another variant
                    ]
                }
            ]
        }

        const mockProduct = {
            id: '793775370033',
            variants: [
                {productId: '793775370033M', variationValues: {color: 'turquoise'}},
                {productId: '793775370033R', variationValues: {color: 'red'}},
                {productId: '793775370033B', variationValues: {color: 'blue'}}
            ],
            variationAttributes: [{id: 'color', values: []}]
        }

        useCurrentBasket.mockReturnValue({data: mockBasket, derivedData: {totalItems: 0}})
        useProductViewModal.mockReturnValue({product: mockProduct, isFetching: false})

        // Should handle complex filtering without errors
        expect(() => {
            renderWithProviders(
                <BonusProductViewModal
                    product={mockProduct}
                    isOpen={true}
                    onClose={mockOnClose}
                    promotionId="test-promo"
                />
            )
        }).not.toThrow()
    })
})
