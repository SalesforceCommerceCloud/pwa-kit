/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, within, waitFor, act} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import Cart from '../../pages/cart/index'
import {
    mockShippingMethods,
    mockCustomerBaskets,
    mockEmptyBasket,
    mockCartVariant,
    mockedCustomerProductLists
} from '../../../mocks/mock-data'
import mockVariant from '../../../mocks/variant-750518699578M'
import {
    mockProductBundle,
    mockGetBundleChildrenProducts,
    basketWithProductBundle
} from '../../../mocks/product-bundle'
import {prependHandlersToServer} from '../../../jest-setup'
import {baskets as mockBaskets, products as mockProducts} from '../../pages/cart/cart.mock'

// mock the Black Single Pleat Athletic Fit Wool Suit variationValues
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

const mockProductBundleBasket = {
    baskets: [
        {
            ...basketWithProductBundle
        }
    ],
    total: 1
}

// Set up and clean up
beforeEach(() => {
    prependHandlersToServer([
        {
            path: '*/customers/:customerId/product-lists',
            method: 'get',
            res: () => mockedCustomerProductLists
        },
        {
            path: '*/products/:productId',
            method: 'get',
            res: () => mockProduct
        },
        {
            path: '*/products',
            method: 'get',
            res: () => ({data: [mockCartVariant]})
        },
        {
            path: '*/baskets/:basketId/shipments/:shipmentId',
            method: 'put',
            res: () => {
                const basket = mockCustomerBaskets.baskets[0]
                return {
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
            }
        },
        {
            path: '*/baskets/:basketId/shipments',
            method: 'get',
            res: () => mockShippingMethods
        },
        {
            path: '*/shipments/me/shipping-method',
            method: 'put',
            res: () => {
                return {
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
            }
        },
        {
            path: '*/shipments/me/shipping-methods',
            method: 'get',
            res: () => mockShippingMethods
        },
        {
            path: '*/promotions',
            method: 'get',
            res: () => mockPromotions
        }
    ])
})
afterEach(() => {
    jest.restoreAllMocks()
    localStorage.clear()
})
jest.setTimeout(30000)

describe('Empty cart tests', function () {
    beforeEach(() => {
        prependHandlersToServer([
            {
                path: '*/customers/:customerId/baskets',
                method: 'get',
                res: () => mockEmptyBasket
            }
        ])
    })

    test('Renders empty cart when there are no items', async () => {
        renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-empty')).toBeInTheDocument()
    })
})

describe('Skeleton tests', function () {
    test('Renders skeleton initially', async () => {
        renderWithProviders(<Cart />)

        expect(screen.getByTestId('sf-cart-skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('sf-cart-container')).not.toBeInTheDocument()
    })
})

describe('Cart tests', () => {
    test('Can update item quantity in the cart', async () => {
        const {user} = renderWithProviders(<Cart />)
        await waitFor(async () => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()
        })

        const cartItem = await screen.findByTestId(
            `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
        )

        expect(within(cartItem).getByDisplayValue('2')).toBeInTheDocument()

        const incrementButton = await within(cartItem).findByTestId('quantity-increment')

        await act(async () => {
            await user.click(incrementButton)
        })
        // Mock the PATCH request for updating basket item quantity
        prependHandlersToServer([
            {
                path: '*/baskets/*/items/*',
                method: 'patch',
                res: () => {
                    // Return updated basket with incremented quantity
                    return {
                        ...mockCustomerBaskets.baskets[0],
                        productItems: mockCustomerBaskets.baskets[0].productItems.map((item) => ({
                            ...item,
                            quantity: item.quantity + 1
                        }))
                    }
                }
            }
        ])

        await waitFor(() => {
            expect(within(cartItem).getByDisplayValue('3')).toBeInTheDocument()
        })
    })
})

describe('Product view tests', function () {
    beforeEach(() => {
        prependHandlersToServer([
            {
                path: '*/products/:productId',
                method: 'get',
                res: () => mockCartVariant
            }
        ])
    })

    test('Can update item quantity from product view modal', async () => {
        const {user} = renderWithProviders(<Cart />)
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()
        expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

        const cartItem = await screen.findByTestId(
            `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
        )

        // Mock the PATCH request for updating basket item quantity before opening modal
        prependHandlersToServer([
            {
                path: '*/baskets/*/items/*',
                method: 'patch',
                res: () => {
                    // Return updated basket with incremented quantity
                    return {
                        ...mockCustomerBaskets.baskets[0],
                        productItems: mockCustomerBaskets.baskets[0].productItems.map((item) => ({
                            ...item,
                            quantity: item.quantity + 1
                        }))
                    }
                }
            }
        ])

        const editCartButton = within(cartItem).getByRole('button', {name: 'Edit'})
        await act(async () => {
            await user.click(editCartButton)
        })

        // Wait for the product view modal to appear
        const productView = await screen.findByTestId('product-view')
        expect(productView).toBeInTheDocument()

        const incrementButton = await within(productView).findByTestId('quantity-increment')

        // update item quantity
        await act(async () => {
            await user.click(incrementButton)
        })

        await waitFor(() => {
            expect(within(productView).getByDisplayValue('3')).toBeInTheDocument()
        })

        const updateCartButtons = within(productView).getAllByRole('button', {name: 'Update'})
        await act(async () => {
            await user.click(updateCartButtons[0])
        })

        await waitFor(() => {
            expect(productView).not.toBeInTheDocument()
        })

        // Re-find the cart item to avoid stale element references
        const updatedCartItem = await screen.findByTestId(
            `sf-cart-item-${mockCustomerBaskets.baskets[0].productItems[0].productId}`
        )

        await waitFor(() => {
            expect(within(updatedCartItem).getByDisplayValue('3')).toBeInTheDocument()
        })
    })
})

describe('Remove item from cart', function () {
    beforeEach(() => {
        prependHandlersToServer([
            {
                path: '*/baskets/:basket/items/:itemId',
                method: 'delete',
                res: () => mockEmptyBasket.baskets[0]
            }
        ])
    })

    test('Can remove item from the cart', async () => {
        const {user} = renderWithProviders(<Cart />)

        let cartItem
        await waitFor(() => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

            cartItem = screen.getByTestId('sf-cart-item-701642889830M')
            expect(cartItem).toBeInTheDocument()
        })

        await act(async () => {
            await user.click(within(cartItem).getByText(/remove/i))
        })

        try {
            // act will wait for modal to disappear before asserting to avoid react warning
            await act(async () => {
                await user.click(screen.getByText(/yes, remove item/i))
            })
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

        prependHandlersToServer([
            {
                path: '*/customers/:customerId/baskets',
                method: 'get',
                res: () => ({total: 1, baskets: [mockCustomerBasketsWithSuit]})
            },
            {
                path: '*/products',
                method: 'get',
                res: () => ({data: [mockSuitProduct]})
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
                res: () => mockCustomerBasketsWithSuit
            }
        ])
    })
    test('Can apply and remove product-level coupon code with promotion', async () => {
        const {user} = renderWithProviders(<Cart />)

        // Wait for cart to fully load
        expect(await screen.findByTestId('sf-cart-container')).toBeInTheDocument()

        // There are a lot of warnings about using act regarding to form.reset()
        // This comes from the setState coming within react-hook-form.
        // using act here to ensure these set state are cleaned up properly
        await act(async () => {
            await user.click(screen.getByText('Do you have a promo code?'))
            await user.type(screen.getByLabelText('Promo Code'), 'menssuits')
            await user.click(screen.getByText('Apply'))
        })

        await waitFor(async () => {
            expect(screen.getByText(/Promotion applied/)).toBeInTheDocument()
        })

        expect(await screen.findByText(/menssuits/i)).toBeInTheDocument()

        const cartItem = await screen.findByTestId('sf-cart-item-750518699585M')
        // Promotions discount
        expect(within(cartItem).queryByText(/^-([A-Z]{2})?\$19\.20$/)).toBeInTheDocument()

        const orderSummary = screen.getByTestId('sf-order-summary')

        await waitFor(() => {
            expect(within(orderSummary).getByText('Remove')).toBeInTheDocument()
        })

        await act(async () => {
            await user.click(within(orderSummary).getByText('Remove'))
        })
        await waitFor(async () => {
            const menSuit = screen.queryByText(/menssuits/i)
            const promotionDiscount = within(cartItem).queryByText(/^-([A-Z]{2})?\$19\.20$/)
            expect(promotionDiscount).not.toBeInTheDocument()
            expect(menSuit).not.toBeInTheDocument()
        })
    })
})
describe('Gift option tests', function () {
    beforeEach(() => {
        prependHandlersToServer([
            {
                path: '*/baskets/:basketId/items/:itemId',
                method: 'patch',
                res: () => {
                    const basket = mockCustomerBaskets.baskets[0]
                    return {
                        ...basket,
                        productItems: [
                            {
                                adjustedTax: 2.93,
                                basePrice: 61.43,
                                bonusProductLineItem: false,
                                gift: true,
                                itemId: '4a9af0a24fe46c3f6d8721b371',
                                itemText: 'Belted Cardigan With Studs',
                                price: 61.43,
                                priceAfterItemDiscount: 61.43,
                                priceAfterOrderDiscount: 61.43,
                                productId: '701642889830M',
                                productName: 'Belted Cardigan With Studs',
                                quantity: 2,
                                shipmentId: 'me',
                                tax: 2.93,
                                taxBasis: 61.43,
                                taxClassId: 'standard',
                                taxRate: 0.05
                            }
                        ]
                    }
                }
            }
        ])
    })
    test('can update item when user clicks this is a gift checkbox', async () => {
        const {user} = renderWithProviders(<Cart />)
        await waitFor(() => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

            const cartItem = screen.getByTestId('sf-cart-item-701642889830M')
            expect(cartItem).toBeInTheDocument()
        })

        const giftCheckbox = screen.getByRole('checkbox')
        expect(giftCheckbox).not.toBeChecked()
        await act(async () => {
            await user.click(giftCheckbox)
        })
        prependHandlersToServer([
            {
                path: '*/customers/:customerId/baskets',
                method: 'get',
                res: () => ({
                    baskets: [
                        {
                            ...mockCustomerBaskets.baskets[0],
                            productItems: [
                                {
                                    adjustedTax: 2.93,
                                    basePrice: 61.43,
                                    bonusProductLineItem: false,
                                    gift: true,
                                    itemId: '4a9af0a24fe46c3f6d8721b371',
                                    itemText: 'Belted Cardigan With Studs',
                                    price: 61.43,
                                    priceAfterItemDiscount: 61.43,
                                    priceAfterOrderDiscount: 61.43,
                                    productId: '701642889830M',
                                    productName: 'Belted Cardigan With Studs',
                                    quantity: 2,
                                    shipmentId: 'me',
                                    tax: 2.93,
                                    taxBasis: 61.43,
                                    taxClassId: 'standard',
                                    taxRate: 0.05
                                }
                            ]
                        }
                    ],
                    total: 1
                })
            }
        ])

        await waitFor(() => {
            expect(giftCheckbox).toBeChecked()
        })
    })
})

describe('Product bundles', () => {
    beforeEach(() => {
        prependHandlersToServer([
            {
                path: '*/customers/:customerId/baskets',
                method: 'get',
                res: () => mockProductBundleBasket
            },
            {
                path: '*/products/:productId',
                method: 'get',
                res: () => mockProductBundle
            },
            {
                path: '*/products',
                method: 'get',
                res: (req) => {
                    if (req.url.toString().includes('test-bundle')) {
                        return {data: [{...mockProductBundle}]}
                    }
                    return {data: [...mockGetBundleChildrenProducts]}
                }
            },
            {
                path: '*/baskets/:basketId/items',
                method: 'patch',
                res: () => {
                    const curretProductItems = basketWithProductBundle.productItems[0]
                    return {
                        ...basketWithProductBundle,
                        productItems: [
                            {
                                ...curretProductItems,
                                quantity: 2,
                                bundledProductItems: curretProductItems.bundledProductItems.map(
                                    (bundleChild) => ({
                                        ...bundleChild,
                                        quantity: bundleChild.quantity * 2
                                    })
                                )
                            }
                        ]
                    }
                }
            },
            {
                path: '*/baskets/:basketId/items/:itemId',
                method: 'patch',
                res: () => ({})
            }
        ])
    })

    test('displays inventory message when incrementing quantity above available stock', async () => {
        const {user} = renderWithProviders(<Cart />)

        await waitFor(
            async () => {
                expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
                expect(screen.getAllByText(/women's clothing test bundle/i)[0]).toBeInTheDocument()
                expect(
                    screen.getByText(/Sleeveless Pleated Floral Front Blouse/i)
                ).toBeInTheDocument()
                expect(screen.getByText(/swing tank/i)).toBeInTheDocument()
                expect(screen.getByText(/pull on neutral pant/i)).toBeInTheDocument()
            },
            {timeout: 10000}
        )

        // Change quantity for bundle to 4, swing tank only has 3 in stock
        // so availability message should show up
        const quantityElement = screen.getByRole('spinbutton', {id: 'quantity'})
        expect(quantityElement).toBeInTheDocument()
        expect(quantityElement).toHaveValue('1')

        await act(async () => {
            // Clear the input and type the new value
            await user.clear(quantityElement)
            await user.type(quantityElement, '4')
        })
        await waitFor(
            () => {
                expect(quantityElement).toHaveValue('4')
                expect(screen.getByText(/only 3 left for swing tank!/i)).toBeInTheDocument()
            },
            {timeout: 10000}
        )
    })

    test('renders in cart with variant selections', async () => {
        renderWithProviders(<Cart />)

        await waitFor(
            async () => {
                expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
                expect(screen.getByText(/women's clothing test bundle/i)).toBeInTheDocument()

                // child product 1
                expect(
                    screen.getByText(/Sleeveless Pleated Floral Front Blouse/i)
                ).toBeInTheDocument()
                expect(screen.getByText(/colour: tulip multi/i)).toBeInTheDocument()
                const quantityQuery = screen.getAllByText(/qty: 1/i) // Two child products have `Qty: 1`
                expect(quantityQuery).toHaveLength(2)
                expect(quantityQuery[0]).toBeInTheDocument()

                // child product 2
                expect(screen.getByText(/swing tank/i)).toBeInTheDocument()
                expect(screen.getByText(/colour: dk meadown rose/i)).toBeInTheDocument()
                expect(screen.getByText(/size: xs/i)).toBeInTheDocument()
                expect(quantityQuery[1]).toBeInTheDocument()

                // child product 3
                expect(screen.getByText(/pull on neutral pant/i)).toBeInTheDocument()
                expect(screen.getByText(/colour: black & sugar/i)).toBeInTheDocument()
                expect(screen.getByText(/size: s/i)).toBeInTheDocument()
                expect(screen.getByText(/qty: 2/i)).toBeInTheDocument()
            },
            {timeout: 10000}
        )
    })

    test('can be updated using the product view modal', async () => {
        const {user} = renderWithProviders(<Cart />)
        await waitFor(async () => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            // Parent bundle
            expect(screen.getByText(/women's clothing test bundle/i)).toBeInTheDocument()
            // bundle children
            expect(screen.getByText(/Sleeveless Pleated Floral Front Blouse/i)).toBeInTheDocument()
            expect(screen.getByText(/swing tank/i)).toBeInTheDocument()
            expect(screen.getByText(/pull on neutral pant/i)).toBeInTheDocument()

            // Two children have qty 1, one child has qty 2
            expect(screen.getAllByText(/qty: 1/i)).toHaveLength(2)
            expect(screen.getByText(/qty: 2/i)).toBeInTheDocument()
        })

        const editCartButton = screen.getByRole('button', {
            name: /edit/i,
            hidden: true
        })
        await act(async () => {
            await user.click(editCartButton)
        })
        let productViewModal
        await waitFor(
            async () => {
                productViewModal = screen.getByTestId('product-view-modal')
                expect(productViewModal).toBeInTheDocument()
            },
            {timeout: 10000}
        )

        const quantityElement = within(productViewModal).getByRole('spinbutton', {id: 'quantity'})
        expect(quantityElement).toHaveValue('1')
        const incrementButton = await within(productViewModal).findByTestId('quantity-increment')

        await act(async () => {
            // Use user event to click the increment button
            await user.click(incrementButton)
        })
        await waitFor(async () => {
            expect(quantityElement).toHaveValue('2')
        })

        const updateCartButtons = within(productViewModal).getAllByRole('button', {name: 'Update'})
        await act(async () => {
            await user.click(updateCartButtons[0])
        })

        await waitFor(() => {
            expect(productViewModal).not.toBeInTheDocument()
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument()

            // Parent bundle quantity is now 2
            expect(screen.getByLabelText('Quantity')).toHaveValue('2')

            // Two children should have qty 2, one child should have qty 4
            expect(screen.getAllByText(/qty: 2/i)).toHaveLength(2)
            expect(screen.getByText(/qty: 4/i)).toBeInTheDocument()
        })
    })
})

describe('Unavailable products tests', function () {
    test('Remove unavailable/out of stock/low stock products from cart', async () => {
        prependHandlersToServer([
            {path: '*/customers/:customerId/baskets', res: () => mockBaskets},
            {path: '*/products', res: () => mockProducts}
        ])

        const {user, getByText} = renderWithProviders(<Cart />)
        await waitFor(() => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            expect(screen.getByText(/Worn Gold Dangle Earring/i)).toBeInTheDocument()
            expect(screen.getByText(/Straight Leg Trousers/i)).toBeInTheDocument()
        })

        await waitFor(async () => {
            expect(getByText(/Items Unavailable/i)).toBeVisible()
            expect(
                getByText(
                    /Some items are no longer available online and will be removed from your cart./i
                )
            ).toBeVisible()
        })
        await waitFor(async () => {
            expect(getByText(/Items Unavailable/i)).toBeVisible()
            expect(
                getByText(
                    /Some items are no longer available online and will be removed from your cart./i
                )
            ).toBeVisible()
        })

        const removeBtn = screen.getByRole('button', {
            name: /remove unavailable products/i
        })
        expect(removeBtn).toBeInTheDocument()

        prependHandlersToServer([
            {
                path: '*/baskets/:basket/items/:itemId',
                method: 'delete',
                res: () => {
                    return {
                        ...mockBaskets.baskets[0],
                        productItems: [
                            {
                                adjustedTax: 3.05,
                                basePrice: 12.8,
                                bonusProductLineItem: false,
                                gift: false,
                                itemId: '7b1a03848f0807f99f37ea93e4',
                                itemText: 'Worn Gold Dangle Earring',
                                price: 64,
                                priceAfterItemDiscount: 64,
                                priceAfterOrderDiscount: 64,
                                productId: '013742335262M',
                                productName: 'Worn Gold Dangle Earring',
                                quantity: 5,
                                shipmentId: 'me',
                                shippingItemId: '247699907591b6b94c9f38cf08',
                                tax: 3.05,
                                taxBasis: 64,
                                taxClassId: 'standard',
                                taxRate: 0.05
                            }
                        ]
                    }
                }
            }
        ])
        await act(async () => {
            await user.click(removeBtn)
        })
        await waitFor(() => {
            expect(
                screen.getByRole('link', {name: /Worn Gold Dangle Earring$/i})
            ).toBeInTheDocument()
            expect(
                screen.queryByRole('link', {name: /Straight Leg Trousers$/i})
            ).not.toBeInTheDocument()
        })
    })
})
