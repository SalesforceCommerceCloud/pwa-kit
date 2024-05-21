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

test('renders exact price with strikethrough price for master product with multiple variants', () => {
    const {queryByText, getByText, container} = renderWithProviders(
        <ProductTile product={mockMasterProductHitWithMultipleVariants} />
    )
    expect(getByText(/Black Single Pleat Athletic Fit Wool Suit - Edit/i)).toBeInTheDocument()
    expect(queryByText(/from/i)).toBeInTheDocument()

    const currentPriceTag = container.querySelectorAll('b')
    const strikethroughPriceTag = container.querySelectorAll('s')
    expect(within(currentPriceTag[0]).getByText(/£191\.99/i)).toBeDefined()
    expect(within(strikethroughPriceTag[0]).getByText(/£223\.99/i)).toBeDefined()
    // From and price are in separate b tag
    expect(currentPriceTag).toHaveLength(1)
    expect(strikethroughPriceTag).toHaveLength(1)
})

test('renders exact price with strikethrough price for master product with one variant', () => {
    const {getByText, queryByText, container} = renderWithProviders(
        <ProductTile product={mockMasterProductHitWithOneVariant} />
    )
    expect(getByText(/black flat front wool suit/i)).toBeInTheDocument()
    expect(getByText(/£191\.99/i)).toBeInTheDocument()
    expect(getByText(/£320\.00/i)).toBeInTheDocument()
    expect(queryByText(/from/i)).not.toBeInTheDocument()

    const currentPriceTag = container.querySelectorAll('b')
    const strikethroughPriceTag = container.querySelectorAll('s')
    expect(within(currentPriceTag[0]).getByText(/£191\.99/i)).toBeDefined()
    expect(within(strikethroughPriceTag[0]).getByText(/£320\.00/i)).toBeDefined()
    expect(currentPriceTag).toHaveLength(1)
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
    const currentPriceTag = container.querySelectorAll('b')
    const strikethroughPriceTag = container.querySelectorAll('s')
    expect(within(currentPriceTag[0]).getByText(/£63\.99/i)).toBeDefined()
    expect(within(strikethroughPriceTag[0]).getByText(/£67\.99/i)).toBeDefined()
    expect(currentPriceTag).toHaveLength(1)
    expect(strikethroughPriceTag).toHaveLength(1)
})

test('renders badges corresponding to the default custom properties', () => {
    const {getByText, container} = renderWithProviders(
        <ProductTile product={mockStandardProductHit} />
    )
    expect(getByText(/Laptop Briefcase with wheels \(37L\)/i)).toBeInTheDocument()
    const badges = container.querySelectorAll('span')
    expect(badges).toHaveLength(3)
    expect(within(badges[0]).getByText(/New/i)).toBeDefined()
    expect(within(badges[1]).getByText(/Sale/i)).toBeDefined()
})

test('renders badges corresponding to the overridden custom properties', () => {
    const {getByText, container} = renderWithProviders(
        <ProductTile
            product={mockStandardProductHit}
            badgeLabels={[
                {
                    propertyName: 'c_isSpecial',
                    label: {id: 'product_tile.badge.label.special', defaultMessage: 'Special'},
                    color: 'green'
                },
                {
                    propertyName: 'c_isCloseout',
                    label: {id: 'product_tile.badge.label.closeout', defaultMessage: 'Closeout'},
                    color: 'yellow'
                }
            ]}
        />
    )
    expect(getByText(/Laptop Briefcase with wheels \(37L\)/i)).toBeInTheDocument()
    const badges = container.querySelectorAll('span')
    expect(badges).toHaveLength(2)
    expect(within(badges[0]).getByText(/Special/i)).toBeDefined()
})

test('renders only unique badges', () => {
    const {getByText, container} = renderWithProviders(
        <ProductTile
            product={mockStandardProductHit}
            badgeLabels={[
                {
                    propertyName: 'c_isSpecial',
                    label: {id: 'product_tile.badge.label.special', defaultMessage: 'Special'},
                    color: 'green'
                },
                {
                    propertyName: 'c_isSpecial',
                    label: {
                        id: 'product_tile.badge.label.special',
                        defaultMessage: 'Extra Special'
                    },
                    color: 'yellow'
                },
                {
                    propertyName: 'c_isSpecial',
                    label: {id: 'product_tile.badge.label.special', defaultMessage: 'Special'},
                    color: 'red'
                }
            ]}
        />
    )
    expect(getByText(/Laptop Briefcase with wheels \(37L\)/i)).toBeInTheDocument()
    const badges = container.querySelectorAll('span')
    expect(badges).toHaveLength(3)
    expect(within(badges[0]).getByText(/Special/i)).toBeDefined()
    expect(within(badges[1]).getByText(/Extra Special/i)).toBeDefined()
})

test('Ignores the badges that are NOT defined as custom properties', () => {
    const {getByText, container} = renderWithProviders(
        <ProductTile
            product={mockStandardProductHit}
            badgeLabels={[
                {
                    propertyName: 'c_isSpecial',
                    label: {id: 'product_tile.badge.label.special', defaultMessage: 'Special'},
                    color: 'green'
                },
                {
                    propertyName: 'c_isNotAvailable',
                    label: {
                        id: 'product_tile.badge.label.test',
                        defaultMessage: 'Test'
                    },
                    color: 'yellow'
                }
            ]}
        />
    )
    expect(getByText(/Laptop Briefcase with wheels \(37L\)/i)).toBeInTheDocument()
    const badges = container.querySelectorAll('span')
    expect(badges).toHaveLength(2)
    expect(within(badges[0]).getByText(/Special/i)).toBeDefined()
})

test('Ignores the badges that are NOT defined as boolean custom properties', () => {
    const {getByText, container} = renderWithProviders(
        <ProductTile
            product={mockStandardProductHit}
            badgeLabels={[
                {
                    propertyName: 'c_isSpecial',
                    label: {id: 'product_tile.badge.label.special', defaultMessage: 'Special'},
                    color: 'green'
                },
                {
                    propertyName: 'c_styleNumber',
                    label: {
                        id: 'product_tile.badge.label.test',
                        defaultMessage: 'Test'
                    },
                    color: 'yellow'
                }
            ]}
        />
    )
    expect(getByText(/Laptop Briefcase with wheels \(37L\)/i)).toBeInTheDocument()
    const badges = container.querySelectorAll('span')
    expect(badges).toHaveLength(2)
    expect(within(badges[0]).getByText(/Special/i)).toBeDefined()
})
