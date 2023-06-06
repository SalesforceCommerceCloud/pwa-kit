/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, within, fireEvent, waitFor, act} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import Cart from '@salesforce/retail-react-app/app/pages/cart/index'
import {
    mockShippingMethods,
    mockCustomerBaskets,
    mockEmptyBasket,
    mockCartVariant,
    mockedCustomerProductLists
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import mockVariant from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
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

// Set up and clean up
beforeEach(() => {
    global.server.use(
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockedCustomerProductLists))
        }),
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

        rest.put('*/shipments/me/shipping-method', (req, res, ctx) => {
            const basketWithShipment = {
                ...mockCustomerBaskets.baskets[0],
                shipments: [
                    {
                        ...mockCustomerBaskets.baskets[0].shipments[0],
                        shippingMethod: {
                            description: 'Order received within 7-10 business days',
                            id: 'GBP001',
                            name: 'Ground',
                            price: 7.99,
                            shippingPromotions: [
                                {
                                    calloutMsg: 'Free Shipping Amount Above 50',
                                    promotionId: 'FreeShippingAmountAbove50',
                                    promotionName: 'Free Shipping Amount Above 50'
                                }
                            ],
                            c_estimatedArrivalTime: '7-10 Business Days'
                        }
                    }
                ]
            }
            return res(ctx.delay(0), ctx.json(basketWithShipment))
        }),

        rest.get('*/shipments/me/shipping-methods', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockShippingMethods))
        }),

        rest.get('*/promotions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockPromotions))
        }),

        rest.patch('*/baskets/:basketId/items/:itemId', (req, res, ctx) => {
            const basket = mockCustomerBaskets.baskets[0]
            const updatedQuantityCustomerBasket = {
                ...basket,
                shipments: [
                    {
                        ...basket.shipments[0],
                        productItems: [
                            {
                                adjustedTax: 2.93,
                                basePrice: 61.43,
                                bonusProductLineItem: false,
                                gift: false,
                                itemId: '4a9af0a24fe46c3f6d8721b371',
                                itemText: 'Belted Cardigan With Studs',
                                price: 61.43,
                                priceAfterItemDiscount: 61.43,
                                priceAfterOrderDiscount: 61.43,
                                productId: '701642889830M',
                                productName: 'Belted Cardigan With Studs',
                                quantity: 3,
                                shipmentId: 'me',
                                tax: 2.93,
                                taxBasis: 61.43,
                                taxClassId: 'standard',
                                taxRate: 0.05
                            }
                        ]
                    }
                ]
            }
            return res(ctx.json(updatedQuantityCustomerBasket))
        })
    )
})
afterEach(() => {
    localStorage.clear()
})
jest.setTimeout(30000)

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

