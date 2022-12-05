/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import mockProductDetail from '../../commerce-api/mocks/variant-750518699578M'
import ProductView from './index'
import {renderWithProviders, setupMockServer} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import userEvent from '@testing-library/user-event'

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

jest.mock('../../commerce-api/einstein')

const MockComponent = ({product, addToCart, addToWishlist, updateWishlist}) => {
    const customer = useCustomer()
    useEffect(() => {
        if (!customer.isRegistered) {
            customer.login('customer@test.com', 'password1')
        }
    }, [])
    return (
        <div>
            <div>customer: {customer?.authType}</div>
            <ProductView
                product={product}
                addToCart={addToCart}
                addToWishlist={addToWishlist}
                updateWishlist={updateWishlist}
            />
        </div>
    )
}

MockComponent.propTypes = {
    product: PropTypes.object,
    addToCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateWishlist: PropTypes.func
}

const server = setupMockServer()

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('ProductView Component renders properly', () => {
    const addToCart = jest.fn()
    renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

    expect(screen.getAllByText(/Black Single Pleat Athletic Fit Wool Suit/i).length).toEqual(2)
    expect(screen.getAllByText(/299.99/).length).toEqual(2)
    expect(screen.getAllByText(/Add to cart/i).length).toEqual(2)
    expect(screen.getAllByRole('radiogroup').length).toEqual(3)
    expect(screen.getAllByText(/add to cart/i).length).toEqual(2)
})

test('ProductView Component renders with addToCart event handler', () => {
    const addToCart = jest.fn()
    renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

    const addToCartButton = screen.getAllByText(/add to cart/i)[0]
    fireEvent.click(addToCartButton)
    expect(addToCart).toHaveBeenCalledTimes(1)
})

test('ProductView Component renders with addToWishList event handler', async () => {
    const addToWishlist = jest.fn()

    renderWithProviders(<MockComponent product={mockProductDetail} addToWishlist={addToWishlist} />)

    await waitFor(() => {
        expect(screen.getByText(/customer: registered/)).toBeInTheDocument()
    })

    await waitFor(() => {
        const addToWishListButton = screen.getAllByText(/Add to wishlist/i)[0]

        fireEvent.click(addToWishListButton)
        expect(addToWishlist).toHaveBeenCalledTimes(1)
    })
})

test('ProductView Component renders with updateWishlist event handler', async () => {
    const updateWishlist = jest.fn()

    renderWithProviders(
        <MockComponent product={mockProductDetail} updateWishlist={updateWishlist} />
    )

    await waitFor(() => {
        expect(screen.getByText(/customer: registered/)).toBeInTheDocument()
    })

    await waitFor(() => {
        const updateWishlistButton = screen.getAllByText(/Update/i)[0]

        fireEvent.click(updateWishlistButton)
        expect(updateWishlist).toHaveBeenCalledTimes(1)
    })
})

test('Product View can update quantity', () => {
    const addToCart = jest.fn()
    renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)
    const quantityBox = screen.getByRole('spinbutton')
    expect(quantityBox).toHaveValue('1')
    // update item quantity
    userEvent.type(quantityBox, '{backspace}3')
    expect(quantityBox).toHaveValue('3')
})
