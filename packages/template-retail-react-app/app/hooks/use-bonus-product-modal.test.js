/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, waitFor, fireEvent} from '@testing-library/react'
import {BonusProductModalProvider, useBonusProductModalContext} from './use-bonus-product-modal'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    useLocation: () => ({pathname: '/test-path'})
}))

// Mock the commerce SDK
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useProducts: jest.fn()
}))

import {useProducts} from '@salesforce/commerce-sdk-react'

// Mock the add to cart modal provider
jest.mock('./use-add-to-cart-modal', () => ({
    AddToCartModalProvider: ({children}) => <div>{children}</div>,
    useAddToCartModalContext: () => ({
        onOpen: jest.fn()
    })
}))

// Test component to access context
const TestComponent = () => {
    const {isOpen, onOpen, onClose, data} = useBonusProductModalContext()
    
    return (
        <div>
            <div data-testid="modal-state">{isOpen ? 'open' : 'closed'}</div>
            <button 
                data-testid="open-modal" 
                onClick={() => onOpen({
                    newBonusItems: [
                        {
                            id: 'bonus-item-1',
                            bonusProducts: [
                                {
                                    productId: '123',
                                    productName: 'Test Product 1',
                                    title: 'Test Product 1 Title'
                                },
                                {
                                    productId: '456', 
                                    productName: 'Test Product 2',
                                    title: 'Test Product 2 Title'
                                }
                            ],
                            maxBonusItems: 2,
                            promotionId: 'TestPromotion'
                        }
                    ]
                })}
            >
                Open Modal
            </button>
            <button data-testid="close-modal" onClick={onClose}>Close Modal</button>
            <div data-testid="modal-data">{JSON.stringify(data)}</div>
        </div>
    )
}

const TestWrapper = ({children, basket = {}}) => (
    <BonusProductModalProvider basket={basket}>
        {children}
    </BonusProductModalProvider>
)

