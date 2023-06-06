/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {fireEvent, screen, waitFor, within} from '@testing-library/react'
import {
    mockCustomerBaskets,
    mockedCustomerProductLists,
    productsResponse
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import ProductDetail from '.'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {basketWithProductSet} from '@salesforce/retail-react-app/app/pages/product-detail/index.mock'
import mockedProductSet from '@salesforce/retail-react-app/app/mocks/product-set-winter-lookM'

jest.setTimeout(60000)

jest.useFakeTimers()

const MockedComponent = () => {
    return (
        <Switch>
            <Route
                path="/en-GB/product/:productId"
                render={(props) => <ProductDetail {...props} />}
            />
        </Switch>
    )
}

beforeEach(() => {
    jest.resetModules()

    global.server.use(
        // By default, the page will be rendered with a product set
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedProductSet))
        }),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        }),
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedCustomerProductLists))
        })
    )

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductDetail', '/en-GB/product/test-product')
})

afterEach(() => {
    jest.resetModules()
})

test('should render product details page', async () => {
    global.server.use(
        // Use a single product (and not a product set)
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.json(productsResponse.data[0]))
        })
    )

    renderWithProviders(<MockedComponent />)

    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    await waitFor(() => {
        expect(screen.getAllByText(/Long Sleeve Crew Neck/)).toHaveLength(2)
        expect(screen.getAllByText(/14.99/)).toHaveLength(2)
        expect(screen.getAllByText(/Add to Cart/)).toHaveLength(2)
        expect(screen.getAllByText(/Add to Wishlist/)).toHaveLength(2)
        expect(screen.getAllByTestId('product-view')).toHaveLength(1)
    })
})

describe('product set', () => {
    beforeEach(() => {
        global.server.use(
            // For adding items to basket
            rest.post('*/baskets/:basketId/items', (req, res, ctx) => {
                return res(ctx.json(basketWithProductSet))
            })
        )
    })

    test('render multi-product layout', async () => {
        renderWithProviders(<MockedComponent />)

        await waitFor(
            () => {
                expect(screen.getAllByTestId('product-view')).toHaveLength(4) // 1 parent + 3 children
            },
            {timeout: 5000}
        )
    })

    test('add the set to cart successfully', async () => {
        const urlPathAfterSelectingAllVariants =
            '/en-GB/product/winter-lookM?25518447M=color%3DJJ5FUXX%26size%3D9MD&25518704M=color%3DJJ2XNXX%26size%3D9MD&25772717M=color%3DTAUPETX%26size%3D070%26width%3DM'
        window.history.pushState({}, 'ProductDetail', urlPathAfterSelectingAllVariants)

        // Initial basket is necessary to add items to it
        const initialBasket = {basketId: 'valid_id'}
        renderWithProviders(<MockedComponent />, {wrapperProps: {initialBasket}})

        await waitFor(
            () => {
                expect(screen.getAllByText('Winter Look')[0]).toBeInTheDocument()
            },
            {timeout: 5000}
        )

        const buttons = await screen.findAllByText(/add set to cart/i)
        fireEvent.click(buttons[0])

        await waitFor(
            () => {
                const modal = screen.getByTestId('add-to-cart-modal')
                expect(within(modal).getByText(/items added to cart/i)).toBeInTheDocument()
            },
            // Seems like rendering the modal takes a bit more time
            {timeout: 10000}
        )
    }, 30000)

    test('add the set to cart with error messages', async () => {
        renderWithProviders(<MockedComponent />)

        await waitFor(
            () => {
                expect(screen.getAllByText('Winter Look')[0]).toBeInTheDocument()
            },
            {timeout: 5000}
        )

        const buttons = await screen.findAllByText(/add set to cart/i)
        fireEvent.click(buttons[0])

        await waitFor(() => {
            // Show error when users have not selected all the variants yet
            // 1 error for each child product
            const errorMessages = screen.getAllByText(/Please select all your options above/i)
            expect(errorMessages).toHaveLength(3)
        })
    })

    test("child products' images are lazy loaded", async () => {
        renderWithProviders(<MockedComponent />)

        const childProducts = await screen.findAllByTestId('child-product')

        childProducts.forEach((child) => {
            const heroImage = within(child).getAllByRole('img')[0]
            expect(heroImage.getAttribute('loading')).toBe('lazy')
        })
    })
})
