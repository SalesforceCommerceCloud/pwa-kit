/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-unused-vars */
import React from 'react'
import {screen, within, fireEvent, waitFor, act} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import Cart from './index'
import userEvent from '@testing-library/user-event'
import {
    mockShippingMethods,
    mockCustomerBaskets,
    mockEmptyBasket,
    mockCartVariant
} from '../../mocks/mock-data'
import mockVariant from '../../mocks/variant-750518699578M'
// import {rest} from 'msw'
import {createServer} from '../../../jest-setup'
import {mockProductLists} from '../../mocks/product-lists'
import {mockCustomerBasketsWithSuit, mockSuitProduct} from '../../mocks/basket-with-suit'

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
    jest.clearAllMocks()
    jest.resetModules()
})
afterEach(() => {
    localStorage.clear()
})

const cartHandlers = [
    {
        path: '*/products/:productId',
        res: () => {
            return mockProduct
        }
    },
    {
        path: '*/products',
        res: () => {
            return {data: [mockCartVariant]}
        }
    },
    {
        path: '*/product-lists',
        res: () => {
            return mockProductLists
        }
    },
    {
        path: '*/baskets/:basketId/shipments/:shipmentId',
        method: 'put',
        res: () => {
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
            return updatedBasketWithShippingMethod
        }
    },
    {
        path: '*/baskets/:basketId/shipments',
        res: () => {
            return mockShippingMethods
        }
    },
    {
        path: '*/shipments/me/shipping-method',
        method: 'put',
        res: () => {
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
            return basketWithShipment
        }
    },
    {
        path: '*/shipments/me/shipping-methods',
        res: () => {
            return mockShippingMethods
        }
    },
    {
        path: '*/promotions',
        res: () => {
            return mockPromotions
        }
    },
    {
        path: '*/baskets/:basketId/items/:itemId',
        method: 'patch',
        res: () => {
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
            return updatedQuantityCustomerBasket
        }
    }
]
jest.setTimeout(30000)

describe('Empty cart tests', function () {
    createServer([
        ...cartHandlers,
        {
            path: '*/customers/:customerId/baskets',
            res: () => {
                return mockEmptyBasket
            }
        }
    ])

    test('Renders empty cart when there are no items', async () => {
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-empty')).toBeInTheDocument()
    })
})

describe('Rendering tests', function () {
    createServer([
        ...cartHandlers,
        {
            path: '*/customers/:customerId/baskets',
            res: () => {
                return mockCustomerBaskets
            }
        }
    ])
    test('Renders skeleton before rendering cart items, shipping info', async () => {
        renderWithProviders(<Cart />)
        await waitFor(() => {
            expect(screen.getByTestId('sf-cart-skeleton')).toBeInTheDocument()
            expect(screen.queryByTestId('sf-cart-container')).not.toBeInTheDocument()
        })
        await waitFor(async () => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()
        })
        const summary = screen.getByTestId('sf-order-summary')
        expect(await within(summary).findByText(/promotion applied/i)).toBeInTheDocument()
        expect(within(summary).getByText(/free/i)).toBeInTheDocument()
        expect(within(summary).getAllByText(/61.43/i).length).toEqual(2)
    })
})
// describe('Update item in cart', function () {
// test.skip('Can update item quantity in the cart', async () => {
//     renderWithProviders(<Cart />)
//     await waitFor(async () => {
//         expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
//         expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()
//     })
//
//     const cartItem = await screen.findByTestId(
//         `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
//     )
//
//     expect(await within(cartItem).getByDisplayValue('2'))
//
//     await act(async () => {
//         const incrementButton = await within(cartItem).findByTestId('quantity-increment')
//
//         // update item quantity
//         fireEvent.pointerDown(incrementButton)
//     })
//
//     await waitFor(() => {
//         expect(screen.getByTestId('loading')).toBeInTheDocument()
//     })
//
//     await waitFor(() => {
//         expect(within(cartItem).getByDisplayValue('3'))
//     })
//
//     await waitFor(() => {
//         expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
//     })
// })
// })

describe('Update quantity in product view', function () {
    createServer([
        ...cartHandlers,
        {
            path: '*/products/:productId',
            res: () => {
                return mockCartVariant
            }
        },
        {
            path: '*/customers/:customerId/baskets',
            res: () => {
                return mockCustomerBaskets
            }
        }
    ])
    test('Can update item quantity from product view modal', async () => {
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

        const cartItem = await screen.findByTestId(
            `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
        )

        const editCartButton = within(cartItem).getByRole('button', {name: 'Edit'})
        await act(async () => {
            userEvent.click(editCartButton)
        })

        const productView = screen.queryByTestId('product-view')

        await act(async () => {
            const incrementButton = await within(productView).findByTestId('quantity-increment')
            // update item quantity
            fireEvent.pointerDown(incrementButton)
            expect(within(productView).getByDisplayValue('3'))

            const updateCartButtons = within(productView).getAllByRole('button', {name: 'Update'})
            userEvent.click(updateCartButtons[0])
        })
        await waitFor(() => {
            expect(productView).not.toBeInTheDocument()
        })
        await waitFor(() => {
            expect(within(cartItem).getByDisplayValue('3'))
        })

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
        })
    })
})

describe('Remove item from cart', function () {
    createServer([
        ...cartHandlers,
        {
            path: '*/products/:productId',
            res: () => {
                return mockCartVariant
            }
        },
        {
            path: '*/customers/:customerId/baskets',
            res: () => {
                return mockCustomerBaskets
            }
        },
        {
            path: '*/baskets/:basket/items/:itemId',
            method: 'delete',
            res: () => {
                return mockEmptyBasket.baskets[0]
            }
        }
    ])
    test('Can remove item from the cart', async () => {
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

        // remove item
        const cartItem = await screen.findByTestId('sf-cart-item-701642889830M')

        userEvent.click(within(cartItem).getByRole('button', {name: /remove/i}))
        userEvent.click(screen.getByRole('button', {name: /yes, remove item/i}))

        await waitFor(
            () => {
                expect(screen.getByTestId('sf-cart-empty')).toBeInTheDocument()
            },
            {timeout: 20000}
        )
    })
})

describe('Coupons tests', function () {
    createServer([
        ...cartHandlers,
        {
            path: '*/customers/:customerId/baskets',
            res: () => {
                return {baskets: [mockCustomerBasketsWithSuit], total: 1}
            }
        },
        {
            path: '*/baskets/:basketId/coupons',
            method: 'post',
            res: () => {
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
                return basketWithCoupon
            }
        },
        {
            path: '*/baskets/:basketId/coupons/:couponId',
            method: 'delete',
            res: () => {
                return mockCustomerBasketsWithSuit
            }
        }
    ])
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
        })
    })
})
