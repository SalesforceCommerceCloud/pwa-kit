/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mockWishListDetails} from '@salesforce/retail-react-app/app/pages/account/wishlist/partials/wishlist-primary-action.mock'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import WishlistPrimaryAction from '@salesforce/retail-react-app/app/pages/account/wishlist/partials/wishlist-primary-action'
import {screen, waitFor} from '@testing-library/react'
import PropTypes from 'prop-types'
import {rest} from 'msw'
import {basketWithProductSet} from '@salesforce/retail-react-app/app/pages/product-detail/index.mock'

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

jest.mock('../../../../hooks/use-current-basket', () => {
    return {
        useCurrentBasket: () => {
            return {
                data: {basketId: 'basket_id'},
                derivedData: {totalItems: 5}
            }
        }
    }
})

beforeEach(() => {
    jest.resetModules()

    global.server.use(
        // For adding items to basket
        rest.post('*/baskets/:basketId/items', (req, res, ctx) => {
            return res(ctx.json(basketWithProductSet))
        })
    )
})

test('the Add To Cart button', async () => {
    const variant = mockWishListDetails.data[3]
    const {user} = renderWithProviders(<MockedComponent variant={variant} />)

    const addToCartButton = await screen.findByRole('button', {
        name: /add to cart/i
    })
    await user.click(addToCartButton)

    await waitFor(() => {
        expect(screen.getByText(/1 item added to cart/i)).toBeInTheDocument()
    })
})

test('the Add Set To Cart button', async () => {
    const productSetWithoutVariants = mockWishListDetails.data[1]
    const {user} = renderWithProviders(<MockedComponent variant={productSetWithoutVariants} />)

    const button = await screen.findByRole('button', {name: /add set to cart/i})
    await user.click(button)

    await waitFor(() => {
        expect(screen.getByText(/2 items added to cart/i)).toBeInTheDocument()
    })
})

test('the View Full Details button', async () => {
    const productSetWithVariants = mockWishListDetails.data[0]
    renderWithProviders(<MockedComponent variant={productSetWithVariants} />)

    const link = await screen.findByRole('link', {name: /view full details/i})
    expect(link).toBeInTheDocument()
})

test('the View Options button', async () => {
    const masterProduct = mockWishListDetails.data[2]
    const {user} = renderWithProviders(<MockedComponent variant={masterProduct} />)

    const button = await screen.findByRole('button', {name: /view options/i})
    await user.click(button)

    await waitFor(
        () => {
            const modal = screen.getByTestId('product-view-modal')
            expect(modal).toBeVisible()
        },
        // Seems like rendering the modal takes a bit more time
        {timeout: 5000}
    )
}, 30000)
