/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import React from 'react'
import {screen, within, fireEvent, waitFor} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import Cart from './index'
import userEvent from '@testing-library/user-event'
import useShopper from '../../commerce-api/hooks/useShopper'
import {mockedGuestCustomer, mockShippingMethods} from '../../commerce-api/mock-data'
import mockBasketWithSuit from '../../commerce-api/mocks/basket-with-suit'
import mockVariant from '../../commerce-api/mocks/variant-750518699578M'
import mockEmptyBasket from '../../commerce-api/mocks/empty-basket'
import {keysToCamel} from '../../commerce-api/utils'

jest.setTimeout(60000)

let mockedBasketResponse = keysToCamel(mockBasketWithSuit)
let mockedShippingMethodsResponse = keysToCamel(mockShippingMethods)

jest.mock('../../commerce-api/auth', () => {
    return class AuthMock {
        login() {
            return mockedGuestCustomer
        }
    }
})

jest.mock('../../commerce-api/einstein')

jest.mock('../../commerce-api/ocapi-shopper-baskets', () => {
    return class ShopperBasketsMock {
        async addCouponToBasket() {
            return mockedBasketResponse
        }
        async removeCouponFromBasket() {
            return mockedBasketResponse
        }
        async removeItemFromBasket() {
            return mockedBasketResponse
        }
        async updateItemInBasket() {
            return mockedBasketResponse
        }
        async updateShippingMethodForShipment() {
            return mockedBasketResponse
        }
        async getShippingMethodsForShipment() {
            return mockedShippingMethodsResponse
        }
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async getCustomerBaskets() {
                return {baskets: [mockedBasketResponse]}
            }
        },
        ShopperProducts: class ShopperProductsMock extends sdk.ShopperProducts {
            async getProducts() {
                return {data: [mockVariant]}
            }
            async getProduct() {
                return {
                    ...mockVariant,
                    id: '750518699660M',
                    variationValues: {
                        color: 'BLACKFB',
                        size: '050',
                        width: 'V'
                    },
                    c_color: 'BLACKFB',
                    c_isNew: true,
                    c_refinementColor: 'black',
                    c_size: '050',
                    c_width: 'V'
                }
            }
        },
        ShopperPromotions: class ShopperPromotionsMock extends sdk.ShopperPromotions {
            async getPromotions() {
                return {
                    count: 1,
                    data: [
                        {
                            calloutMsg: "10% off men's suits with coupon",
                            details: 'exceptions apply',
                            id: '10offsuits',
                            name: "10% off men's suits"
                        }
                    ],
                    total: 1
                }
            }
        }
    }
})

const WrappedCart = () => {
    useShopper()
    return <Cart />
}

// Set up and clean up
beforeAll(() => {
    jest.resetModules()
})
afterEach(() => {
    mockedBasketResponse = keysToCamel(mockBasketWithSuit)
    localStorage.clear()
})

test('Renders skeleton until customer and basket are loaded', () => {
    const {getByTestId, queryByTestId} = renderWithProviders(<Cart />)
    expect(getByTestId('sf-cart-skeleton')).toBeInTheDocument()
    expect(queryByTestId('sf-cart-container')).not.toBeInTheDocument()
})

test('Renders empty cart when there are no items', async () => {
    mockedBasketResponse = keysToCamel(mockEmptyBasket)
    renderWithProviders(<WrappedCart />)
    expect(await screen.findByTestId('sf-cart-empty')).toBeInTheDocument()
})

test('Renders cart components when there are items', async () => {
    renderWithProviders(<WrappedCart />)
    expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
    expect(screen.getByText(/Black Single Pleat Athletic Fit Wool Suit/i)).toBeInTheDocument()
})

test('Applies default shipping method to basket and renders estimated pricing', async () => {
    renderWithProviders(<WrappedCart />)
    expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()

    const summary = screen.getByTestId('sf-order-summary')
    expect(await within(summary).findByText(/promotion applied/i)).toBeInTheDocument()
    expect(within(summary).getByText(/free/i)).toBeInTheDocument()
    expect(within(summary).getByText(/\$30.00/i)).toBeInTheDocument()
})

test('Can update item quantity in the cart', async () => {
    renderWithProviders(<WrappedCart />)
    expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
    expect(screen.getByText(/Black Single Pleat Athletic Fit Wool Suit/i)).toBeInTheDocument()

    mockedBasketResponse = {
        ...mockedBasketResponse,
        productItems: [
            {
                ...mockedBasketResponse.productItems[0],
                quantity: 3,
                id: mockedBasketResponse.productItems[0].item_id,
                stepQuantity: 1
            }
        ]
    }

    const cartItem = await screen.findByTestId(
        `sf-cart-item-${mockedBasketResponse.productItems[0].productId}`
    )

    expect(await within(cartItem).getByDisplayValue('2'))

    const incrementButton = await within(cartItem).findByTestId('quantity-increment')

    // update item quantity
    fireEvent.pointerDown(incrementButton)

    await waitFor(() => {
        expect(within(cartItem).getByDisplayValue('3'))
    })
})

