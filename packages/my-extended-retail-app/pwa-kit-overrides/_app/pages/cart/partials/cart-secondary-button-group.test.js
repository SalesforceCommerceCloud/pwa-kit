/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {mockedCustomerProductListsDetails} from '@salesforce/retail-react-app/app/mocks/mock-data'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import CartSecondaryButtonGroup from '@salesforce/retail-react-app/app/pages/cart/partials/cart-secondary-button-group'
import {screen, waitFor} from '@testing-library/react'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

const MockedComponent = ({
    onAddToWishlistClick = noop,
    onEditClick = noop,
    onRemoveItemClick = noop
}) => {
    const product = mockedCustomerProductListsDetails.data[0]
    return (
        <ItemVariantProvider variant={{...product, productName: product.name}}>
            <CartSecondaryButtonGroup
                onAddToWishlistClick={onAddToWishlistClick}
                onEditClick={onEditClick}
                onRemoveItemClick={onRemoveItemClick}
            />
        </ItemVariantProvider>
    )
}

MockedComponent.propTypes = {
    onAddToWishlistClick: PropTypes.func,
    onEditClick: PropTypes.func,
    onRemoveItemClick: PropTypes.func
}

beforeEach(() => {
    jest.resetModules()
})

test('renders secondary action component', async () => {
    const {user} = renderWithProviders(<MockedComponent />)
    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })
    expect(removeButton).toBeInTheDocument()
    await user.click(removeButton)

    const confirmButton = screen.getByRole('button', {name: /yes, remove item/i})
    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(confirmButton).toBeInTheDocument()
    })
})

test('renders secondary with event handlers', async () => {
    const onRemoveItemClick = jest.fn()
    const onEditClick = jest.fn()
    const onAddToWishlistClick = jest.fn()

    const {user} = renderWithProviders(
        <MockedComponent
            onAddToWishlistClick={onAddToWishlistClick}
            onEditClick={onEditClick}
            onRemoveItemClick={onRemoveItemClick}
        />
    )

    const editButton = screen.getByRole('button', {
        name: /Edit/i
    })

    expect(editButton).toBeInTheDocument()
    await user.click(editButton)
    expect(onEditClick).toHaveBeenCalledTimes(1)

    const addToWishlistButton = screen.getByRole('button', {
        name: /Add to wishlist/i
    })
    await user.click(addToWishlistButton)
    expect(onAddToWishlistClick).toHaveBeenCalledTimes(1)

    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })

    expect(removeButton).toBeInTheDocument()

    await user.click(removeButton)

    const confirmButton = screen.getByRole('button', {name: /yes, remove item/i})
    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(confirmButton).toBeInTheDocument()
    })
    await user.click(confirmButton)

    expect(onRemoveItemClick).toHaveBeenCalledTimes(1)
})
