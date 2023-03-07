/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
<<<<<<< HEAD
import {mockMasterProduct} from '../../commerce-api/mock-data'
import {screen, waitFor} from '@testing-library/react'
=======
import {rest} from 'msw'
import {mockedCustomerProductLists, productsResponse} from '../../commerce-api/mock-data'
import {fireEvent, screen, waitFor, within} from '@testing-library/react'
>>>>>>> product-sets
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import ProductDetail from '.'
<<<<<<< HEAD
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'
=======
import {basketWithProductSet} from './index.mock'
import {renderWithProviders} from '../../utils/test-utils'
import mockedProductSet from '../../commerce-api/mocks/product-set-winter-lookM'
>>>>>>> product-sets

jest.setTimeout(60000)

jest.useFakeTimers()

jest.mock('../../commerce-api/einstein')

const MockedComponent = () => {
    return (
        <Switch>
            <Route
                path={createPathWithDefaults('/product/:productId')}
                render={(props) => <ProductDetail {...props} />}
            />
        </Switch>
    )
}

<<<<<<< HEAD
beforeEach(() => {
    jest.resetModules()
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.json(mockMasterProduct))
        })
    )
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductDetail', '/uk/en-GB/product/701642811398M')
=======
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

beforeEach(() => {
    jest.resetModules()

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductDetail', '/en-GB/product/test-product')
>>>>>>> product-sets
})

afterEach(() => {
    jest.resetModules()
})

//@TODO: Revisit this test after hooks integration is complete
test.skip('should render product details page', async () => {
    global.server.use(
        // mock add item to product lists
        rest.post('*/customers/:customerId/product-lists/:listId/items', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200))
        })
    )
    renderWithProviders(<MockedComponent />)
<<<<<<< HEAD
    await waitFor(() => {
        const productName = screen.getAllByText(/Checked Silk Tie/)
        expect(productName.length).toEqual(2)
        expect(screen.getAllByText(/19.19/).length).toEqual(2)
        expect(screen.getAllByText(/Add to Cart/).length).toEqual(2)
        expect(screen.getAllByText(/Add to Wishlist/).length).toEqual(2)
    })

    await waitFor(() => {
        expect(screen.getAllByText(/Ties/).length).toEqual(2)
=======
    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    expect(screen.getAllByText(/Long Sleeve Crew Neck/).length).toEqual(2)
    expect(screen.getAllByText(/14.99/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Cart/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Wishlist/).length).toEqual(2)
    expect(screen.getAllByTestId('product-view').length).toEqual(1)
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
        renderWithProviders(<MockedPageWithProductSet />)

        await waitFor(() => {
            expect(screen.getAllByTestId('product-view').length).toEqual(4) // 1 parent + 3 children
        })
    })

    test('add the set to cart successfully', async () => {
        const urlPathAfterSelectingAllVariants =
            '/en-GB/product/winter-lookM?25518447M=color%3DJJ5FUXX%26size%3D9MD&25518704M=color%3DJJ2XNXX%26size%3D9MD&25772717M=color%3DTAUPETX%26size%3D070%26width%3DM'
        window.history.pushState({}, 'ProductDetail', urlPathAfterSelectingAllVariants)

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
>>>>>>> product-sets
    })
})
