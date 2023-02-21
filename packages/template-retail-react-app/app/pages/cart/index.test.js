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
import {
    mockedGuestCustomer,
    mockShippingMethods,
    mockCustomerBaskets,
    mockEmptyBasket,
    mockCartVariant
} from '../../commerce-api/mock-data'
import mockVariant from '../../commerce-api/mocks/variant-750518699578M'
import {rest} from 'msw'

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
    limit: 1,
    data: [
        {
            calloutMsg: "10% off men's suits with coupon",
            details: 'exceptions apply',
            endDate: '2022-10-25T00:00Z',
            id: '10offsuits',
            name: "10% off men's suits",
            startDate: '2022-10-11T00:00Z'
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

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockProduct))
        }),
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json({data: [mockCartVariant]}))
        }),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
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

        expect(await screen.findByTestId('sf-cart-empty')).toBeInTheDocument()
    })
})

describe('Coupons tests', function () {
    beforeEach(() => {
        const mockCustomerBasketsWithSuit = {
            ...mockCustomerBaskets.baskets[0],
            shippingTotalTax: 0.38,
            taxTotal: 9.14,
            taxation: 'gross',
            currency: 'USD',
            productItems: [
                {
                    adjustedTax: 9.14,
                    basePrice: 191.99,
                    bonusProductLineItem: false,
                    gift: false,
                    itemId: '54c599fdace475d97aeec72453',
                    itemText: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
                    price: 191.99,
                    priceAfterItemDiscount: 191.99,
                    priceAfterOrderDiscount: 191.99,
                    productId: '750518699585M',
                    productName: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
                    quantity: 1,
                    shipmentId: 'me',
                    tax: 9.14,
                    taxBasis: 191.99,
                    taxClassId: 'standard',
                    taxRate: 0.05
                }
            ]
        }

        global.server.use(
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({total: 1, baskets: [mockCustomerBasketsWithSuit]})
                )
            }),
            rest.post('*/baskets/:basketId/coupons', (req, res, ctx) => {
                const basketWithCoupon = {
                    ...mockCustomerBasketsWithSuit,
                    couponItems: [
                        {
                            code: 'menssuits',
                            couponItemId: '565dd1c773fcb316d4c2ff9211',
                            statusCode: 'applied',
                            valid: true
                        }
                    ],
                    productItems: [
                        {
                            adjustedTax: 8.23,
                            basePrice: 191.99,
                            bonusProductLineItem: false,
                            gift: false,
                            itemId: '54c599fdace475d97aeec72453',
                            itemText: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
                            price: 191.99,
                            priceAdjustments: [
                                {
                                    appliedDiscount: {
                                        amount: 0.1,
                                        percentage: 10,
                                        type: 'percentage'
                                    },
                                    couponCode: 'menssuits',
                                    creationDate: '2023-02-15T18:04:27.857Z',
                                    custom: false,
                                    itemText: "10% off men's suits",
                                    lastModified: '2023-02-15T18:04:27.863Z',
                                    manual: false,
                                    price: -19.2,
                                    priceAdjustmentId: '3207da3927b865d676e68bcb60',
                                    promotionId: '10offsuits'
                                }
                            ],
                            priceAfterItemDiscount: 172.79,
                            priceAfterOrderDiscount: 172.79,
                            productId: '750518699585M',
                            productName: 'Black Single Pleat Athletic Fit Wool Suit - Edit',
                            quantity: 1,
                            shipmentId: 'me',
                            tax: 9.14,
                            taxBasis: 191.99,
                            taxClassId: 'standard',
                            taxRate: 0.05
                        }
                    ]
                }
                return res(ctx.delay(0), ctx.json(basketWithCoupon))
            }),
            rest.delete('*/baskets/:basketId/coupons/:couponId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockCustomerBasketsWithSuit))
            })
        )
    })
    test('Can apply and remove product-level coupon code with promotion', async () => {
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()

        // add coupon
        userEvent.click(screen.getByText('Do you have a promo code?'))
        userEvent.type(screen.getByLabelText('Promo Code'), 'MENSSUITS')
        userEvent.click(screen.getByText('Apply'))

        expect(await screen.findByText('Promotion applied')).toBeInTheDocument()
        expect(await screen.findByText(/MENSSUITS/i)).toBeInTheDocument()

        const cartItem = await screen.findByTestId('sf-cart-item-750518699585M')
        // Promotions discount
        expect(await within(cartItem).queryByText(/^-([A-Z]{2})?\$19\.20$/)).toBeInTheDocument()

        const orderSummary = screen.getByTestId('sf-order-summary')
        userEvent.click(within(orderSummary).getByText('Remove'))

        expect(await screen.findByText('Promotion removed')).toBeInTheDocument()
        await waitFor(async () => {
            const menSuit = await screen.queryByText(/MENSSUITS/i)
            const promotionDiscount = await within(cartItem).queryByText(/^-([A-Z]{2})?\$19\.20$/)
            expect(promotionDiscount).not.toBeInTheDocument()
            expect(menSuit).not.toBeInTheDocument()
            screen.logTestingPlaygroundURL()
        })
    })
})
