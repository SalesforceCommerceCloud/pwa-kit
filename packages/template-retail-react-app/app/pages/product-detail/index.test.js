/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mockedCustomerProductLists, productsResponse} from '../../commerce-api/mock-data'
import {screen} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import ProductDetail from '.'
import {renderWithProviders} from '../../utils/test-utils'

jest.mock('../../commerce-api/einstein')

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
    console.error(global.server)
    global.server.use(
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        }),

        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.json(productsResponse.data[0]))
        }),
        rest.post('*/customers/:customerId/product-lists/:listId/items', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200))
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
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    expect(screen.getAllByText(/Long Sleeve Crew Neck/).length).toEqual(2)
    expect(screen.getAllByText(/14.99/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Cart/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Wishlist/).length).toEqual(2)
})
