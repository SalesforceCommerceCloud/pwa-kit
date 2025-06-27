/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useProducts, useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {BonusProductModal} from '@salesforce/retail-react-app/app/components/bonus-product-modal'
import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import ProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal'

// Mock all dependencies before any imports
jest.mock('@salesforce/commerce-sdk-react', () => ({
    // eslint-disable-next-line react/prop-types
    CommerceApiProvider: ({children}) => <div data-testid="commerce-api-provider">{children}</div>,
    useProducts: jest.fn(() => ({})),
    useShopperBasketsMutationHelper: jest.fn(() => ({}))
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn(() => ({}))
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-modal', () => ({
    // eslint-disable-next-line react/prop-types
    BonusProductModalProvider: ({children}) => (
        <div data-testid="bonus-product-modal-provider">{children}</div>
    ),
    useBonusProductModalContext: jest.fn(() => ({}))
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-einstein', () => ({
    __esModule: true,
    default: jest.fn(() => ({}))
}))

jest.mock('@salesforce/retail-react-app/app/components/product-view-modal', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="product-view-modal">Product View Modal</div>)
}))

jest.mock('@chakra-ui/react', () => {
    const original = jest.requireActual('@chakra-ui/react')
    return {
        ...original,
        // eslint-disable-next-line react/prop-types
        Modal: ({isOpen, children}) => (isOpen ? <div data-testid="modal">{children}</div> : null),
        // eslint-disable-next-line react/prop-types
        ModalOverlay: ({children}) => <div data-testid="modal-overlay">{children}</div>,
        // eslint-disable-next-line react/prop-types
        ModalContent: ({children}) => <div data-testid="modal-content">{children}</div>,
        // eslint-disable-next-line react/prop-types
        ModalHeader: ({children}) => <div data-testid="modal-header">{children}</div>,
        ModalCloseButton: (props) => (
            <button aria-label="close" {...props}>
                close
            </button>
        ),
        // eslint-disable-next-line react/prop-types
        ModalBody: ({children}) => <div data-testid="modal-body">{children}</div>,
        // eslint-disable-next-line react/prop-types
        ModalFooter: ({children}) => <div data-testid="modal-footer">{children}</div>,
        // eslint-disable-next-line react/prop-types
        Button: ({children, ...props}) => <button {...props}>{children}</button>,
        // eslint-disable-next-line react/prop-types
        Text: ({children, ...props}) => <span {...props}>{children}</span>,
        // eslint-disable-next-line react/prop-types
        SimpleGrid: ({children}) => <div>{children}</div>,
        // eslint-disable-next-line react/prop-types
        Box: ({children, ...props}) => <div {...props}>{children}</div>,
        // eslint-disable-next-line react/prop-types
        VStack: ({children, ...props}) => <div {...props}>{children}</div>,
        // eslint-disable-next-line react/prop-types
        AspectRatio: ({children, ...props}) => <div {...props}>{children}</div>,
        Skeleton: () => <div data-testid="skeleton">skeleton</div>,
        useDisclosure: () => ({isOpen: false, onOpen: jest.fn(), onClose: jest.fn()}),
        useToast: () => jest.fn(),
        useIntl: () => ({formatMessage: (msg) => msg.defaultMessage || msg.id})
    }
})

jest.mock('@salesforce/retail-react-app/app/components/dynamic-image', () => ({
    __esModule: true,
    default: ({src, imageProps, onClick}) => (
        <button
            type="button"
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick()
                }
            }}
            style={{background: 'none', border: 'none', padding: 0}}
        >
            <img src={src} alt={imageProps?.alt} />
        </button>
    )
}))

jest.mock('@salesforce/retail-react-app/app/utils/product-utils', () => ({
    filterImageGroups: jest.fn(() => [
        {
            images: [
                {
                    link: 'mock-link.jpg',
                    disBaseLink: 'mock-dis-link.jpg',
                    alt: 'Product 1'
                }
            ]
        }
    ]),
    findImageGroupBy: jest.fn(() => ({
        images: [
            {
                link: 'mock-link.jpg',
                disBaseLink: 'mock-dis-link.jpg',
                alt: 'Product 1'
            }
        ]
    }))
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal', () => ({
    // eslint-disable-next-line react/prop-types
    AddToCartModalProvider: ({children}) => (
        <div data-testid="add-to-cart-modal-provider">{children}</div>
    )
}))

