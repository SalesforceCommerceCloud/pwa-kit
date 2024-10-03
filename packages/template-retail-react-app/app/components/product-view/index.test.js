/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import mockProductDetail from '@salesforce/retail-react-app/app/mocks/variant-750518699578M'
import mockProductSet from '@salesforce/retail-react-app/app/mocks/product-set-winter-lookM'
import {mockProductBundle} from '@salesforce/retail-react-app/app/mocks/product-bundle'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import userEvent from '@testing-library/user-event'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const MockComponent = (props) => {
    const {data: customer} = useCurrentCustomer()
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
    updateWishlist: PropTypes.func,
    isBasketLoading: PropTypes.bool
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
    renderWithProviders(<MockComponent product={mockProductDetail} addToCart={addToCart} />)
    expect(screen.getAllByText(/Black Single Pleat Athletic Fit Wool Suit/i)).toHaveLength(2)
    expect(screen.getAllByText(/299\.99/)).toHaveLength(4)
    expect(screen.getAllByText(/Add to cart/i)).toHaveLength(2)
    expect(screen.getAllByRole('radiogroup')).toHaveLength(3)
    expect(screen.getAllByText(/add to cart/i)).toHaveLength(2)
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
    const user = userEvent.setup()
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
    await user.type(quantityBox, '{backspace}3')

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

    const fromAtLabel = screen.getAllByText(/from/i)[0]
    const addSetToCartButton = screen.getAllByRole('button', {name: /add set to cart/i})[0]
    const addSetToWishlistButton = screen.getAllByRole('button', {name: /add set to wishlist/i})[0]
    const variationAttributes = screen.queryAllByRole('radiogroup') // e.g. sizes, colors
    const quantityPicker = screen.queryByRole('spinbutton', {name: /quantity/i})

    // What should exist:
    expect(fromAtLabel).toBeInTheDocument()
    expect(addSetToCartButton).toBeInTheDocument()
    expect(addSetToWishlistButton).toBeInTheDocument()

    // What should _not_ exist:
    expect(variationAttributes).toHaveLength(0)
    expect(quantityPicker).toBeNull()
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
    const quantityPicker = screen.getByRole('spinbutton', {name: /quantity/i})
    const fromLabels = screen.queryAllByText(/from/i)

    // What should exist:
    expect(addToCartButton).toBeInTheDocument()
    expect(addToWishlistButton).toBeInTheDocument()
    expect(variationAttributes).toHaveLength(2)
    expect(quantityPicker).toBeInTheDocument()

    // since setProducts are master products, as pricing now display From X (cross) Y where X Y are sale and lis price respectively
    // of the variant that has lowest price (including promotional price)
    expect(fromLabels).toHaveLength(4)
})

test('validateOrderability callback is called when adding a set to cart', async () => {
    const user = userEvent.setup()

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
    await user.click(button)

    await waitFor(() => {
        expect(validateOrderability).toHaveBeenCalledTimes(1)
    })
})

test('onVariantSelected callback is called after successfully selected a variant', async () => {
    const user = userEvent.setup()

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

    const size = screen.getByRole('radio', {name: /xl/i})
    await user.click(size)

    await waitFor(() => {
        expect(onVariantSelected).toHaveBeenCalledTimes(1)
    })
})

describe('add to cart button loading tests', () => {
    test('add to cart button is disabled if isBasketLoading is true', async () => {
        renderWithProviders(
            <MockComponent
                product={mockProductDetail}
                addToCart={() => {}}
                isBasketLoading={true}
            />
        )
        expect(screen.getByRole('button', {name: /add to cart/i})).toBeDisabled()
    })

    test('add to cart button is enabled if isBasketLoading is false', async () => {
        renderWithProviders(
            <MockComponent
                product={mockProductDetail}
                addToCart={() => {}}
                isBasketLoading={false}
            />
        )
        expect(screen.getByRole('button', {name: /add to cart/i})).toBeEnabled()
    })
})

test('renders a product bundle properly - parent item', () => {
    const parent = mockProductBundle
    renderWithProviders(
        <MockComponent product={parent} addToCart={() => {}} addToWishlist={() => {}} />
    )

    // NOTE: there can be duplicates of the same element, due to mobile and desktop views
    // (they're hidden with display:none style)
    const addBundleToCartButton = screen.getAllByRole('button', {name: /add bundle to cart/i})[0]
    const addBundleToWishlistButton = screen.getAllByRole('button', {
        name: /add bundle to wishlist/i
    })[0]
    const quantityPicker = screen.getByRole('spinbutton', {name: /quantity/i})
    const variationAttributes = screen.queryAllByRole('radiogroup') // e.g. sizes, colors

    // What should exist:
    expect(addBundleToCartButton).toBeInTheDocument()
    expect(addBundleToWishlistButton).toBeInTheDocument()
    expect(quantityPicker).toBeInTheDocument()

    // What should _not_ exist:
    expect(variationAttributes).toHaveLength(0)
})

test('renders a product bundle properly - child item', () => {
    const child = mockProductBundle.bundledProducts[0].product
    renderWithProviders(
        <MockComponent
            product={child}
            addToCart={() => {}}
            addToWishlist={() => {}}
            isProductPartOfBundle={true}
            setChildProductOrderability={() => {}}
        />
    )

    const addToCartButton = screen.queryByRole('button', {name: /add to cart/i})
    const addToWishlistButton = screen.queryByRole('button', {name: /add to wishlist/i})
    const variationAttributes = screen.getAllByRole('radiogroup') // e.g. sizes, colors
    const quantityPicker = screen.queryByRole('spinbutton', {name: /quantity:/i})

    // What should exist:
    expect(variationAttributes).toHaveLength(2)

    // What should _not_ exist:
    expect(addToCartButton).toBeNull()
    expect(addToWishlistButton).toBeNull()
    expect(quantityPicker).toBeNull()
})
