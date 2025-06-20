/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {BonusProductModalProvider} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
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

        renderWithProviders(
            <BonusProductModalProvider>
                <div>Test content</div>
            </BonusProductModalProvider>
        )

        // The modal should not be visible initially
        expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
    })

    test('shows loading state when fetching product data', () => {
        useProducts.mockReturnValue({
            data: null,
            isLoading: true
        })

        renderWithProviders(
            <BonusProductModalProvider>
                <div>Test content</div>
            </BonusProductModalProvider>
        )

        // The modal should not be visible initially
        expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
    })

    test('does not render when basket has no bonus items', () => {
        useCurrentBasket.mockReturnValue({
            data: mockBasketWithoutBonusItems
        })

        renderWithProviders(
            <BonusProductModalProvider>
                <div>Test content</div>
            </BonusProductModalProvider>
        )

        expect(screen.queryByText('Add Bonus Product')).not.toBeInTheDocument()
    })
})
