/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {render, screen} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {
    BonusProductsTitle,
    BonusProductsSelection
} from '@salesforce/retail-react-app/app/pages/cart/partials/bonus-products-title'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import {usePromotions} from '@salesforce/commerce-sdk-react'
import userEvent from '@testing-library/user-event'
import {waitFor} from '@testing-library/react'

// Mock the useCurrentBasket hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-modal')
jest.mock('@salesforce/commerce-sdk-react')

const MockedComponent = ({basketData}) => {
    useCurrentBasket.mockReturnValue({data: basketData})
    return (
        <IntlProvider messages={{}} locale="en">
            <BonusProductsTitle />
        </IntlProvider>
    )
}

MockedComponent.propTypes = {
    basketData: PropTypes.shape({
        productItems: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string,
                bonusProductLineItem: PropTypes.bool
            })
        )
    })
}

describe('BonusProductsTitle', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders title with 1 item when one bonus product', () => {
        const basketData = {
            productItems: [
                {id: '1', bonusProductLineItem: true},
                {id: '2', bonusProductLineItem: false}
            ]
        }
        render(<MockedComponent basketData={basketData} />)
        expect(screen.getByText('Bonus Products (1 item)')).toBeInTheDocument()
    })

    it('renders title with multiple items when multiple bonus products', () => {
        const basketData = {
            productItems: [
                {id: '1', bonusProductLineItem: true},
                {id: '2', bonusProductLineItem: true},
                {id: '3', bonusProductLineItem: false}
            ]
        }
        render(<MockedComponent basketData={basketData} />)
        expect(screen.getByText('Bonus Products (2 items)')).toBeInTheDocument()
    })
})
describe('Bonus Products Selection', () => {
    test('Renders correct bonus product count with multiple promotions', async () => {
        const mockOnOpen = jest.fn()
        useBonusProductModalContext.mockImplementation(() => ({
            onOpen: mockOnOpen
        }))
        usePromotions.mockReturnValue({
            data: {
                data: [
                    {id: 'promo-1', details: 'Promo 1'},
                    {id: 'promo-2', details: 'Promo 2'}
                ]
            }
        })

        const mockBasketWithMultiplePromos = {
            basketId: 'test-basket-multi-promo',
            currency: 'USD',
            customerInfo: {customerId: 'test-customer', isRegistered: true},
            productItems: [
                {
                    itemId: 'item-1',
                    productId: 'product-1',
                    productName: 'Test Product',
                    quantity: 1,
                    price: 100,
                    bonusProductLineItem: false
                }
            ],
            bonusDiscountLineItems: [
                {
                    id: 'bonus-1',
                    bonusProducts: [{id: 'bonus-prod-1'}],
                    maxBonusItems: 2,
                    promotionId: 'promo-1'
                },
                {
                    id: 'bonus-2',
                    bonusProducts: [{id: 'bonus-prod-A'}],
                    maxBonusItems: 1,
                    promotionId: 'promo-2'
                }
            ],
            shipments: [{shipmentId: 'me', shippingMethod: {id: 'some-shipping-method'}}]
        }

        const user = userEvent.setup()
        render(<BonusProductsSelection basket={mockBasketWithMultiplePromos} />)

        // There should be two bonus buttons
        const bonusButtons = await screen.findAllByRole('button', {name: /Select Bonus Products/i})
        expect(bonusButtons).toHaveLength(2)
        // Check the count text for the first offer (robust matcher)
        expect(
            screen.getAllByText((content) =>
                content.replace(/\s+/g, ' ').includes('(0 of 2 selected)')
            ).length
        ).toBeGreaterThan(0)
        // Check the count text for the second offer (robust matcher)
        expect(
            screen.getAllByText((content) =>
                content.replace(/\s+/g, ' ').includes('(0 of 1 selected)')
            ).length
        ).toBeGreaterThan(0)

        // Click the first bonus button
        await user.click(bonusButtons[0])
        expect(mockOnOpen).toHaveBeenCalledTimes(1)
        let {newBonusItems, openAddToCartModalIfNeeded} = mockOnOpen.mock.calls[0][0]
        expect(Array.isArray(newBonusItems)).toBe(true)
        expect(newBonusItems).toHaveLength(1)
        expect(newBonusItems[0].maxBonusItems).toBe(2)
        expect(openAddToCartModalIfNeeded).toBe(false)

        // Click the second bonus button
        await user.click(bonusButtons[1])
        expect(mockOnOpen).toHaveBeenCalledTimes(2)
        ;({newBonusItems, openAddToCartModalIfNeeded} = mockOnOpen.mock.calls[1][0])
        expect(Array.isArray(newBonusItems)).toBe(true)
        expect(newBonusItems).toHaveLength(1)
        expect(newBonusItems[0].maxBonusItems).toBe(1)
        expect(openAddToCartModalIfNeeded).toBe(false)
    })

    test('verifies counts and offers map with existing bonus items in cart', async () => {
        const mockOnOpen = jest.fn()
        useBonusProductModalContext.mockImplementation(() => ({
            onOpen: mockOnOpen
        }))
        usePromotions.mockReturnValue({
            data: {
                data: [
                    {id: 'promo-1', details: 'Promo 1'},
                    {id: 'promo-2', details: 'Promo 2'}
                ]
            }
        })

        const mockBasketWithMixedBonus = {
            basketId: 'test-basket-mixed',
            currency: 'USD',
            customerInfo: {customerId: 'test-customer', isRegistered: true},
            productItems: [
                {
                    itemId: 'item-1',
                    productId: 'product-1',
                    productName: 'Test Product',
                    quantity: 1,
                    price: 100,
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-2'
                },
                {
                    itemId: 'bonus-prod-1',
                    productId: 'bonus-prod-1',
                    productName: 'bonus-prod-1',
                    quantity: 3,
                    price: 10,
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-1'
                },
                {
                    itemId: 'bonus-prod-2',
                    productId: 'bonus-prod-2',
                    productName: 'bonus-prod-2',
                    quantity: 1,
                    price: 10,
                    bonusProductLineItem: false,
                    priceAdjustments: [{price: -10, promotionId: 'promo-n'}]
                }
            ],
            bonusDiscountLineItems: [
                {
                    id: 'bonus-1',
                    bonusProducts: [{id: 'bonus-prod-1'}, {id: 'bonus-prod-2'}],
                    maxBonusItems: 3,
                    promotionId: 'promo-1'
                },
                {
                    id: 'bonus-2',
                    bonusProducts: [{id: 'bonus-prod-A'}],
                    maxBonusItems: 2,
                    promotionId: 'promo-2'
                }
            ],
            shipments: [{shipmentId: 'me', shippingMethod: {id: 'some-shipping-method'}}]
        }

        const user = userEvent.setup()
        render(<BonusProductsSelection basket={mockBasketWithMixedBonus} />)

        // Only the second offer will have a button rendered
        expect(
            (
                await screen.findAllByText((content) =>
                    content.replace(/\s+/g, ' ').includes('(1 of 2 selected)')
                )
            ).length
        ).toBeGreaterThan(0)

        const bonusButtons = screen.getAllByRole('button', {name: /Select Bonus Products/i})
        expect(bonusButtons.length).toBeGreaterThan(0)
        await user.click(bonusButtons[0])

        expect(mockOnOpen).toHaveBeenCalledTimes(1)
        const {newBonusItems} = mockOnOpen.mock.calls[0][0]
        expect(Array.isArray(newBonusItems)).toBe(true)
        expect(newBonusItems).toHaveLength(1)
        expect(newBonusItems[0].maxBonusItems).toBe(2)
    })

    test('does not render bonus product call to action when all bonus products are in the cart', async () => {
        usePromotions.mockReturnValue({data: {data: [{id: 'promo-1', details: 'Promo 1'}]}})
        const mockBasketWithAllBonusItems = {
            basketId: 'test-basket-all-bonus',
            currency: 'USD',
            customerInfo: {customerId: 'test-customer', isRegistered: true},
            productItems: [
                {
                    itemId: 'item-1',
                    productId: 'product-1',
                    productName: 'Test Product',
                    quantity: 1,
                    price: 100,
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-1'
                },
                {
                    itemId: 'bonus-item-1',
                    productId: 'bonus-product-1',
                    productName: 'Bonus Product 1',
                    quantity: 2,
                    price: 10,
                    bonusProductLineItem: true,
                    bonusDiscountLineItemId: 'bonus-1',
                    priceAdjustments: [{price: -10, type: 'bonus', promotionId: 'promo-1'}]
                }
            ],
            bonusDiscountLineItems: [
                {
                    id: 'bonus-1',
                    bonusProducts: [{id: 'bonus-prod-1'}, {id: 'bonus-prod-2'}],
                    maxBonusItems: 3,
                    promotionId: 'promo-1'
                }
            ],
            shipments: [{shipmentId: 'me', shippingMethod: {id: 'some-shipping-method'}}]
        }

        render(<BonusProductsSelection basket={mockBasketWithAllBonusItems} />)

        // Ensure the component is rendered
        await waitFor(
            () => {
                expect(
                    screen.queryAllByRole('button', {name: /Select Bonus Products/i})
                ).toHaveLength(0)
            },
            {timeout: 2000}
        )
        // The count text may still be present, so we do not assert its absence
    })
})
