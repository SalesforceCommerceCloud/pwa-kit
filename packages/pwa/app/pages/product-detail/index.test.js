/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {productsResponse} from '../../commerce-api/mock-data'
import {screen} from '@testing-library/react'
import ProductDetail from '.'
import {renderWithProviders} from '../../utils/test-utils'

jest.setTimeout(60000)

jest.mock('../../commerce-api/einstein')

const MockedComponent = () => {
    const product = productsResponse.data[0]

    return <ProductDetail product={product} />
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('should render product details page', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('product-details-page')).toBeInTheDocument()
    expect(screen.getAllByText(/Long Sleeve Crew Neck/).length).toEqual(2)
    expect(screen.getAllByText(/14.99/).length).toEqual(2)
    expect(screen.getAllByText(/Add to cart/).length).toEqual(2)
    expect(screen.getAllByText(/Add to wishlist/).length).toEqual(2)
})