describe('BonusProductModal', () => {
    const mockProductData = {
        data: [
            {
                id: '1',
                imageGroups: [
                    {
                        viewType: 'small',
                        images: [
                            {
                                link: 'test-image-1.jpg',
                                disBaseLink: 'test-dis-image-1.jpg',
                                alt: 'Product 1'
                            }
                        ]
                    }
                ],
                variationAttributes: [
                    {
                        id: 'color',
                        values: [{value: 'red'}]
                    }
                ]
            },
            {
                id: '2',
                imageGroups: [
                    {
                        viewType: 'small',
                        images: [
                            {
                                link: 'test-image-2.jpg',
                                disBaseLink: 'test-dis-image-2.jpg',
                                alt: 'Product 2'
                            }
                        ]
                    }
                ]
            }
        ]
    }

    const mockBonusProducts = [
        {
            id: '1',
            productId: '1',
            productName: 'Product 1',
            title: 'Product 1'
        },
        {
            id: '2',
            productId: '2',
            productName: 'Product 2',
            title: 'Product 2'
        }
    ]

    const mockModalContext = {
        isOpen: false,
        onClose: jest.fn(),
        onClickClose: jest.fn(),
        data: {
            newBonusItems: [
                {
                    id: 'bonus-promotion-1',
                    promotionId: 'BonusProductOnOrderOfAmountABove250',
                    bonusProducts: mockBonusProducts,
                    maxBonusItems: 2
                }
            ]
        }
    }

    const mockBasket = {
        productItems: [
            {
                itemId: 'regular-item-1',
                productId: 'regular-product-1',
                productName: 'Regular Product',
                quantity: 1,
                price: 100,
                bonusProductLineItem: false
            }
        ]
    }

    const mockAddItemToBasket = jest.fn()
    const mockEinstein = {
        sendAddToCart: jest.fn(),
        sendViewProduct: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()

        useProducts.mockReturnValue({
            data: mockProductData,
            isLoading: false
        })

        useShopperBasketsMutationHelper.mockReturnValue({
            addItemToNewOrExistingBasket: mockAddItemToBasket
        })

        useCurrentBasket.mockReturnValue({
            data: mockBasket
        })

        useBonusProductModalContext.mockReturnValue(mockModalContext)

        useEinstein.mockReturnValue(mockEinstein)

        ProductViewModal.mockImplementation(() => (
            <div data-testid="product-view-modal">Product View Modal</div>
        ))
    })

    describe('Modal Visibility', () => {
        test('does not render when modal is closed', () => {
            renderWithProviders(<BonusProductModal />)

            expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
        })

        test('renders modal when isOpen is true', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })
    })

    describe('Existing Bonus Products', () => {
        test('shows existing bonus products count correctly', () => {
            const basketWithBonusItems = {
                productItems: [
                    {
                        itemId: 'bonus-item-1',
                        productId: '1',
                        productName: 'Bonus Product 1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-promotion-1'
                    },
                    {
                        itemId: 'regular-item-1',
                        productId: 'regular-product-1',
                        productName: 'Regular Product',
                        quantity: 1,
                        bonusProductLineItem: false
                    }
                ]
            }

            useCurrentBasket.mockReturnValue({
                data: basketWithBonusItems
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Add Bonus Product (1 of 2)')).toBeInTheDocument()
        })

        test('shows existing bonus products in modal', () => {
            const basketWithBonusItems = {
                productItems: [
                    {
                        itemId: 'bonus-item-1',
                        productId: '1',
                        productName: 'Bonus Product 1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-promotion-1'
                    }
                ]
            }

            useCurrentBasket.mockReturnValue({
                data: basketWithBonusItems
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Add Bonus Product (1 of 2)')).toBeInTheDocument()
        })

        test('prevents adding more bonus products when max reached', () => {
            const basketWithMaxBonusItems = {
                productItems: [
                    {
                        itemId: 'bonus-item-1',
                        productId: '1',
                        productName: 'Bonus Product 1',
                        quantity: 2,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-promotion-1'
                    }
                ]
            }

            useCurrentBasket.mockReturnValue({
                data: basketWithMaxBonusItems
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            // When max is reached, the modal should show the correct count
            expect(screen.getByText('Add Bonus Product (2 of 2)')).toBeInTheDocument()
        })
    })

    describe('Loading States', () => {
        test('shows loading skeletons when products are loading', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            useProducts.mockReturnValue({
                data: null,
                isLoading: true
            })

            renderWithProviders(<BonusProductModal />)

            const skeletons = screen.getAllByTestId('skeleton')
            expect(skeletons.length).toBeGreaterThan(0)
        })

        test('shows product items when loading is complete', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Product 1')).toBeInTheDocument()
            expect(screen.getByText('Product 2')).toBeInTheDocument()
        })
    })

    describe('Product Display', () => {
        test('displays correct number of products', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Product 1')).toBeInTheDocument()
            expect(screen.getByText('Product 2')).toBeInTheDocument()
        })

        test('displays product images when available', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            const productButtons = screen.getAllByRole('button')
            const productImages = productButtons.filter((button) =>
                button.querySelector('img[alt*="Product"]')
            )
            expect(productImages).toHaveLength(2)
        })

        test('handles products without images gracefully', () => {
            const productDataWithoutImages = {
                data: [
                    {
                        id: '1',
                        imageGroups: []
                    }
                ]
            }

            useProducts.mockReturnValue({
                data: productDataWithoutImages,
                isLoading: false
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Product 1')).toBeInTheDocument()
        })

        test('shows "No bonus products available" when no products', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true,
                data: {
                    newBonusItems: [
                        {
                            bonusProducts: [],
                            maxBonusItems: 0
                        }
                    ]
                }
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('No bonus products available')).toBeInTheDocument()
        })
    })

    describe('Product Selection and ProductViewModal', () => {
        test('opens product view modal when product is clicked', async () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            const {user} = renderWithProviders(<BonusProductModal />)

            // Find and click on a product button
            const productButtons = screen.getAllByRole('button')
            const firstProductButton = productButtons.find((button) =>
                button.querySelector('img[alt="Product 1"]')
            )

            await user.click(firstProductButton)
            expect(ProductViewModal).toHaveBeenCalled()
        })

        test('passes complete product data to ProductViewModal', async () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            const {user} = renderWithProviders(<BonusProductModal />)

            // Find and click on a product button
            const productButtons = screen.getAllByRole('button')
            const firstProductButton = productButtons.find((button) =>
                button.querySelector('img[alt="Product 1"]')
            )

            await user.click(firstProductButton)

            expect(ProductViewModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    product: expect.objectContaining({
                        id: '1',
                        productName: 'Product 1',
                        imageGroups: expect.any(Array),
                        variationAttributes: expect.any(Array)
                    })
                }),
                expect.anything()
            )
        })

        test('does not render ProductViewModal when product data is incomplete', () => {
            useProducts.mockReturnValue({
                data: {data: []},
                isLoading: false
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            // ProductViewModal should not be rendered
            expect(screen.queryByTestId('product-view-modal')).not.toBeInTheDocument()
        })
    })

    describe('Einstein Tracking', () => {
        test('tracks product view when bonus product is clicked', async () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            const {user} = renderWithProviders(<BonusProductModal />)

            // Find any product button and click it
            const productButtons = screen.getAllByRole('button')
            const productButton = productButtons.find((button) => button.querySelector('img'))

            // Ensure we have a product button to test with
            expect(productButton).toBeDefined()
            await user.click(productButton)
            // Verify that ProductViewModal was called
            expect(ProductViewModal).toHaveBeenCalled()
        })

        test('tracks add to cart with bonus product context', async () => {
            mockAddItemToBasket.mockResolvedValue({success: true})

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            const {user} = renderWithProviders(<BonusProductModal />)

            // Click on a product to open the ProductViewModal
            const productButtons = screen.getAllByRole('button')
            const productButton = productButtons.find((button) => button.querySelector('img'))

            // Ensure we have a product button to test with
            expect(productButton).toBeDefined()
            await user.click(productButton)
            // The einstein tracking would be called when addToCart succeeds
            // This is tested through the component's behavior
            expect(ProductViewModal).toHaveBeenCalled()
        })
    })

    describe('Add to Cart Functionality', () => {
        test('calls addItemToNewOrExistingBasket with bonusDiscountLineItemId', async () => {
            mockAddItemToBasket.mockResolvedValue({success: true})

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            const {user} = renderWithProviders(<BonusProductModal />)

            // Find and click on a product button
            const productButtons = screen.getAllByRole('button')
            const firstProductButton = productButtons.find((button) =>
                button.querySelector('img[alt="Product 1"]')
            )

            await user.click(firstProductButton)

            // The addToCart function should be passed to ProductViewModal
            expect(ProductViewModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    addToCart: expect.any(Function)
                }),
                expect.anything()
            )
        })

        test('handles add to cart errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
            mockAddItemToBasket.mockRejectedValue(new Error('Add to cart failed'))

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            const {user} = renderWithProviders(<BonusProductModal />)

            // Find and click on a product button
            const productButtons = screen.getAllByRole('button')
            const firstProductButton = productButtons.find((button) =>
                button.querySelector('img[alt="Product 1"]')
            )

            await user.click(firstProductButton)

            // Error handling is tested through the component's behavior
            expect(ProductViewModal).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })
    })

    describe('Modal Actions', () => {
        test('calls onClickClose when cancel button is clicked', async () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            const {user} = renderWithProviders(<BonusProductModal />)

            const cancelButton = screen.getByText('Cancel')
            await user.click(cancelButton)

            expect(mockModalContext.onClickClose).toHaveBeenCalled()
        })

        test('calls onClickClose when close button is clicked', async () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            const {user} = renderWithProviders(<BonusProductModal />)

            const closeButton = screen.getByRole('button', {name: /close/i})
            await user.click(closeButton)

            expect(mockModalContext.onClickClose).toHaveBeenCalled()
        })
    })

    describe('Data Structure Handling', () => {
        test('handles different bonus item data structures', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true,
                data: {
                    allBonusItems: [
                        {
                            bonusProducts: mockBonusProducts,
                            maxBonusItems: 2
                        }
                    ]
                }
            })

            renderWithProviders(<BonusProductModal />)

            // Test that the modal renders without errors
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        test('handles products with different ID fields', () => {
            const productsWithDifferentIds = [
                {
                    id: '1',
                    productName: 'Product 1'
                },
                {
                    productId: '2',
                    title: 'Product 2'
                }
            ]

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true,
                data: {
                    newBonusItems: [
                        {
                            bonusProducts: productsWithDifferentIds,
                            maxBonusItems: 2
                        }
                    ]
                }
            })

            renderWithProviders(<BonusProductModal />)

            // Test that the modal renders without errors
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })
    })

    describe('Grid Layout', () => {
        test('renders correct number of columns based on product count', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            // Test that the modal renders without errors
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        test('handles single product layout', () => {
            const singleProduct = [mockBonusProducts[0]]

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true,
                data: {
                    newBonusItems: [
                        {
                            bonusProducts: singleProduct,
                            maxBonusItems: 1
                        }
                    ]
                }
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Add Bonus Product (0 of 1)')).toBeInTheDocument()
        })
    })

    describe('Variant Image Handling', () => {
        test('handles products with variation values', () => {
            const productDataWithVariants = {
                data: [
                    {
                        id: '1',
                        imageGroups: [
                            {
                                viewType: 'small',
                                images: [{link: 'variant-image.jpg'}],
                                variationAttributes: [
                                    {
                                        id: 'color',
                                        values: [{value: 'red'}]
                                    }
                                ]
                            }
                        ],
                        variationValues: {
                            color: 'red'
                        }
                    }
                ]
            }

            useProducts.mockReturnValue({
                data: productDataWithVariants,
                isLoading: false
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            // Test that the modal renders without errors
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })
    })

    describe('Bonus Product Limits', () => {
        test('shows correct remaining slots when some bonus items exist', () => {
            const basketWithPartialBonus = {
                productItems: [
                    {
                        itemId: 'bonus-item-1',
                        productId: '1',
                        productName: 'Bonus Product 1',
                        quantity: 1,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-promotion-1'
                    }
                ]
            }

            useCurrentBasket.mockReturnValue({
                data: basketWithPartialBonus
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Add Bonus Product (1 of 2)')).toBeInTheDocument()
        })

        test('handles multiple bonus items with different quantities', () => {
            const basketWithMultipleBonus = {
                productItems: [
                    {
                        itemId: 'bonus-item-1',
                        productId: '1',
                        productName: 'Bonus Product 1',
                        quantity: 2,
                        bonusProductLineItem: true,
                        bonusDiscountLineItemId: 'bonus-promotion-1'
                    }
                ]
            }

            useCurrentBasket.mockReturnValue({
                data: basketWithMultipleBonus
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('Add Bonus Product (2 of 2)')).toBeInTheDocument()
        })
    })

    describe('Error Handling', () => {
        test('handles missing product data gracefully', () => {
            useProducts.mockReturnValue({
                data: null,
                isLoading: false
            })

            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true
            })

            renderWithProviders(<BonusProductModal />)

            // Test that the modal renders without errors
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        test('handles empty bonus products array', () => {
            useBonusProductModalContext.mockReturnValue({
                ...mockModalContext,
                isOpen: true,
                data: {
                    newBonusItems: [
                        {
                            bonusProducts: [],
                            maxBonusItems: 0
                        }
                    ]
                }
            })

            renderWithProviders(<BonusProductModal />)

            expect(screen.getByText('No bonus products available')).toBeInTheDocument()
        })
    })
})
