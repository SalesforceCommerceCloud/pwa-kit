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
import {
    mockedGuestCustomer,
    mockShippingMethods,
    mockCustomerBaskets,
    mockEmptyBasket,
    mockCartVariant
} from '../../commerce-api/mock-data'
import mockBasketWithSuit from '../../commerce-api/mocks/basket-with-suit'
import mockVariant from '../../commerce-api/mocks/variant-750518699578M'
// import mockEmptyBasket from '../../commerce-api/mocks/empty-basket'
import {keysToCamel} from '../../commerce-api/utils'
import {rest} from 'msw'

jest.setTimeout(60000)

let mockedBasketResponse = keysToCamel(mockBasketWithSuit)
let mockedShippingMethodsResponse = keysToCamel(mockShippingMethods)

const mockProduct = {
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
const mockPromotions = {
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

jest.mock('../../commerce-api/auth', () => {
    return class AuthMock {
        login() {
            return mockedGuestCustomer
        }
    }
})

jest.mock('../../commerce-api/einstein')

// jest.mock('../../commerce-api/ocapi-shopper-baskets', () => {
//     return class ShopperBasketsMock {
//         async addCouponToBasket() {
//             return mockedBasketResponse
//         }
//         async removeCouponFromBasket() {
//             return mockedBasketResponse
//         }
//         async removeItemFromBasket() {
//             return mockedBasketResponse
//         }
//         async updateItemInBasket() {
//             return mockedBasketResponse
//         }
//         async updateShippingMethodForShipment() {
//             return mockedBasketResponse
//         }
//         async getShippingMethodsForShipment() {
//             return mockedShippingMethodsResponse
//         }
//     }
// })

const WrappedCart = () => {
    // useShopper()
    return <Cart />
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            console.log('productId---------------------')
            return res(ctx.delay(0), ctx.json(mockProduct))
        }),
        rest.get('*/products', (req, res, ctx) => {
            console.log('product------------------111')
            return res(ctx.delay(0), ctx.json({data: [mockCartVariant]}))
        }),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            console.log('customerBasket11111111')
            return res(ctx.delay(0), ctx.json(mockCustomerBaskets))
        }),

        rest.put('*/baskets/:basketId/shipments/:shipmentId', (req, res, ctx) => {
            const basket = mockCustomerBaskets.baskets[0]
            const updatedBasketWithShippingMethod = {
                ...basket,
                shipments: [
                    {
                        ...basket.shipments[0],
                        shippingMethod: {
                            description: 'Order received the next business day',
                            id: '003',
                            name: 'Overnight',
                            price: 29.99
                        },
                        shippingAddress: {
                            address1: '4911  Lincoln Street',
                            postalCode: '97350',
                            city: 'IDANHA',
                            countryCode: 'US',
                            firstName: 'Ward J',
                            fullName: 'Ward J Adamek',
                            id: 'b3e1269a2c1d0ad56694206741',
                            lastName: 'Adamek',
                            stateCode: 'OR'
                        }
                    }
                ]
            }
            return res(ctx.delay(0), ctx.json(updatedBasketWithShippingMethod))
        }),
        rest.get('*/baskets/:basketId/shipments', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockShippingMethods))
        }),

        rest.get('*/promotions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockPromotions))
        })
    )
})
afterEach(() => {
    localStorage.clear()
})

test('Renders skeleton until customer and basket are loaded', () => {
    const {getByTestId, queryByTestId} = renderWithProviders(<Cart />)
    expect(getByTestId('sf-cart-skeleton')).toBeInTheDocument()
    expect(queryByTestId('sf-cart-container')).not.toBeInTheDocument()
})

describe('Empty cart tests', function () {
    beforeEach(() => {
        global.server.use(
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockEmptyBasket))
            })
        )
    })
    test('Renders empty cart when there are no items', async () => {
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-empty')).toBeInTheDocument()
    })
})
test('Renders cart components when there are items', async () => {
    renderWithProviders(<Cart />)
    await waitFor(async () => {
        expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()
    })
})

test('Applies default shipping method to basket and renders estimated pricing', async () => {
    renderWithProviders(<Cart />)
    expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()

    const summary = screen.getByTestId('sf-order-summary')
    expect(await within(summary).findByText(/promotion applied/i)).toBeInTheDocument()
    screen.logTestingPlaygroundURL()
    expect(within(summary).getByText(/free/i)).toBeInTheDocument()
    expect(within(summary).getAllByText(/61.43/i).length).toEqual(2)
})

describe('Update quantity', function () {
    test('Can update item quantity in the cart', async () => {
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

        const cartItem = await screen.findByTestId(
            `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
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
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

        const cartItem = await screen.findByTestId(
            `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
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
})

describe('Remove item from cart', function () {
    beforeEach(() => {
        global.server.use(
            rest.delete('*/baskets/:basket/items/:itemId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockEmptyBasket.baskets[0]))
            })
        )
    })
    test('Can remove item from the cart', async () => {
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

        // remove item
        const cartItem = await screen.findByTestId('sf-cart-item-701642889830M')

        userEvent.click(within(cartItem).getByRole('button', {name: /remove/i}))
        userEvent.click(screen.getByRole('button', {name: /yes, remove item/i}))
        screen.logTestingPlaygroundURL()

        expect(await screen.findByTestId('sf-cart-empty')).toBeInTheDocument()
    })
})

describe('Coupons tests', function () {
    beforeEach(() => {
        global.server.use(
            rest.post('*/baskets/:basket/items/:itemId', (req, res, ctx) => {
                const basketWithCoupon = {
                    ...mockCustomerBaskets.baskets[0],
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
                        {
                            ...mockCustomerBaskets.baskets[0].productItems[0]
                        }
                    ]
                }
                return res(ctx.delay(0), ctx.json())
            })
        )
    })
    test.skip('Can apply and remove product-level coupon code with promotion', async () => {
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

        expect(await screen.findByText('Promotion applied')).toBeInTheDocument()
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
})
