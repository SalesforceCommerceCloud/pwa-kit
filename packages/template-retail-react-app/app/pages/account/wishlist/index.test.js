/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import AccountWishlist from '.'
import {renderWithProviders} from '../../../utils/test-utils'
import {screen, waitFor} from '@testing-library/react'
import {mockedEmptyWishList, mockedProductLists, mockedWishListProducts} from './index.mock'
import {createServer} from '../../../../jest-setup'

const handlers = [
    {
        path: '*/products',
        res: () => {
            return mockedWishListProducts
        }
    },
    {
        path: '*/customers/:customerId/product-lists',
        res: () => {
            return mockedProductLists
        }
    }
]

beforeEach(() => {
    jest.resetModules()
})

describe('Wishlist account page', function () {
    const {prependHandlersToServer} = createServer(handlers)
    test('Renders wishlist page', async () => {
        renderWithProviders(<AccountWishlist />)

        await waitFor(() => {
            expect(screen.getByTestId('account-wishlist-page')).toBeInTheDocument()
        })

        await waitFor(() => {
            expect(screen.getByRole('link', {name: /fall look/i})).toBeInTheDocument()
        })
    })

    test('renders no wishlist items for empty wishlist', async () => {
        prependHandlersToServer([
            {
                path: '*/customers/:customerId/product-lists',
                res: () => {
                    return mockedEmptyWishList
                }
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
})
