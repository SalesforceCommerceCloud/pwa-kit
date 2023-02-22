/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ProductItem from './index'
import {mockedCustomerProductListsDetails, mockCustomerBaskets} from '../../commerce-api/mock-data'
import {renderWithProviders} from '../../utils/test-utils'
import {screen} from '@testing-library/react'

jest.mock('commerce-sdk-react-preview', () => {
    const originalModule = jest.requireActual('commerce-sdk-react-preview')
    return {
        ...originalModule,
        useCustomerBaskets: jest.fn().mockReturnValue({data: {baskets: [{currency: 'GBP'}]}})
    }
})

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

jest.setTimeout(60000)
const MockedComponent = () => {
    const product = mockedCustomerProductListsDetails.data[0]
    return <ProductItem product={{...product, productName: product.name}} />
}

test('renders product item name, attributes and price', async () => {
    renderWithProviders(<MockedComponent />)

    expect(await screen.getByText(/apple ipod nano/i)).toBeInTheDocument()
    expect(await screen.getByText(/color: green/i)).toBeInTheDocument()
    expect(await screen.getByText(/memory size: 16 GB/i)).toBeInTheDocument()
})
