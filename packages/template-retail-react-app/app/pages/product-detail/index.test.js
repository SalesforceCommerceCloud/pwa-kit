/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {rest} from 'msw'
import {mockedCustomerProductLists, productsResponse} from '../../commerce-api/mock-data'
import {fireEvent, screen, waitFor, within} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import ProductDetail from '.'
import {renderWithProviders} from '../../utils/test-utils'
import mockedProductSet from '../../commerce-api/mocks/product-set-winter-lookM'

jest.setTimeout(60000)

jest.useFakeTimers()

jest.mock('../../commerce-api/einstein')

const MockedComponent = () => {
    const product = productsResponse.data[0]

    return (
        <Switch>
            <Route
                path="/en-GB/product/:productId"
                render={(props) => <ProductDetail {...props} product={product} />}
            />
        </Switch>
    )
}

const MockedPageWithProductSet = () => {
    return (
        <Switch>
            <Route
                path="/en-GB/product/:productId"
                render={(props) => <ProductDetail {...props} product={mockedProductSet} />}
            />
        </Switch>
    )
}

const basketWithProductSet = {
    _v: '21.3',
    _type: 'basket',
    _resource_state: '9fdc9a8aeaea84a84a9dfed115ad37a0a32c86df4693cc7a9f62afc3395527c7',
    _flash: [
        {
            _type: 'flash',
            type: 'PaymentMethodRequired',
            message:
                'No payment method ID was specified. Please provide a valid payment method ID.',
            path: '$.payment_instruments[0].payment_method_id'
        },
        {
            _type: 'flash',
            type: 'BillingAddressRequired',
            message: 'No billing address was specified. Please provide a valid billing address.',
            path: '$.billing_address'
        },
        {
            _type: 'flash',
            type: 'OrderTotalNotSet',
            message: 'Order total missing, calculation failed.',
            path: '$.order_total'
        },
        {
            _type: 'flash',
            type: 'ShippingAddressRequired',
            message: 'No shipping address was specified. Please provide a valid shipping address.',
            path: '$.shipments[0].shipping_address',
            details: {
                shipmentId: 'me'
            }
        },
        {
            _type: 'flash',
            type: 'ShippingMethodRequired',
            message:
                'No shipping method ID was specified. Please provide a valid shipping method ID.',
            path: '$.shipments[0].shipping_method',
            details: {
                shipmentId: 'me'
            }
        },
        {
            _type: 'flash',
            type: 'ShippingItemAdjustedPriceNotSet',
            message: "Price missing for shipping item ''5fb887a2999303b33676e0d3a5''.",
            path: '$.shipping_items[0].adjusted_price'
        }
    ],
    adjusted_merchandize_total_tax: 17.01,
    adjusted_shipping_total_tax: null,
    agent_basket: false,
    basket_id: '437113007d685eab389f1cd229',
    channel_type: 'storefront',
    creation_date: '2023-02-22T21:47:29.585Z',
    currency: 'GBP',
    customer_info: {
        _type: 'customer_info',
        customer_id: 'abkHtKmulJkKgRmrkVwqYYkHBI',
        email: ''
    },
    last_modified: '2023-02-22T22:15:41.482Z',
    merchandize_total_tax: 17.01,
    notes: {
        _type: 'simple_link',
        link: 'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/dw/shop/v21_3/baskets/437113007d685eab389f1cd229/notes'
    },
    order_total: null,
    product_items: [
        {
            _type: 'product_item',
            adjusted_tax: 6.76,
            base_price: 71.03,
            bonus_product_line_item: false,
            gift: false,
            item_id: '5060f31486572338f05d04fc56',
            item_text: 'Quilted Jacket',
            price: 142.06,
            price_after_item_discount: 142.06,
            price_after_order_discount: 142.06,
            product_id: '701642853695M',
            product_name: 'Quilted Jacket',
            quantity: 2,
            shipment_id: 'me',
            tax: 6.76,
            tax_basis: 142.06,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 4.21,
            base_price: 44.16,
            bonus_product_line_item: false,
            gift: false,
            item_id: '9a8003bebeea153d112083f2bd',
            item_text: 'Pull On Pant',
            price: 88.32,
            price_after_item_discount: 88.32,
            price_after_order_discount: 88.32,
            product_id: '701642867104M',
            product_name: 'Pull On Pant',
            quantity: 2,
            shipment_id: 'me',
            tax: 4.21,
            tax_basis: 88.32,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 3.02,
            base_price: 63.36,
            bonus_product_line_item: false,
            gift: false,
            item_id: '1cda01244dc449d9b245577378',
            item_text: 'Zerrick',
            price: 63.36,
            price_after_item_discount: 63.36,
            price_after_order_discount: 63.36,
            product_id: '740357358101M',
            product_name: 'Zerrick',
            quantity: 1,
            shipment_id: 'me',
            tax: 3.02,
            tax_basis: 63.36,
            tax_class_id: 'standard',
            tax_rate: 0.05
        },
        {
            _type: 'product_item',
            adjusted_tax: 3.02,
            base_price: 63.36,
            bonus_product_line_item: false,
            gift: false,
            item_id: '1007d8db121aa4331836f8f934',
            item_text: 'Zerrick',
            price: 63.36,
            price_after_item_discount: 63.36,
            price_after_order_discount: 63.36,
            product_id: '740357358095M',
            product_name: 'Zerrick',
            quantity: 1,
            shipment_id: 'me',
            tax: 3.02,
            tax_basis: 63.36,
            tax_class_id: 'standard',
            tax_rate: 0.05
        }
    ],
    product_sub_total: 357.1,
    product_total: 357.1,
    shipments: [
        {
            _type: 'shipment',
            adjusted_merchandize_total_tax: 17.01,
            adjusted_shipping_total_tax: null,
            gift: false,
            merchandize_total_tax: 17.01,
            product_sub_total: 357.1,
            product_total: 357.1,
            shipment_id: 'me',
            shipment_total: null,
            shipping_status: 'not_shipped',
            shipping_total: null,
            shipping_total_tax: null,
            tax_total: null
        }
    ],
    shipping_items: [
        {
            _type: 'shipping_item',
            adjusted_tax: null,
            base_price: null,
            item_id: '5fb887a2999303b33676e0d3a5',
            item_text: 'Shipping',
            price: null,
            price_after_item_discount: null,
            shipment_id: 'me',
            tax: null,
            tax_basis: null,
            tax_class_id: null,
            tax_rate: 0.05
        }
    ],
    shipping_total: null,
    shipping_total_tax: null,
    taxation: 'gross',
    tax_total: null
}

