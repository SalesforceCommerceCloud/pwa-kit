/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {rest} from 'msw'
import {mockedCustomerProductLists, productsResponse} from '../../commerce-api/mock-data'
import {screen} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import ProductDetail from '.'
import {renderWithProviders, setupMockServer} from '../../utils/test-utils'

jest.setTimeout(60000)

jest.useFakeTimers()

jest.mock('../../commerce-api/einstein')

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

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

// Set up the msw server to intercept fetch requests and returned mocked results. Additional
// interceptors can be defined in each test for specific requests.
const server = setupMockServer(
    // mock fetch product lists
    rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
        return res(ctx.json(mockedCustomerProductLists))
    }),
    // mock add item to product lists
    rest.post('*/customers/:customerId/product-lists/:listId/items', (req, res, ctx) => {
        return res(ctx.delay(0), ctx.status(200))
    })
)

// Set up and clean up
beforeAll(() => {
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductDetail', '/en-GB/product/test-product')
})

beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
})

afterEach(() => {
    jest.resetModules()
})
afterAll(() => server.close())

test('should render product details page', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    expect(screen.getAllByText(/Long Sleeve Crew Neck/).length).toEqual(2)
    expect(screen.getAllByText(/14.99/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Cart/).length).toEqual(2)
    expect(screen.getAllByText(/Add to Wishlist/).length).toEqual(2)
})
