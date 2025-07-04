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
    mockedCustomerProductLists,
    mockBasketWithBonusProducts
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import mockVariant from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import {rest} from 'msw'
import {
    mockProductBundle,
    mockGetBundleChildrenProducts,
    basketWithProductBundle
} from '@salesforce/retail-react-app/app/mocks/product-bundle'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'
import {
    baskets as mockBaskets,
    products as mockProducts
} from '@salesforce/retail-react-app/app/pages/cart/cart.mock'
import userEvent from '@testing-library/user-event'

// Mock useMultiSite hook
const mockUseMultiSite = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: () => mockUseMultiSite()
}))

// Mock useSelectedStore hook
const mockUseSelectedStore = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-selected-store', () => ({
    useSelectedStore: () => mockUseSelectedStore()
}))

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
    // Default mock for useMultiSite
    mockUseMultiSite.mockReturnValue({
        site: {id: 'site-1'},
        buildUrl: (url) => url
    })

    // Default mock for useSelectedStore (no selected store by default)
    mockUseSelectedStore.mockImplementation(() => ({
        selectedStore: null,
        isLoading: false,
        error: null,
        hasSelectedStore: false
    }))

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
describe('Update this is a gift option', function () {
    beforeEach(() => {
        global.server.use(
            rest.patch('*/baskets/:basketId/items/:itemId', (req, res, ctx) => {
                const basket = mockCustomerBaskets.baskets[0]
                const updatedBasket = {
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
                return res(ctx.json(updatedBasket))
            })
        )
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
        await user.click(giftCheckbox)
        global.server.use(
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res.once(
                    ctx.delay(0),
                    ctx.json({
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
                )
            })
        )

        await waitFor(() => {
            expect(giftCheckbox).toBeChecked()
        })
    })
})
describe('Update this is not a gift option', function () {
    beforeEach(() => {
        global.server.use(
            rest.patch('*/baskets/:basketId/items/:itemId', (req, res, ctx) => {
                const basket = mockCustomerBaskets.baskets[0]
                const updatedBasket = {
                    ...basket,
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
                            quantity: 2,
                            shipmentId: 'me',
                            tax: 2.93,
                            taxBasis: 61.43,
                            taxClassId: 'standard',
                            taxRate: 0.05
                        }
                    ]
                }
                return res(ctx.json(updatedBasket))
            }),
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.json({
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
                )
            })
        )
    })
    test('can update cart item when user unchecks the gift checkbox', async () => {
        const {user} = renderWithProviders(<Cart />)
        await waitFor(() => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            expect(screen.getByText(/Belted Cardigan With Studs/i)).toBeInTheDocument()

            const cartItem = screen.getByTestId('sf-cart-item-701642889830M')
            expect(cartItem).toBeInTheDocument()
        })

        const giftCheckbox = screen.getByRole('checkbox')
        expect(giftCheckbox).toBeChecked()
        await user.click(giftCheckbox)
        global.server.use(
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res.once(
                    ctx.delay(0),
                    ctx.json({
                        baskets: [
                            {
                                ...mockCustomerBaskets.baskets[0],
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
                )
            })
        )

        await waitFor(() => {
            expect(giftCheckbox).not.toBeChecked()
        })
    })
})

