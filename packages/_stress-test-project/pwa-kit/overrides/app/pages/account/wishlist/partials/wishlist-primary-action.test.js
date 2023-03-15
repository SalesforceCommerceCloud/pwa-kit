/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mockWishListDetails} from './wishlist-primary-action.mock'
import ItemVariantProvider from '../../../../components/item-variant'
import {renderWithProviders} from '../../../../utils/test-utils'
import WishlistPrimaryAction from './wishlist-primary-action'
import userEvent from '@testing-library/user-event'
import {screen, waitFor} from '@testing-library/react'
import PropTypes from 'prop-types'

const MockedComponent = ({variant}) => {
    return (
        <ItemVariantProvider variant={variant}>
            <WishlistPrimaryAction />
        </ItemVariantProvider>
    )
}
MockedComponent.propTypes = {
    variant: PropTypes.object
}

jest.mock('../../../../commerce-api/hooks/useBasket', () => {
    return () => {
        return {
            addItemToBasket: jest.fn()
        }
    }
})

beforeEach(() => {
    jest.resetModules()
})

test('the Add To Cart button', async () => {
    const variant = mockWishListDetails.data[3]
    const {getByRole} = renderWithProviders(<MockedComponent variant={variant} />)

    const addToCartButton = getByRole('button', {
        name: /add to cart/i
    })
    expect(addToCartButton).toBeInTheDocument()
    userEvent.click(addToCartButton)

    await waitFor(() => {
        // Chakra UI renders multiple elements with toast title in DOM for accessibility.
        // We need to assert the actual text within the alert
        expect(screen.getAllByRole('alert')[0]).toHaveTextContent(/1 item added to cart/i)
    })
})

test('the Add Set To Cart button', async () => {
    const productSetWithoutVariants = mockWishListDetails.data[1]
    renderWithProviders(<MockedComponent variant={productSetWithoutVariants} />)

    const button = screen.getByRole('button', {name: /add set to cart/i})
    userEvent.click(button)

    await waitFor(() => {
        expect(screen.getAllByRole('alert')[0]).toHaveTextContent(/2 items added to cart/i)
    })
})

test('the View Full Details button', () => {
    const productSetWithVariants = mockWishListDetails.data[0]
    renderWithProviders(<MockedComponent variant={productSetWithVariants} />)

    const link = screen.getByRole('link', {name: /view full details/i})
    expect(link).toBeInTheDocument()
})

test('the View Options button', async () => {
    const masterProduct = mockWishListDetails.data[2]
    renderWithProviders(<MockedComponent variant={masterProduct} />)

    const button = screen.getByRole('button', {name: /view options/i})
    userEvent.click(button)

    await waitFor(
        () => {
            const modal = screen.getByTestId('product-view-modal')
            expect(modal).toBeVisible()
        },
        // Seems like rendering the modal takes a bit more time
        {timeout: 5000}
    )
})