test('Can update item quantity from product view modal', async () => {
    renderWithProviders(<WrappedCart />)
    expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
    expect(screen.getByText(/Black Single Pleat Athletic Fit Wool Suit/i)).toBeInTheDocument()

    mockedBasketResponse = {
        ...mockedBasketResponse,
        productItems: [
            {
                ...mockedBasketResponse.productItems[0],
                quantity: 3,
                id: mockedBasketResponse.productItems[0].item_id
            }
        ]
    }

    const cartItem = await screen.findByTestId(
        `sf-cart-item-${mockedBasketResponse.productItems[0].productId}`
    )

    const editCartButton = within(cartItem).getByRole('button', {name: 'Edit'})
    userEvent.click(editCartButton)
    const productView = screen.getByTestId('product-view')
    expect(productView).toBeInTheDocument()
    // update item quantity
    expect(await within(cartItem).getByDisplayValue('2'))

    const incrementButton = await within(cartItem).findByTestId('quantity-increment')

    // update item quantity
    fireEvent.pointerDown(incrementButton)

    await waitFor(() => {
        expect(within(cartItem).getByDisplayValue('3'))
    })
})

test('Can remove item from the cart', async () => {
    renderWithProviders(<WrappedCart />)
    expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
    expect(screen.getByText(/Black Single Pleat Athletic Fit Wool Suit/i)).toBeInTheDocument()

    // remove item
    mockedBasketResponse = keysToCamel(mockEmptyBasket)
    const cartItem = await screen.findByTestId('sf-cart-item-750518699578M')
    userEvent.click(within(cartItem).getByRole('button', {name: /remove/i}))
    userEvent.click(screen.getByRole('button', {name: /yes, remove item/i}))

    expect(await screen.findByTestId('sf-cart-empty')).toBeInTheDocument()
})

test('Can apply and remove product-level coupon code with promotion', async () => {
    renderWithProviders(<WrappedCart />)
    expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()

    mockedBasketResponse = {
        ...mockedBasketResponse,
        couponItems: [
            {
                code: 'menssuits',
                couponItemId: 'c94c8a130c63caa6f786b89c5f',
                statusCode: 'applied',
                valid: true,
                _type: 'coupon_item'
            }
        ],
        productItems: [
            keysToCamel({
                _type: 'product_item',
                adjusted_tax: 13.5,
                base_price: 299.99,
                bonus_product_line_item: false,
                gift: false,
                item_id: '12d70b6c0c3cedd3523001906d',
                item_text: 'Black Single Pleat Athletic Fit Wool Suit',
                price: 299.99,
                price_adjustments: [
                    {
                        _type: 'price_adjustment',
                        applied_discount: {
                            _type: 'discount',
                            amount: 0.1,
                            percentage: 10.0,
                            type: 'percentage'
                        },
                        coupon_code: 'menssuits',
                        creation_date: '2021-06-07T12:31:05.234Z',
                        custom: false,
                        item_text: "10% off men's suits",
                        last_modified: '2021-06-07T12:31:05.252Z',
                        manual: false,
                        price: -30.0,
                        price_adjustment_id: 'eda472de37d9c7fdae7251c4a1',
                        promotion_id: '10offsuits',
                        promotion_link:
                            'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v21_3/promotions/10offsuits'
                    }
                ],
                price_after_item_discount: 269.99,
                price_after_order_discount: 269.99,
                product_id: '750518699578M',
                product_name: 'Black Single Pleat Athletic Fit Wool Suit',
                quantity: 1,
                shipment_id: 'me',
                tax: 15.0,
                tax_basis: 299.99,
                tax_class_id: 'standard',
                tax_rate: 0.05
            })
        ]
    }

    // add coupon
    userEvent.click(screen.getByText('Do you have a promo code?'))
    userEvent.type(screen.getByLabelText('Promo Code'), 'MENSSUITS')
    userEvent.click(screen.getByText('Apply'))
    expect(await screen.findByText(/MENSSUITS/i)).toBeInTheDocument()

    const cartItem = await screen.findByTestId('sf-cart-item-750518699578M')
    expect(await within(cartItem).findByText(/^-([A-Z]{2})?\$30\.00$/)).toBeInTheDocument()

    // remove coupon
    mockedBasketResponse = keysToCamel(mockBasketWithSuit)
    const orderSummary = screen.getByTestId('sf-order-summary')
    userEvent.click(within(orderSummary).getByText('Remove'))

    expect(await screen.findByText('Promotion removed')).toBeInTheDocument()
    expect(await screen.queryByText(/MENSSUITS/i)).not.toBeInTheDocument()
    expect(await within(cartItem).queryByText(/^-([A-Z]{2})?\$30\.00$/)).not.toBeInTheDocument()
})