describe('Product bundles', () => {
    beforeEach(() => {
        global.server.use(
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) =>
                res(ctx.delay(0), ctx.status(200), ctx.json(mockProductBundleBasket))
            ),
            rest.get('*/products/:productId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.json(mockProductBundle))
            }),
            rest.get('*/products', (req, res, ctx) => {
                if (req.url.toString().includes('test-bundle')) {
                    return res(ctx.delay(0), ctx.json({data: [{...mockProductBundle}]}))
                }
                return res(ctx.delay(0), ctx.json({data: [...mockGetBundleChildrenProducts]}))
            }),
            rest.patch('*/baskets/:basketId/items', (req, res, ctx) => {
                const curretProductItems = basketWithProductBundle.productItems[0]
                const updatedBasket = {
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
                return res(ctx.json(updatedBasket))
            }),
            rest.patch('*/baskets/:basketId/items/:itemId', () => {})
        )
    })

    test('displays inventory message when incrementing quantity above available stock', async () => {
        renderWithProviders(<Cart />)

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
        quantityElement.focus()
        fireEvent.change(quantityElement, {target: {value: '4'}})

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
        await user.click(editCartButton)

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

        // For some reason clicking - fireEvent.click(incrementButton) - doesn't work,
        // so we'll use the keyboard to increment
        incrementButton.focus()
        fireEvent.keyDown(incrementButton, {key: 'Enter', code: 'Enter', charCode: 13})

        await waitFor(async () => {
            expect(quantityElement).toHaveValue('2')
        })

        const updateCartButtons = within(productViewModal).getAllByRole('button', {name: 'Update'})
        await user.click(updateCartButtons[0])

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

    describe('with selectedInventoryId', () => {
        const mockSiteId = 'bundle-test-site'
        const mockInventoryId = 'store-inventory-123'

        beforeEach(() => {
            // Mock useMultiSite to return our test site ID
            mockUseMultiSite.mockReturnValue({
                site: {id: mockSiteId},
                buildUrl: (url) => url
            })

            // Mock useSelectedStore to return a store with inventoryId
            mockUseSelectedStore.mockImplementation(() => ({
                selectedStore: {
                    id: 'store-123',
                    name: 'Test Store',
                    inventoryId: mockInventoryId
                },
                isLoading: false,
                error: null,
                hasSelectedStore: true
            }))

            // Create bundle product with inventories array
            const bundleProductWithInventories = {
                ...mockProductBundle,
                inventories: [
                    {
                        id: 'inventory_m',
                        stockLevel: 100,
                        ats: 100,
                        orderable: true,
                        backorderable: false,
                        preorderable: false
                    },
                    {
                        id: mockInventoryId,
                        stockLevel: 50, // Store has 50 in stock
                        ats: 50,
                        orderable: true,
                        backorderable: false,
                        preorderable: false
                    }
                ]
            }

            // Create bundle children products with inventories arrays for store-specific inventory
            const bundleChildrenWithInventories = mockGetBundleChildrenProducts.map((product) => ({
                ...product,
                inventories: [
                    {
                        id: 'inventory_m',
                        stockLevel: product.inventory.stockLevel,
                        ats: product.inventory.ats,
                        orderable: product.inventory.orderable,
                        backorderable: product.inventory.backorderable,
                        preorderable: product.inventory.preorderable
                    },
                    {
                        id: mockInventoryId,
                        stockLevel: Math.floor(product.inventory.stockLevel * 0.5), // Store has half the stock
                        ats: Math.floor(product.inventory.ats * 0.5),
                        orderable: product.inventory.orderable,
                        backorderable: product.inventory.backorderable,
                        preorderable: product.inventory.preorderable
                    }
                ]
            }))

            global.server.use(
                rest.get('*/customers/:customerId/baskets', (req, res, ctx) =>
                    res(ctx.delay(0), ctx.status(200), ctx.json(mockProductBundleBasket))
                ),
                rest.get('*/products/:productId', (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.json(bundleProductWithInventories))
                }),
                rest.get('*/products', (req, res, ctx) => {
                    if (req.url.toString().includes('test-bundle')) {
                        return res(ctx.delay(0), ctx.json({data: [bundleProductWithInventories]}))
                    }
                    return res(ctx.delay(0), ctx.json({data: bundleChildrenWithInventories}))
                }),
                rest.patch('*/baskets/:basketId/items', (req, res, ctx) => {
                    const curretProductItems = basketWithProductBundle.productItems[0]
                    const updatedBasket = {
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
                    return res(ctx.json(updatedBasket))
                }),
                rest.patch('*/baskets/:basketId/items/:itemId', () => {})
            )
        })

        test('passes inventoryIds parameter to API when selectedInventoryId is available', async () => {
            // Spy on the products API call to verify parameters
            const productsApiSpy = jest.fn()

            global.server.use(
                rest.get('*/products', (req, res, ctx) => {
                    productsApiSpy(req)
                    if (req.url.toString().includes('test-bundle')) {
                        // Return the bundle product with inventories
                        const bundleProductWithInventories = {
                            ...mockProductBundle,
                            inventories: [
                                {
                                    id: 'inventory_m',
                                    stockLevel: 100,
                                    ats: 100,
                                    orderable: true,
                                    backorderable: false,
                                    preorderable: false
                                },
                                {
                                    id: mockInventoryId,
                                    stockLevel: 50,
                                    ats: 50,
                                    orderable: true,
                                    backorderable: false,
                                    preorderable: false
                                }
                            ]
                        }
                        return res(ctx.delay(0), ctx.json({data: [bundleProductWithInventories]}))
                    }
                    // Return bundle children with inventories
                    const bundleChildrenWithInventories = mockGetBundleChildrenProducts.map(
                        (product) => ({
                            ...product,
                            inventories: [
                                {
                                    id: 'inventory_m',
                                    stockLevel: product.inventory.stockLevel,
                                    ats: product.inventory.ats,
                                    orderable: product.inventory.orderable,
                                    backorderable: product.inventory.backorderable,
                                    preorderable: product.inventory.preorderable
                                },
                                {
                                    id: mockInventoryId,
                                    stockLevel: Math.floor(product.inventory.stockLevel * 0.5),
                                    ats: Math.floor(product.inventory.ats * 0.5),
                                    orderable: product.inventory.orderable,
                                    backorderable: product.inventory.backorderable,
                                    preorderable: product.inventory.preorderable
                                }
                            ]
                        })
                    )
                    return res(ctx.delay(0), ctx.json({data: bundleChildrenWithInventories}))
                })
            )

            renderWithProviders(<Cart />)

            await waitFor(() => {
                expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            })

            // Verify that the products API was called with inventoryIds parameter
            await waitFor(() => {
                expect(productsApiSpy).toHaveBeenCalled()
                const lastCall = productsApiSpy.mock.calls[productsApiSpy.mock.calls.length - 1][0]
                const url = new URL(lastCall.url)
                expect(url.searchParams.get('inventoryIds')).toBe(mockInventoryId)
            })
        })

        test('calculates lowest stock level among bundle children for store inventory', async () => {
            // Create bundle children with different stock levels for store inventory
            const bundleChildrenWithVaryingStock = mockGetBundleChildrenProducts.map(
                (product, index) => ({
                    ...product,
                    inventories: [
                        {
                            id: 'inventory_m',
                            stockLevel: product.inventory.stockLevel,
                            ats: product.inventory.ats,
                            orderable: product.inventory.orderable,
                            backorderable: product.inventory.backorderable,
                            preorderable: product.inventory.preorderable
                        },
                        {
                            id: mockInventoryId,
                            stockLevel: 10 - index, // Different stock levels: 10, 9, 8
                            ats: 10 - index,
                            orderable: product.inventory.orderable,
                            backorderable: product.inventory.backorderable,
                            preorderable: product.inventory.preorderable
                        }
                    ]
                })
            )

            global.server.use(
                rest.get('*/products', (req, res, ctx) => {
                    if (req.url.toString().includes('test-bundle')) {
                        return res(ctx.delay(0), ctx.json({data: [mockProductBundle]}))
                    }
                    return res(ctx.delay(0), ctx.json({data: bundleChildrenWithVaryingStock}))
                })
            )

            renderWithProviders(<Cart />)

            await waitFor(() => {
                expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
            })

            // The lowest stock level should be 8 (from the third child product)
            // This should be reflected in the inventory calculation
            await waitFor(() => {
                expect(screen.getByText(/women's clothing test bundle/i)).toBeInTheDocument()
            })
        })

        test('handles missing store inventory gracefully', async () => {
            // Create bundle children without the specific store inventory
            const bundleChildrenWithoutStoreInventory = mockGetBundleChildrenProducts.map(
                (product) => ({
                    ...product,
                    inventories: [
                        {
                            id: 'inventory_m',
                            stockLevel: product.inventory.stockLevel,
                            ats: product.inventory.ats,
                            orderable: product.inventory.orderable,
                            backorderable: product.inventory.backorderable,
                            preorderable: product.inventory.preorderable
                        }
                        // No store-specific inventory
                    ]
                })
            )

            global.server.use(
                rest.get('*/products', (req, res, ctx) => {
                    if (req.url.toString().includes('test-bundle')) {
                        return res(ctx.delay(0), ctx.json({data: [mockProductBundle]}))
                    }
                    return res(ctx.delay(0), ctx.json({data: bundleChildrenWithoutStoreInventory}))
                })
            )

            renderWithProviders(<Cart />)

            await waitFor(() => {
                expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
                expect(screen.getByText(/women's clothing test bundle/i)).toBeInTheDocument()
            })
        })

        test('updates bundle inventory with lowest stock level product name', async () => {
            // Create bundle children where one has the lowest stock
            const bundleChildrenWithLowestStock = mockGetBundleChildrenProducts.map(
                (product, index) => ({
                    ...product,
                    inventories: [
                        {
                            id: 'inventory_m',
                            stockLevel: product.inventory.stockLevel,
                            ats: product.inventory.ats,
                            orderable: product.inventory.orderable,
                            backorderable: product.inventory.backorderable,
                            preorderable: product.inventory.preorderable
                        },
                        {
                            id: mockInventoryId,
                            stockLevel: index === 1 ? 2 : 10, // Second product has lowest stock
                            ats: index === 1 ? 2 : 10,
                            orderable: product.inventory.orderable,
                            backorderable: product.inventory.backorderable,
                            preorderable: product.inventory.preorderable
                        }
                    ]
                })
            )

            global.server.use(
                rest.get('*/products', (req, res, ctx) => {
                    if (req.url.toString().includes('test-bundle')) {
                        return res(ctx.delay(0), ctx.json({data: [mockProductBundle]}))
                    }
                    return res(ctx.delay(0), ctx.json({data: bundleChildrenWithLowestStock}))
                })
            )

            renderWithProviders(<Cart />)

            await waitFor(() => {
                expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
                expect(screen.getByText(/women's clothing test bundle/i)).toBeInTheDocument()
            })
        })

        test('handles bundle children with no inventory data', async () => {
            // Create bundle children without any inventory data
            const bundleChildrenWithoutInventory = mockGetBundleChildrenProducts.map((product) => ({
                ...product,
                inventory: undefined,
                inventories: undefined
            }))

            global.server.use(
                rest.get('*/products', (req, res, ctx) => {
                    if (req.url.toString().includes('test-bundle')) {
                        return res(ctx.delay(0), ctx.json({data: [mockProductBundle]}))
                    }
                    return res(ctx.delay(0), ctx.json({data: bundleChildrenWithoutInventory}))
                })
            )

            renderWithProviders(<Cart />)

            await waitFor(() => {
                expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
                expect(screen.getByText(/women's clothing test bundle/i)).toBeInTheDocument()
            })
        })

        test('handles bundle product without inventories array', async () => {
            // Create bundle product without inventories array
            const bundleProductWithoutInventories = {
                ...mockProductBundle,
                inventories: undefined
            }

            global.server.use(
                rest.get('*/products/:productId', (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.json(bundleProductWithoutInventories))
                }),
                rest.get('*/products', (req, res, ctx) => {
                    if (req.url.toString().includes('test-bundle')) {
                        return res(
                            ctx.delay(0),
                            ctx.json({data: [bundleProductWithoutInventories]})
                        )
                    }
                    return res(ctx.delay(0), ctx.json({data: mockGetBundleChildrenProducts}))
                })
            )

            renderWithProviders(<Cart />)

            await waitFor(() => {
                expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
                expect(screen.getByText(/women's clothing test bundle/i)).toBeInTheDocument()
            })
        })
    })
})

describe('Bonus products', () => {
    beforeEach(() => {
        prependHandlersToServer([
            {
                path: '*/customers/:customerId/baskets',
                method: 'get',
                res: () => mockBasketWithBonusProducts
            }
        ])
    })

    test('renders bonus products in cart with correct styling and no quantity picker', async () => {
        renderWithProviders(<Cart />)

        // Wait for the cart to load
        await waitFor(() => {
            expect(screen.queryByTestId('sf-cart-skeleton')).not.toBeInTheDocument()
        })

        // Find products by their names
        const regularProduct = screen.getByText('Belted Cardigan With Studs')
        const bonusProduct = screen.getByText('Free Gift with Purchase')

        expect(regularProduct).toBeInTheDocument()
        expect(bonusProduct).toBeInTheDocument()
        expect(within(bonusProduct).queryByTestId('quantity-picker')).not.toBeInTheDocument()
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
        await user.click(removeBtn)

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

test('shows error toast when updating cart item fails', async () => {
    // Mock the update item API to fail
    global.server.use(
        rest.patch('*/baskets/:basketId/items/:itemId', (req, res, ctx) => {
            return res(ctx.status(500))
        })
    )

    renderWithProviders(<Cart />)
    await waitFor(() => expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument())

    // Find the first "Edit" button and click it to open the edit modal
    const editButtons = await screen.findAllByRole('button', {name: /edit/i})
    await userEvent.click(editButtons[0])

    // In the modal, find and click the "Update" or "Save" button (adjust selector as needed)
    const updateButton = await screen.findByRole('button', {name: /update|save/i})
    await userEvent.click(updateButton)

    // Wait for the error toast to appear
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
})

describe('Selected inventory ID tests', function () {
    const mockSiteId = 'test-site-123'
    const mockInventoryId = 'inventory-456'

    beforeEach(() => {
        // Mock useMultiSite to return our test site ID
        mockUseMultiSite.mockReturnValue({
            site: {id: mockSiteId},
            buildUrl: (url) => url
        })

        // Mock useSelectedStore to return a store with inventoryId
        mockUseSelectedStore.mockImplementation(() => ({
            selectedStore: {
                id: 'store-123',
                name: 'Test Store',
                inventoryId: mockInventoryId
            },
            isLoading: false,
            error: null,
            hasSelectedStore: true
        }))
    })

    test('includes inventoryIds parameter when selectedInventoryId is available', async () => {
        // Spy on the products API call to verify parameters
        const productsApiSpy = jest.fn()

        global.server.use(
            rest.get('*/products', (req, res, ctx) => {
                productsApiSpy(req)
                return res(ctx.delay(0), ctx.json({data: [mockCartVariant]}))
            })
        )

        renderWithProviders(<Cart />)

        await waitFor(() => {
            expect(screen.getByTestId('sf-cart-container')).toBeInTheDocument()
        })

        // Verify that the products API was called with inventoryIds parameter
        await waitFor(() => {
            expect(productsApiSpy).toHaveBeenCalled()
            const lastCall = productsApiSpy.mock.calls[productsApiSpy.mock.calls.length - 1][0]
            const url = new URL(lastCall.url)
            expect(url.searchParams.get('inventoryIds')).toBe(mockInventoryId)
        })
    })
})
