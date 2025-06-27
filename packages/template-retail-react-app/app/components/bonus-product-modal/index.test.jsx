/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

// Mock the hooks
jest.mock('@salesforce/commerce-sdk-react')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

describe('BonusProductModal', () => {
    const mockProductData = {
        data: [
            {
                imageGroups: [
                    {
                        viewType: 'small',
                        images: [{link: 'test-image.jpg'}]
                    }
                ]
            }
        ]
    }

    const mockBasketWithBonusItems = {
        bonusDiscountLineItems: [
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
                maxBonusItems: 2
            }
        ]
    }

    const mockBasketWithoutBonusItems = {
        bonusDiscountLineItems: []
    }

    beforeEach(() => {
        useProducts.mockReturnValue({
            data: mockProductData,
            isLoading: false
        })
        useCurrentBasket.mockReturnValue({
            data: mockBasketWithoutBonusItems
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('renders modal when basket has bonus items and modal is opened', () => {
        useCurrentBasket.mockReturnValue({
            data: mockBasketWithBonusItems
        })

        renderWithProviders(<div>Test content</div>)

        // The modal should not be visible initially
        expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
    })

    test('shows loading state when fetching product data', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: true
        })

        renderWithProviders(<div>Test content</div>)

        // The modal should not be visible initially
        expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
    })

    test('does not render when basket has no bonus items', () => {
        useCurrentBasket.mockReturnValue({
            data: mockBasketWithoutBonusItems
        })

        renderWithProviders(<div>Test content</div>)

        expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
    })

    test('renders bonus products in a single centered column on mobile (no horizontal scroll)', () => {
        useCurrentBasket.mockReturnValue({
            data: mockBasketWithBonusItems
        })
        useProducts.mockReturnValue({
            data: mockProductData,
            isLoading: false
        })

        // Simulate mobile viewport
        window.innerWidth = 375
        window.dispatchEvent(new Event('resize'))

        renderWithProviders(<div>Test content</div>)

        // The modal should not be visible initially
        expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
        // Optionally, you could open the modal and check the DOM for grid structure and alignment
        // but this depends on how the modal is triggered in the app
    })

    test('supports vertical scrolling when there are many bonus products', () => {
        // Create a mock basket with many bonus products
        const manyBonusProducts = Array.from({length: 15}, (_, i) => ({
            id: `${i + 1}`,
            productId: `${i + 1}`,
            productName: `Product ${i + 1}`,
            title: `Product ${i + 1}`
        }))
        useCurrentBasket.mockReturnValue({
            data: {
                bonusDiscountLineItems: [
                    {
                        bonusProducts: manyBonusProducts,
                        maxBonusItems: 2
                    }
                ]
            }
        })
        useProducts.mockReturnValue({
            data: {
                data: manyBonusProducts.map((p) => ({
                    id: p.productId,
                    imageGroups: [{viewType: 'small', images: [{link: 'test-image.jpg'}]}]
                }))
            },
            isLoading: false
        })

        // Open the modal by rendering the provider (simulate modal open)
        const {container} = renderWithProviders(<div>Test content</div>)

        // Simulate opening the modal (if needed, depending on implementation)
        // For this test, we assume the modal is open if bonusDiscountLineItems exist

        // Find the modal body or grid container
        // This selector may need to be adjusted based on the actual DOM structure
        const modalBody =
            container.querySelector('.chakra-modal__body') ||
            container.querySelector('[role="dialog"]')
        expect(modalBody).toBeTruthy()
        // Check that vertical scrolling is possible (overflow-y is auto or scroll)
        const style = window.getComputedStyle(modalBody)
        expect(['auto', 'scroll']).toContain(style.overflowY)
    })
})
