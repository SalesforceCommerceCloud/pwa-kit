/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
// @sfdc-extension-line SFDC_EXT_WISHLIST
import AccountWishlist from '.'
import {renderWithProviders} from '../../../utils/test-utils'
import {screen, waitFor} from '@testing-library/react'
import {
    mockedNullWishList,
    mockedEmptyWishList,
    mockedProductLists,
    mockedWishListProducts
} from './index.mock'
import {prependHandlersToServer} from '../../../../jest-setup'

beforeEach(() => {
    jest.resetModules()

    prependHandlersToServer([
        {
            path: '*/products',
            method: 'get',
            res: () => mockedWishListProducts
        },
        {
            path: '*/customers/:customerId/product-lists',
            method: 'get',
            res: () => mockedProductLists
        }
    ])
})

test('Renders wishlist page', async () => {
    renderWithProviders(<AccountWishlist />)
    await waitFor(() => {
        expect(screen.getByTestId('account-wishlist-page')).toBeInTheDocument()
        expect(screen.getByTestId('sf-cart-item-P0150M')).toBeInTheDocument()
    })
})

test('renders no wishlist items for null data in wishlist', async () => {
    prependHandlersToServer([
        {
            path: '*/customers/:customerId/product-lists',
            method: 'get',
            res: () => mockedNullWishList
        }
    ])

    renderWithProviders(<AccountWishlist />)
    await waitFor(() => {
        expect(screen.getByText(/no wishlist items/i)).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /continue shopping/i})).toBeInTheDocument()
    })
})

test('renders no wishlist items for empty data in wishlist', async () => {
    prependHandlersToServer([
        {
            path: '*/customers/:customerId/product-lists',
            method: 'get',
            res: () => mockedEmptyWishList
        }
    ])

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
