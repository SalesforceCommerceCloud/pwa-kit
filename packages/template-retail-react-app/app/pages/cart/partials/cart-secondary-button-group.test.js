/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {mockedCustomerProductListsDetails} from '../../../mocks/mock-data'
import ItemVariantProvider from '../../../components/item-variant'
import {renderWithProviders} from '../../../utils/test-utils'
import CartSecondaryButtonGroup from './cart-secondary-button-group'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {noop} from '../../../utils/utils'

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
    renderWithProviders(<MockedComponent />)
    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })
    expect(removeButton).toBeInTheDocument()
    user.click(removeButton)

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

    renderWithProviders(
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
    user.click(editButton)
    expect(onEditClick).toHaveBeenCalledTimes(1)

    const addToWishlistButton = screen.getByRole('button', {
        name: /Add to wishlist/i
    })
    user.click(addToWishlistButton)
    expect(onAddToWishlistClick).toHaveBeenCalledTimes(1)

    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })

    expect(removeButton).toBeInTheDocument()

    user.click(removeButton)

    const confirmButton = screen.getByRole('button', {name: /yes, remove item/i})
    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(confirmButton).toBeInTheDocument()
    })
    user.click(confirmButton)

    expect(onRemoveItemClick).toHaveBeenCalledTimes(1)
})
