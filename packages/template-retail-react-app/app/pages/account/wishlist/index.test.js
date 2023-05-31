/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import AccountWishlist from '.'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {screen, waitFor} from '@testing-library/react'
import {rest} from 'msw'
import {
    mockedEmptyWishList,
    mockedProductLists,
    mockedWishListProducts
} from '@salesforce/retail-react-app/app/pages/account/wishlist/index.mock'

beforeEach(() => {
    jest.resetModules()

    global.server.use(
        rest.get('*/products', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedWishListProducts))
        }),
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedProductLists))
        })
    )
})

test('Renders wishlist page', async () => {
    renderWithProviders(<AccountWishlist />)
    await waitFor(() => {
        expect(screen.getByTestId('account-wishlist-page')).toBeInTheDocument()
        expect(screen.getByRole('link', {name: /fall look/i})).toBeInTheDocument()
    })
})

test('renders no wishlist items for empty wishlist', async () => {
    global.server.use(
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedEmptyWishList))
        })
    )

    renderWithProviders(<AccountWishlist />)
    await waitFor(() => {
        expect(screen.getByText(/no wishlist items/i)).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /continue shopping/i})).toBeInTheDocument()
    })
})

test('renders skeleton when product list is loading', () => {
    renderWithProviders(<AccountWishlist />)
    expect(screen.getByTestId('sf-wishlist-skeleton')).toBeInTheDocument()
})
