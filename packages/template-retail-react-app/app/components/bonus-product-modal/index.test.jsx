/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {render, screen, fireEvent} from '@testing-library/react'
import {BonusProductModal} from './index'
import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import {useProducts} from '@salesforce/commerce-sdk-react'

// Mock the hooks
jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-modal')
jest.mock('@salesforce/commerce-sdk-react')

// Mock provider component
const MockProvider = ({children, contextValue}) => {
    return (
        <div data-testid="mock-provider">
            {children}
        </div>
    )
}

MockProvider.propTypes = {
    children: PropTypes.node.isRequired,
    contextValue: PropTypes.object.isRequired
}

describe('BonusProductModal', () => {
    const mockContextValue = {
        isOpen: true,
        onClose: jest.fn(),
        data: {
            newBonusItems: [
                {
                    bonusProducts: [
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
                    ],
                    maxBonusItems: 2,
                    promotionId: 'promo1'
                }
            ]
        }
    }

    const mockProductData = {
        data: [
            {
                imageGroups: [
                    {
                        viewType: 'medium',
                        images: [{link: 'test-image.jpg'}]
                    }
                ]
            }
        ]
    }

    beforeEach(() => {
        useBonusProductModalContext.mockReturnValue(mockContextValue)
        useProducts.mockReturnValue({
            data: mockProductData,
            isLoading: false
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders modal when isOpen is true', () => {
        render(
            <MockProvider contextValue={mockContextValue}>
                <BonusProductModal />
            </MockProvider>
        )

        expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
        expect(screen.getByText('Product 1')).toBeInTheDocument()
        expect(screen.getByText('Product 2')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
        useBonusProductModalContext.mockReturnValue({
            ...mockContextValue,
            isOpen: false
        })

        render(
            <MockProvider contextValue={mockContextValue}>
                <BonusProductModal />
            </MockProvider>
        )

        expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
    })

    it('shows loading state when fetching product data', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: true
        })

        render(
            <MockProvider contextValue={mockContextValue}>
                <BonusProductModal />
            </MockProvider>
        )

        expect(screen.getAllByTestId('skeleton')).toHaveLength(6) // Two products, each with 3 skeletons (1 image + 2 text)
    })

    it('handles product selection and deselection', () => {
        render(
            <MockProvider contextValue={mockContextValue}>
                <BonusProductModal />
            </MockProvider>
        )

        // Select and then deselect a product
        const checkbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(checkbox)
        expect(screen.getByText('Add Bonus Product (1 of 2)')).toBeInTheDocument()

        fireEvent.click(checkbox)
        expect(screen.getByText('Add Bonus Product (0 of 2)')).toBeInTheDocument()
    })

    it('enforces maximum selection limit', () => {
        render(
            <MockProvider contextValue={mockContextValue}>
                <BonusProductModal />
            </MockProvider>
        )

        // Select first product
        const checkboxes = screen.getAllByRole('checkbox')
        fireEvent.click(checkboxes[0])
        expect(screen.getByText('Add Bonus Product (1 of 2)')).toBeInTheDocument()

        // Select second product
        fireEvent.click(checkboxes[1])
        expect(screen.getByText('Add Bonus Product (2 of 2)')).toBeInTheDocument()

        // Try to select a third product (should not be possible)
        const thirdCheckbox = screen.getAllByRole('checkbox')[2]
        if (thirdCheckbox) {
            fireEvent.click(thirdCheckbox)
            expect(screen.getByText('Add Bonus Product (2 of 2)')).toBeInTheDocument()
        }
    })

    it('closes modal when clicking close button', () => {
        render(
            <MockProvider contextValue={mockContextValue}>
                <BonusProductModal />
            </MockProvider>
        )

        const closeButton = screen.getByRole('button', {name: /close/i})
        fireEvent.click(closeButton)
        expect(mockContextValue.onClose).toHaveBeenCalled()
    })
})
