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
import mockProductSet from '../../commerce-api/mocks/product-set-winter-lookM'
import ProductView from './index'
import {renderWithProviders} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import userEvent from '@testing-library/user-event'

jest.mock('../../commerce-api/einstein')

const MockComponent = (props) => {
    const customer = useCustomer()
    useEffect(() => {
        if (!customer.isRegistered) {
            customer.login('customer@test.com', 'password1')
        }
    }, [])
    return (
        <div>
            <div>customer: {customer?.authType}</div>
            <ProductView {...props} />
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
    jest.resetModules()

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')
})
afterEach(() => {
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

test('renders a product set properly - parent item', () => {
    const parent = mockProductSet
    renderWithProviders(
        <MockComponent product={parent} addToCart={() => {}} addToWishlist={() => {}} />
    )

    // NOTE: there can be duplicates of the same element, due to mobile and desktop views
    // (they're hidden with display:none style)

    const startingAtLabel = screen.getAllByText(/starting at/i)[0]
    const addSetToCartButton = screen.getAllByRole('button', {name: /add set to cart/i})[0]
    const addSetToWishlistButton = screen.getAllByRole('button', {name: /add set to wishlist/i})[0]
    const variationAttributes = screen.queryAllByRole('radiogroup') // e.g. sizes, colors
    const quantityPicker = screen.queryByRole('spinbutton', {name: /quantity:/i})

    // What should exist:
    expect(startingAtLabel).toBeInTheDocument()
    expect(addSetToCartButton).toBeInTheDocument()
    expect(addSetToWishlistButton).toBeInTheDocument()

    // What should _not_ exist:
    expect(variationAttributes.length).toEqual(0)
    expect(quantityPicker).toBe(null)
})

test('renders a product set properly - child item', () => {
    const child = mockProductSet.setProducts[0]
    renderWithProviders(
        <MockComponent product={child} addToCart={() => {}} addToWishlist={() => {}} />
    )

    // NOTE: there can be duplicates of the same element, due to mobile and desktop views
    // (they're hidden with display:none style)

    const addToCartButton = screen.getAllByRole('button', {name: /add to cart/i})[0]
    const addToWishlistButton = screen.getAllByRole('button', {name: /add to wishlist/i})[0]
    const variationAttributes = screen.getAllByRole('radiogroup') // e.g. sizes, colors
    const quantityPicker = screen.getByRole('spinbutton', {name: /quantity:/i})
    const startingAtLabels = screen.queryAllByText(/starting at/i)

    // What should exist:
    expect(addToCartButton).toBeInTheDocument()
    expect(addToWishlistButton).toBeInTheDocument()
    expect(variationAttributes.length).toEqual(2)
    expect(quantityPicker).toBeInTheDocument()

    // What should _not_ exist:
    expect(startingAtLabels.length).toEqual(0)
})

test('validateOrderability callback is called when adding a set to cart', async () => {
    const parent = mockProductSet
    const validateOrderability = jest.fn()

    renderWithProviders(
        <MockComponent
            product={parent}
            validateOrderability={validateOrderability}
            addToCart={() => {}}
            addToWishlist={() => {}}
        />
    )

    const button = screen.getByRole('button', {name: /add set to cart/i})
    userEvent.click(button)

    await waitFor(() => {
        expect(validateOrderability).toHaveBeenCalledTimes(1)
    })
})

test('onVariantSelected callback is called after successfully selected a variant', async () => {
    const onVariantSelected = jest.fn()
    const child = mockProductSet.setProducts[0]

    renderWithProviders(
        <MockComponent
            product={child}
            onVariantSelected={onVariantSelected}
            addToCart={() => {}}
            addToWishlist={() => {}}
        />
    )

    const size = screen.getByRole('link', {name: /xl/i})
    userEvent.click(size)

    await waitFor(() => {
        expect(onVariantSelected).toHaveBeenCalledTimes(1)
    })
})
