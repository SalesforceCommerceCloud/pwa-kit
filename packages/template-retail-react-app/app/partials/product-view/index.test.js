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
import {renderWithProviders} from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import {useCurrentCustomer} from '../../hooks/use-current-customer'
import {AuthHelpers, useAuthHelper, useCustomerType} from 'commerce-sdk-react-preview'

jest.mock('../../commerce-api/einstein')

const MockComponent = ({product, addToCart, addToWishlist, updateWishlist}) => {
    const {isRegistered} = useCustomerType()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const {data: customer} = useCurrentCustomer()
    useEffect(() => {
        if (!isRegistered) {
            login.mutate({email: 'email@test.com', password: 'password1'})
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

// Set up and clean up
beforeEach(() => {
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
    sessionStorage.clear()
})

test('ProductView Component renders properly', async () => {
    const addToCart = jest.fn()
    await renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

    expect(screen.getAllByText(/Black Single Pleat Athletic Fit Wool Suit/i).length).toEqual(2)
    expect(screen.getAllByText(/299.99/).length).toEqual(2)
    expect(screen.getAllByText(/Add to cart/i).length).toEqual(2)
    expect(screen.getAllByRole('radiogroup').length).toEqual(3)
    expect(screen.getAllByText(/add to cart/i).length).toEqual(2)
})

test('ProductView Component renders with addToCart event handler', async () => {
    const addToCart = jest.fn()
    await renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

    const addToCartButton = screen.getAllByText(/add to cart/i)[0]
    fireEvent.click(addToCartButton)

    await waitFor(() => {
        expect(addToCart).toHaveBeenCalledTimes(1)
    })
})

test('ProductView Component renders with addToWishList event handler', async () => {
    const addToWishlist = jest.fn()

    await renderWithProviders(
        <MockComponent product={mockProductDetail} addToWishlist={addToWishlist} />
    )

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

    await renderWithProviders(
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

test('Product View can update quantity', async () => {
    const addToCart = jest.fn()
    await renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)

    let quantityBox
    await waitFor(() => {
        quantityBox = screen.getByRole('spinbutton')
    })

    await waitFor(() => {
        expect(quantityBox).toHaveValue('1')
    })

    // update item quantity
    userEvent.type(quantityBox, '{backspace}3')

    await waitFor(() => {
        expect(quantityBox).toHaveValue('3')
    })
})
