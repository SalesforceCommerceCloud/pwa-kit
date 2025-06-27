/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useBonusProductSearch} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-search'
import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import * as useDerivedProductModule from '@salesforce/retail-react-app/app/hooks/use-derived-product'

// Mock scrollIntoView for jsdom
// eslint-disable-next-line @typescript-eslint/no-empty-function
global.HTMLElement.prototype.scrollIntoView = function () {}

// Shared mocks for modal context
const mockOnBonusProductModalOpen = jest.fn()
const mockAddBonusProducts = jest.fn()
const mockOnAddToCartModalOpen = jest.fn()

// Mocks must be at the very top before any imports
jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-search', () => ({
    __esModule: true,
    useBonusProductSearch: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => ({
        data: {
            authType: 'registered',
            isRegistered: true
        }
    })
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-currency', () => ({
    useCurrency: () => ({
        currency: 'USD'
    })
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal', () => ({
    useAddToCartModalContext: () => ({
        isOpen: false,
        onOpen: mockOnAddToCartModalOpen,
        onClose: jest.fn()
    }),
    AddToCartModalProvider: ({children}) => children
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-modal', () => ({
    useBonusProductModalContext: () => ({
        isOpen: false,
        onOpen: mockOnBonusProductModalOpen,
        onClose: jest.fn(),
        bonusProducts: [],
        addBonusProducts: mockAddBonusProducts
    }),
    BonusProductModalProvider: ({children}) => children
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: () => jest.fn()
}))

describe('ProductView Bonus Product Integration', () => {
    beforeEach(() => {
        mockOnBonusProductModalOpen.mockReset()
        mockAddBonusProducts.mockReset()
        mockOnAddToCartModalOpen.mockReset()

        // Patch useDerivedProduct for these tests
        jest.spyOn(useDerivedProductModule, 'useDerivedProduct').mockImplementation(() => ({
            showLoading: false,
            showInventoryMessage: false,
            inventoryMessage: '',
            quantity: 1,
            minOrderQuantity: 1,
            setQuantity: jest.fn(),
            variant: {
                productId: 'p1-38',
                orderable: true,
                variationValues: {size: '38'}
            },
            variationParams: {size: '38'},
            variationAttributes: [
                {
                    id: 'size',
                    name: 'Size',
                    selectedValue: {name: '38', value: '38'},
                    values: [
                        {name: '38', value: '38', orderable: true},
                        {name: '39', value: '39', orderable: true}
                    ]
                }
            ],
            stockLevel: 10,
            stepQuantity: 1,
            isOutOfStock: false,
            unfulfillable: false
        }))
    })

    const product = {
        id: 'p1',
        name: 'Test Product',
        type: {variant: true},
        variationAttributes: [
            {
                id: 'size',
                name: 'Size',
                values: [
                    {name: '38', value: '38', orderable: true},
                    {name: '39', value: '39', orderable: true}
                ]
            }
        ],
        variants: [
            {
                productId: 'p1-38',
                orderable: true,
                variationValues: {size: '38'}
            },
            {
                productId: 'p1-39',
                orderable: true,
                variationValues: {size: '39'}
            }
        ],
        variationValues: {size: '38'}
    }

    test('calls bonus product modal open when addToCart returns rule-based bonusDiscountLineItems', async () => {
        const user = userEvent.setup()

        // Mock addToCart to return a rule-based bonus
        const mockAddToCart = jest.fn().mockResolvedValue({
            productSelectionValues: [{id: 'item1'}],
            bonusDiscountLineItems: [{id: 'bonus1', promotionId: 'promo123'}]
        })

        // Mock useBonusProductSearch to return a hit for promo123
        useBonusProductSearch.mockImplementation((promotionId) => {
            if (promotionId === 'promo123') {
                return {
                    data: {
                        hits: [
                            {
                                productId: 'prod1',
                                productName: 'Bonus Product 1',
                                c_productUrl: '/product/prod1'
                            }
                        ]
                    }
                }
            }
            return {data: null}
        })

        renderWithProviders(<ProductView product={product} addToCart={mockAddToCart} />)

        // Select the first size swatch
        const sizeSwatch = screen.getByRole('radio', {name: /38/i})
        await user.click(sizeSwatch)

        // Click Add to Cart
        const addToCartButton = screen.getAllByText(/add to cart/i)[0]
        await user.click(addToCartButton)

        // Wait for modal open
        await waitFor(() => {
            expect(mockOnBonusProductModalOpen).toHaveBeenCalled()
            const call = mockOnBonusProductModalOpen.mock.calls[0][0]
            expect(call.newBonusItems).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        bonusProducts: expect.arrayContaining([
                            expect.objectContaining({
                                productId: 'prod1',
                                productName: 'Bonus Product 1'
                            })
                        ])
                    })
                ])
            )
        })
    })

    test('calls add to cart modal open when no bonusDiscountLineItems', async () => {
        const user = userEvent.setup()

        const mockAddToCart = jest.fn().mockResolvedValue({productSelectionValues: [{id: 'item1'}]})
        useBonusProductSearch.mockImplementation(() => ({data: null}))

        renderWithProviders(<ProductView product={product} addToCart={mockAddToCart} />)

        // Select the first size swatch
        const sizeSwatch = screen.getByRole('radio', {name: /38/i})
        await user.click(sizeSwatch)

        const addToCartButton = screen.getAllByText(/add to cart/i)[0]
        await user.click(addToCartButton)

        await waitFor(() => {
            expect(mockOnAddToCartModalOpen).toHaveBeenCalled()
        })
    })
})