beforeEach(() => {
    jest.resetModules()

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductDetail', '/en-GB/product/test-product')
})

afterEach(() => {
    jest.resetModules()
})

test('should render product details page', async () => {
    global.server.use(
        // mock fetch product lists
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        }),
        // mock add item to product lists
        rest.post('*/customers/:customerId/product-lists/:listId/items', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200))
        })
    )
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    expect(screen.getAllByText(/Long Sleeve Crew Neck/).length).toEqual(2)
    expect(screen.getAllByText(/14.99/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Cart/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Wishlist/).length).toEqual(2)
    expect(screen.getAllByTestId('product-view').length).toEqual(1)
})

describe('product set', () => {
    test('render multi-product layout', async () => {
        renderWithProviders(<MockedPageWithProductSet />)

        await waitFor(() => {
            expect(screen.getAllByTestId('product-view').length).toEqual(4) // 1 parent + 3 children
        })
    })

    test('add the set to cart successfully', async () => {
        const urlPathAfterSelectingAllVariants =
            '/en-GB/product/winter-lookM?25518447M=color%3DJJ5FUXX%26size%3D9MD&25518704M=color%3DJJ2XNXX%26size%3D9MD&25772717M=color%3DTAUPETX%26size%3D070%26width%3DM'
        window.history.pushState({}, 'ProductDetail', urlPathAfterSelectingAllVariants)

        global.server.use(
            rest.post('*/baskets/:basketId/items', (req, res, ctx) => {
                return res(ctx.json(basketWithProductSet))
            })
        )

        // Initial basket is necessary to add items to it
        const initialBasket = {basketId: 'valid_id'}
        renderWithProviders(<MockedPageWithProductSet />, {wrapperProps: {initialBasket}})

        const buttons = await screen.findAllByRole('button', {name: /add set to cart/i})
        fireEvent.click(buttons[0])

        await waitFor(
            () => {
                const modal = screen.getByTestId('add-to-cart-modal')
                expect(within(modal).getByText(/3 items added to cart/i)).toBeVisible()
            },
            // Seems like rendering the modal takes a bit more time
            {timeout: 5000}
        )
    })

    test('add the set to cart with error messages', async () => {
        renderWithProviders(<MockedPageWithProductSet />)

        const buttons = await screen.findAllByRole('button', {name: /add set to cart/i})
        fireEvent.click(buttons[0])

        await waitFor(() => {
            // Show error when users have not selected all the variants yet
            // 1 error for each child product
            const errorMessages = screen.getAllByText(/Please select all your options above/i)
            expect(errorMessages.length).toEqual(3)
        })
    })

    test("child products' images are lazy loaded", async () => {
        renderWithProviders(<MockedPageWithProductSet />)

        const childProducts = await screen.findAllByTestId('child-product')

        childProducts.forEach((child) => {
            const heroImage = within(child).getAllByRole('img')[0]
            expect(heroImage.getAttribute('loading')).toEqual('lazy')
        })
    })
})
