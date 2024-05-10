/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ProductTile, {Skeleton} from '@salesforce/retail-react-app/app/components/product-tile/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {fireEvent, within} from '@testing-library/react'
import {
    mockMasterProductHitWithMultipleVariants,
    mockMasterProductHitWithOneVariant,
    mockProductSearchItem,
    mockProductSetHit,
    mockStandardProductHit
} from '@salesforce/retail-react-app/app/mocks/product-search-hit-data'

test('Renders links and images', () => {
    const {getAllByRole} = renderWithProviders(<ProductTile product={mockProductSearchItem} />)

    const link = getAllByRole('link')
    const img = getAllByRole('img')

    expect(link).toBeDefined()
    expect(img).toBeDefined()
})

test('Renders Skeleton', () => {
    const {getAllByTestId} = renderWithProviders(<Skeleton />)

    const skeleton = getAllByTestId('sf-product-tile-skeleton')

    expect(skeleton).toBeDefined()
})

test('Remove from wishlist cannot be muti-clicked', () => {
    const onClick = jest.fn()

    const {getByTestId} = renderWithProviders(
        <ProductTile
            product={mockProductSearchItem}
            enableFavourite={true}
            onFavouriteToggle={onClick}
        />
    )
    const wishlistButton = getByTestId('wishlist-button')

    fireEvent.click(wishlistButton)
    fireEvent.click(wishlistButton)
    expect(onClick).toHaveBeenCalledTimes(1)
})

test('renders exact price with strikethrough price for master product can be has various variants', () => {
    const {queryByText, getByText, container} = renderWithProviders(
        <ProductTile product={mockMasterProductHitWithMultipleVariants} />
    )
    expect(getByText(/Black Single Pleat Athletic Fit Wool Suit - Edit/i)).toBeInTheDocument()
    expect(queryByText(/from/i)).toBeInTheDocument()

    const salePriceTag = container.querySelectorAll('b')
    const strikethroughPriceTag = container.querySelectorAll('s')
    expect(within(salePriceTag[1]).getByText(/£191\.99/i)).toBeDefined()
    expect(within(strikethroughPriceTag[0]).getByText(/£223\.99/i)).toBeDefined()
    // From and price are in separate b tag
    expect(salePriceTag).toHaveLength(2)
    expect(strikethroughPriceTag).toHaveLength(1)
})

test('renders exact price with strikethrough price for master product can be filtered down to one variant', () => {
    const {getByText, queryByText, container} = renderWithProviders(
        <ProductTile product={mockMasterProductHitWithOneVariant} />
    )
    expect(getByText(/black flat front wool suit/i)).toBeInTheDocument()
    expect(getByText(/£191\.99/i)).toBeInTheDocument()
    expect(getByText(/£320\.00/i)).toBeInTheDocument()
    expect(queryByText(/from/i)).not.toBeInTheDocument()

    const salePriceTag = container.querySelectorAll('b')
    const strikethroughPriceTag = container.querySelectorAll('s')
    expect(within(salePriceTag[0]).getByText(/£191\.99/i)).toBeDefined()
    expect(within(strikethroughPriceTag[0]).getByText(/£320\.00/i)).toBeDefined()
    expect(salePriceTag).toHaveLength(1)
    expect(strikethroughPriceTag).toHaveLength(1)
})

test('Product set - shows range From X where X is the lowest price child', () => {
    const {getByText, queryByText} = renderWithProviders(
        <ProductTile product={mockProductSetHit} />
    )
    expect(getByText(/Winter Look/i)).toBeInTheDocument()
    expect(queryByText(/from/i)).toBeInTheDocument()
    expect(queryByText(/£40\.16/i)).toBeInTheDocument()
    expect(queryByText(/£44\.16/i)).not.toBeInTheDocument()
})

test('renders strike through price with standard product', () => {
    const {getByText, container} = renderWithProviders(
        <ProductTile product={mockStandardProductHit} />
    )
    expect(getByText(/Laptop Briefcase with wheels \(37L\)/i)).toBeInTheDocument()
    expect(getByText(/£63\.99/i)).toBeInTheDocument()
    const salePriceTag = container.querySelectorAll('b')
    const strikethroughPriceTag = container.querySelectorAll('s')
    expect(within(salePriceTag[0]).getByText(/£63\.99/i)).toBeDefined()
    expect(within(strikethroughPriceTag[0]).getByText(/£67\.99/i)).toBeDefined()
    expect(salePriceTag).toHaveLength(1)
    expect(strikethroughPriceTag).toHaveLength(1)
})
