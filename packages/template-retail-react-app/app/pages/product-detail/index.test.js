/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {
    mockCategory,
    mockedCustomerProductLists,
    productsResponse
} from '../../commerce-api/mock-data'
import {screen, waitFor} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {rest} from 'msw'
import ProductDetail from '.'
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'
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

beforeEach(() => {
    console.log('beForeEach')
    // console.error(global.server)
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            // console.log('product detail-----------------------')
            return res(ctx.json(productsResponse.data[0]))
        }),
        rest.get('*/categories/:categoryId', (req, res, ctx) => {
            // console.log('category---------------')
            return res(ctx.json(mockCategory))
        })
    )
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductDetail', '/uk/en-GB/product/701642811398M')
})
afterEach(() => {
    jest.resetModules()
})

test('should render product details page', async () => {
    renderWithProviders(<MockedComponent />)
    await waitFor(() => {
        const productName = screen.getAllByText(/Long Sleeve Crew Neck/)
        expect(productName.length).toEqual(2)
    })
    expect(screen.getAllByText(/14.99/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Cart/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Wishlist/).length).toEqual(2)
})
