/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, act} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import ProductListGrid from './product-list-grid'

jest.mock('../../../utils/utils', () => {
    const original = jest.requireActual('../../../utils/utils')
    return {
        ...original,
        isHydrated: jest.fn().mockReturnValue(true)
    }
})

jest.mock('../../../components/product-tile', () => {
    const productTile = jest.fn(function ProductTile(props) {
        const {product, onFavouriteToggle, onClick} = props
        return (
            <div
                data-testid={`sf-product-tile-${product.productId}`}
                onClick={onClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onClick()}
            >
                <h1>{product.productName}</h1>
                <button
                    data-testid="tile-wishlist-btn"
                    onClick={() => onFavouriteToggle(true)}
                ></button>
            </div>
        )
    })
    productTile.Skeleton = function Skeleton() {
        return <div data-testid="sf-product-tile-skeleton"></div>
    }
    return productTile
})

const mockProps = {
    productSearchResult: {
        hits: [
            {
                productId: 'product1',
                productName: 'Product 1',
                price: 100,
                currency: 'USD'
            },
            {
                productId: 'product2',
                productName: 'Product 2',
                price: 200,
                currency: 'USD'
            }
        ]
    },
    isRefetching: false,
    isFetched: true,
    searchParams: {limit: 2},
    productListConfig: {},
    isItemInWishlist: jest.fn(),
    onFavouriteToggle: jest.fn(),
    onClickProduct: jest.fn()
}

describe('ProductListGrid', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders skeletons when loading', () => {
        const props = {
            ...mockProps,
            productSearchResult: undefined,
            isRefetching: true,
            isFetched: false
        }
        renderWithProviders(<ProductListGrid {...props} />)
        expect(screen.getAllByTestId('sf-product-tile-skeleton')).toHaveLength(
            props.searchParams.limit
        )
    })

    test('renders product tiles when data is available', () => {
        renderWithProviders(<ProductListGrid {...mockProps} />)
        expect(screen.getAllByTestId(/sf-product-tile-/)).toHaveLength(
            mockProps.productSearchResult.hits.length
        )
        expect(screen.getByText('Product 1')).toBeInTheDocument()
        expect(screen.getByText('Product 2')).toBeInTheDocument()
    })

    test('handles product click', async () => {
        const {user} = renderWithProviders(<ProductListGrid {...mockProps} />)
        const productTiles = screen.getAllByTestId(/sf-product-tile-/)
        await act(async () => {
            await user.click(productTiles[0])
        })
        expect(mockProps.onClickProduct).toHaveBeenCalledWith(mockProps.productSearchResult.hits[0])
    })

    test('handles favourite toggle', async () => {
        mockProps.isItemInWishlist.mockReturnValue(false)

        const {user} = renderWithProviders(<ProductListGrid {...mockProps} />)
        const favouriteButtons = screen.getAllByTestId('tile-wishlist-btn')
        await act(async () => {
            await user.click(favouriteButtons[0])
        })
        expect(mockProps.onFavouriteToggle).toHaveBeenCalledWith(
            mockProps.productSearchResult.hits[0],
            true
        )
    })
})