describe('Rendering tests', function () {
    test('Renders skeleton initially', async () => {
        renderWithProviders(<Cart />)

        expect(screen.getByTestId('sf-cart-skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('sf-cart-container')).not.toBeInTheDocument()
    })
})

// TODO: Fix flaky/broken test
// eslint-disable-next-line jest/no-disabled-tests
test.skip('Can update item quantity in the cart', async () => {
    renderWithProviders(<Cart />)
    await waitFor(async () => {
        expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()
    })

    const cartItem = await screen.findByTestId(
        `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
    )

    // TODO: Fix assertion
    // eslint-disable-next-line jest/valid-expect
    expect(within(cartItem).getByDisplayValue('2'))

    await act(async () => {
        const incrementButton = await within(cartItem).findByTestId('quantity-increment')

        // update item quantity
        fireEvent.pointerDown(incrementButton)
    })

    await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    await waitFor(() => {
        // TODO: Fix assertion
        // eslint-disable-next-line jest/valid-expect
        expect(within(cartItem).getByDisplayValue('3'))
    })

    await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
})

// TODO: Fix flaky/broken test
// eslint-disable-next-line jest/no-disabled-tests
describe.skip('Update quantity in product view', function () {
    beforeEach(() => {
        global.server.use(
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockCartVariant))
            })
        )
    })

    test('Can update item quantity from product view modal', async () => {
        const {user} = renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

        const cartItem = await screen.findByTestId(
            `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
        )

        const editCartButton = within(cartItem).getByRole('button', {name: 'Edit'})
        await user.click(editCartButton)

        const productView = screen.queryByTestId('product-view')

        const incrementButton = await within(productView).findByTestId('quantity-increment')
        // update item quantity
        fireEvent.pointerDown(incrementButton)
        // TODO: Fix assertion
        // eslint-disable-next-line jest/valid-expect
        expect(within(productView).getByDisplayValue('3'))

        const updateCartButtons = within(productView).getAllByRole('button', {name: 'Update'})
        await user.click(updateCartButtons[0])
        await waitFor(() => {
            expect(productView).not.toBeInTheDocument()
        })
        await waitFor(() => {
            // TODO: Fix assertion
            // eslint-disable-next-line jest/valid-expect
            expect(within(cartItem).getByDisplayValue('3'))
        })

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
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

    // TODO: Fix flaky/broken test
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('Can remove item from the cart', async () => {
        const {user} = renderWithProviders(<Cart />)

        let cartItem
        await waitFor(() => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

            cartItem = screen.getByTestId('sf-cart-item-701642889830M')
            expect(cartItem).toBeInTheDocument()
        })

        await user.click(within(cartItem).getByText(/remove/i))

        try {
            await user.click(screen.getByText(/yes, remove item/i))
        } catch {
            // On CI this remove-item button sometimes does not exist yet.
            // But if we then call `await screen.findByText(/yes, remove item/i)` at this point,
            // we would cause a timeout for some reason:
            // https://github.com/SalesforceCommerceCloud/pwa-kit/actions/runs/4631134309/jobs/8193613016
            console.warn('--- Exiting early to avoid this flaky test from timing out')
            return
        }

        await waitFor(
            () => {
                expect(screen.getByTestId('sf-cart-empty')).toBeInTheDocument()
            },
            {timeout: 20000}
        )
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
            shipments: [
                {
                    ...mockCustomerBaskets.baskets[0].shipments[0],
                    shippingMethod: {
                        description: 'Order received within 7-10 business days',
                        id: 'GBP001',
                        name: 'Ground',
                        price: 7.99,
                        shippingPromotions: [
                            {
                                calloutMsg: 'Free Shipping Amount Above 50',
                                promotionId: 'FreeShippingAmountAbove50',
                                promotionName: 'Free Shipping Amount Above 50'
                            }
                        ],
                        c_estimatedArrivalTime: '7-10 Business Days'
                    }
                }
            ],
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
        const mockSuitProduct = {
            ...mockVariant,
            id: '750518699585M'
        }

        global.server.use(
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({total: 1, baskets: [mockCustomerBasketsWithSuit]})
                )
            }),
            rest.get('*/products', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json({data: [mockSuitProduct]}))
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
        const {user} = renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()

        // add coupon
        await user.click(screen.getByText('Do you have a promo code?'))
        await user.type(screen.getByLabelText('Promo Code'), 'MENSSUITS')
        await user.click(screen.getByText('Apply'))

        expect(await screen.findByText('Promotion applied')).toBeInTheDocument()

        expect(await screen.findByText(/MENSSUITS/i)).toBeInTheDocument()

        const cartItem = await screen.findByTestId('sf-cart-item-750518699585M')
        // Promotions discount
        expect(within(cartItem).queryByText(/^-([A-Z]{2})?\$19\.20$/)).toBeInTheDocument()

        const orderSummary = screen.getByTestId('sf-order-summary')
        await user.click(within(orderSummary).getByText('Remove'))

        expect(await screen.findByText('Promotion removed')).toBeInTheDocument()
        await waitFor(async () => {
            const menSuit = screen.queryByText(/MENSSUITS/i)
            const promotionDiscount = within(cartItem).queryByText(/^-([A-Z]{2})?\$19\.20$/)
            expect(promotionDiscount).not.toBeInTheDocument()
            expect(menSuit).not.toBeInTheDocument()
        })
    })
})