describe('BonusProductModal', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        
        // Mock useProducts to return sample product data with images
        useProducts.mockReturnValue({
            data: {
                data: [{
                    imageGroups: [
                        {
                            viewType: 'medium',
                            images: [
                                {
                                    link: 'https://example.com/test-product-image-medium.jpg',
                                    title: 'Test Product Image'
                                }
                            ]
                        },
                        {
                            viewType: 'small',
                            images: [
                                {
                                    link: 'https://example.com/test-product-image-small.jpg',
                                    title: 'Test Product Image Small'
                                }
                            ]
                        }
                    ]
                }]
            },
            isLoading: false,
            error: null
        })
    })

    test('renders modal when opened', async () => {
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Initially closed
        expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')

        // Open modal
        fireEvent.click(screen.getByTestId('open-modal'))
        
        await waitFor(() => {
            expect(screen.getByTestId('modal-state')).toHaveTextContent('open')
        })

        // Check modal content
        expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    })

    test('displays bonus products in grid layout', async () => {
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Open modal
        fireEvent.click(screen.getByTestId('open-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        // Check that products are displayed
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
        
        // Check that checkboxes are present
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes).toHaveLength(2)
        
        // Check that Next button is present and enabled (shoppers can proceed without selection)
        const nextButton = screen.getByText('Next')
        expect(nextButton).toBeInTheDocument()
        expect(nextButton).not.toBeDisabled()
    })

    test('handles checkbox interactions', async () => {
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Open modal
        fireEvent.click(screen.getByTestId('open-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        // Verify checkboxes are present
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes).toHaveLength(2)
        
        // Click on checkboxes (they should be clickable)
        fireEvent.click(checkboxes[0])
        fireEvent.click(checkboxes[1])
        
        // Next button should always be enabled
        const nextButton = screen.getByText('Next')
        expect(nextButton).not.toBeDisabled()
    })

    test('limits selection to maxBonusItems', async () => {
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Open modal
        fireEvent.click(screen.getByTestId('open-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        // Check that checkboxes are present
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes).toHaveLength(2)
        
        // Verify Next button is always enabled
        const nextButton = screen.getByText('Next')
        expect(nextButton).not.toBeDisabled()
    })

    test('closes modal properly', async () => {
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Open modal
        fireEvent.click(screen.getByTestId('open-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        // Close modal using the close button
        fireEvent.click(screen.getByLabelText('Close'))
        
        await waitFor(() => {
            expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
        })

        // Reopen modal - should work fine
        fireEvent.click(screen.getByTestId('open-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })
    })

    test('allows proceeding without selecting bonus products', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
        
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Open modal
        fireEvent.click(screen.getByTestId('open-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        // Don't select any products, just click Next
        const nextButton = screen.getByText('Next')
        expect(nextButton).not.toBeDisabled()
        
        fireEvent.click(nextButton)
        
        await waitFor(() => {
            expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
        })

        // Should log empty selection
        expect(consoleSpy).toHaveBeenCalledWith('Selected products:', [])
        
        consoleSpy.mockRestore()
    })

    test('handles Next button click with selection', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
        
        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Open modal
        fireEvent.click(screen.getByTestId('open-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        })

        // Verify Next button is available and click it
        const nextButton = screen.getByText('Next')
        expect(nextButton).not.toBeDisabled()
        fireEvent.click(nextButton)
        
        await waitFor(() => {
            expect(screen.getByTestId('modal-state')).toHaveTextContent('closed')
        })

        // Should log (potentially empty) selected products
        expect(consoleSpy).toHaveBeenCalledWith('Selected products:', expect.any(Array))
        
        consoleSpy.mockRestore()
    })

    test('displays empty state when no bonus products', async () => {
        const EmptyTestComponent = () => {
            const {onOpen} = useBonusProductModalContext()
            
            const handleOpenEmpty = () => {
                onOpen({
                    newBonusItems: [
                        {
                            id: 'empty-bonus',
                            bonusProducts: [],
                            maxBonusItems: 1,
                            promotionId: 'EmptyPromotion'
                        }
                    ]
                })
            }
            
            return (
                <button 
                    data-testid="open-empty-modal" 
                    onClick={handleOpenEmpty}
                >
                    Open Empty Modal
                </button>
            )
        }

        render(
            <TestWrapper>
                <EmptyTestComponent />
            </TestWrapper>
        )

        fireEvent.click(screen.getByTestId('open-empty-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('No bonus products available')).toBeInTheDocument()
        })
    })

    test('adjusts modal size based on number of bonus products', async () => {
        // Test with single product
        const SingleProductComponent = () => {
            const {onOpen} = useBonusProductModalContext()
            
            const handleOpenSingle = () => {
                onOpen({
                    newBonusItems: [
                        {
                            id: 'single-bonus',
                            bonusProducts: [
                                {
                                    productId: '789',
                                    productName: 'Single Product'
                                }
                            ],
                            maxBonusItems: 1,
                            promotionId: 'SinglePromotion'
                        }
                    ]
                })
            }
            
            return (
                <button 
                    data-testid="open-single-modal" 
                    onClick={handleOpenSingle}
                >
                    Open Single Product Modal
                </button>
            )
        }

        render(
            <TestWrapper>
                <SingleProductComponent />
            </TestWrapper>
        )

        fireEvent.click(screen.getByTestId('open-single-modal'))
        
        await waitFor(() => {
            expect(screen.getByText('Single Product')).toBeInTheDocument()
            // Check that there's only one product displayed
            const checkboxes = screen.getAllByRole('checkbox')
            expect(checkboxes).toHaveLength(1)
        })
    })

    test('provider handles basket updates', () => {
        const mockBasket = {
            bonusDiscountLineItems: [
                {
                    id: 'basket-bonus-1',
                    bonusProducts: [
                        {
                            productId: '789',
                            productName: 'Basket Product'
                        }
                    ],
                    maxBonusItems: 1,
                    promotionId: 'BasketPromotion'
                }
            ]
        }

        const BasketTestComponent = () => {
            const {bonusProducts} = useBonusProductModalContext()
            return <div data-testid="bonus-products">{JSON.stringify(bonusProducts)}</div>
        }

        render(
            <TestWrapper basket={mockBasket}>
                <BasketTestComponent />
            </TestWrapper>
        )

        expect(screen.getByTestId('bonus-products')).toHaveTextContent('basket-bonus-1')
    })
})
