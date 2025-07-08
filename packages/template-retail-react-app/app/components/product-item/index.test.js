/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ProductItem from '@salesforce/retail-react-app/app/components/product-item'
import {mockedCustomerProductListsDetails} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {screen} from '@testing-library/react'
import PropTypes from 'prop-types'

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
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

const mockProduct = {
    ...mockedCustomerProductListsDetails.data[0],
    productName: mockedCustomerProductListsDetails.data[0].name,
    bonusProductLineItem: false,
    quantity: 1
}

const mockBonusProduct = {
    ...mockProduct,
    bonusProductLineItem: true
}

const MockedComponent = ({
    product = mockProduct,
    onItemQuantityChange = async () => {},
    showLoading = false
}) => {
    return (
        <ProductItem
            product={product}
            onItemQuantityChange={onItemQuantityChange}
            showLoading={showLoading}
            primaryAction={<button>Primary Action</button>}
            secondaryActions={<button>Secondary Action</button>}
        />
    )
}

MockedComponent.propTypes = {
    product: PropTypes.object,
    onItemQuantityChange: PropTypes.func,
    showLoading: PropTypes.bool
}

describe('ProductItem Component', () => {
    test('renders product item name, attributes, price and quantity picker', async () => {
        renderWithProviders(<MockedComponent />)

        expect(await screen.getByText(/apple ipod nano$/i)).toBeInTheDocument()
        expect(await screen.getByText(/color: green/i)).toBeInTheDocument()
        expect(await screen.getByText(/memory size: 16 GB$/i)).toBeInTheDocument()
        expect(screen.queryByRole('spinbutton')).toBeInTheDocument()
    })

    test('renders bonus product without quantity picker', () => {
        renderWithProviders(<MockedComponent product={mockBonusProduct} />)

        expect(screen.getByText(/Quantity:/i)).toBeInTheDocument()
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    })
})
