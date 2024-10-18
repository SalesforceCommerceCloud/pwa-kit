/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ProductTile, {Skeleton} from '@salesforce/retail-react-app/app/components/product-tile/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {fireEvent, waitFor, within, screen} from '@testing-library/react'
import {
    mockMasterProductHitWithMultipleVariants,
    mockMasterProductHitWithOneVariant,
    mockProductSearchItem,
    mockProductSetHit,
    mockStandardProductHit
} from '@salesforce/retail-react-app/app/mocks/product-search-hit-data'
import {useBreakpointValue} from '@salesforce/retail-react-app/app/components/shared/ui'

jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => {
    const originalModule = jest.requireActual(
        '@salesforce/retail-react-app/app/components/shared/ui'
    )
    return {
        ...originalModule,
        useBreakpointValue: jest.fn()
    }
})

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

test('Renders PricingAndPromotionsSkeleton when isRefetching is true', async () => {
    const {getAllByTestId, queryByTestId} = renderWithProviders(
        <ProductTile isRefreshingData={true} product={mockMasterProductHitWithMultipleVariants} />
    )

    const skeleton = getAllByTestId('sf-product-tile-pricing-and-promotions-skeleton')

    expect(skeleton).toBeDefined()
    expect(queryByTestId('sf-product-tile-skeleton')).not.toBeInTheDocument()
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

test('Renders variant details based on the selected swatch', async () => {
    useBreakpointValue.mockReturnValue(true)

    const {getAllByRole, getByTestId} = renderWithProviders(
        <ProductTile product={mockProductSearchItem} />
    )
    const swatches = getAllByRole('radio')
    const productImage = getByTestId('product-tile-image')
    const productTile = getByTestId('product-tile')

    // Initial render will show swatched and the image will be the represented product variation
    expect(swatches).toHaveLength(2)
    expect(productImage.firstChild.getAttribute('src')).toBe(
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw175c1a89/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg'
    )
    const currentPriceTag = productTile.querySelectorAll('b')
    const strikethroughPriceTag = productTile.querySelectorAll('s')
    expect(currentPriceTag).toHaveLength(1)
    expect(within(currentPriceTag[0]).getByText(/£191\.99/i)).toBeDefined()
    expect(strikethroughPriceTag).toHaveLength(1)
    expect(within(strikethroughPriceTag[0]).getByText(/£320\.00/i)).toBeDefined()

    // Navigating to different color swatch changes the image & price.
    // Default selected swatch is swatches[1] as it is the represented product.
    fireEvent.mouseOver(swatches[0])
    await waitFor(() => screen.getByTestId('product-tile-image'))
    expect(productImage.firstChild.getAttribute('src')).toBe(
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29b7f226/images/large/PG.52002RUBN4Q.NAVYWL.PZ.jpg'
    )
    expect(currentPriceTag).toHaveLength(1)
    expect(within(currentPriceTag[0]).getByText(/£143\.99/i)).toBeDefined()
    expect(strikethroughPriceTag).toHaveLength(1)
    expect(within(strikethroughPriceTag[0]).getByText(/£320\.00/i)).toBeDefined()
    expect(screen.getByTestId('promo-callout')).toBeInTheDocument()
})

test('Renders variant details based on the selected swatch on mobile', async () => {
    useBreakpointValue.mockReturnValue(false)

    const {getAllByRole, getByTestId} = renderWithProviders(
        <ProductTile product={mockProductSearchItem} />
    )
    const swatches = getAllByRole('radio')
    const productImage = getByTestId('product-tile-image')
    const productTile = getByTestId('product-tile')

    // Initial render will show swatched and the image will be the represented product variation
    expect(swatches).toHaveLength(2)
    expect(productImage.firstChild.getAttribute('src')).toBe(
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw175c1a89/images/large/PG.33698RUBN4Q.CHARCWL.PZ.jpg'
    )
    const currentPriceTag = productTile.querySelectorAll('b')
    const strikethroughPriceTag = productTile.querySelectorAll('s')
    expect(currentPriceTag).toHaveLength(1)
    expect(within(currentPriceTag[0]).getByText(/£191\.99/i)).toBeDefined()
    expect(strikethroughPriceTag).toHaveLength(1)
    expect(within(strikethroughPriceTag[0]).getByText(/£320\.00/i)).toBeDefined()

    // Navigating to different color swatch changes the image & price.
    // Default selected swatch is swatches[1] as it is the represented product.
    fireEvent.click(swatches[0])
    await waitFor(() => screen.getByTestId('product-tile-image'))
    expect(productImage.firstChild.getAttribute('src')).toBe(
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw29b7f226/images/large/PG.52002RUBN4Q.NAVYWL.PZ.jpg'
    )
    expect(currentPriceTag).toHaveLength(1)
    expect(within(currentPriceTag[0]).getByText(/£143\.99/i)).toBeDefined()
    expect(strikethroughPriceTag).toHaveLength(1)
    expect(within(strikethroughPriceTag[0]).getByText(/£320\.00/i)).toBeDefined()
    expect(screen.getByTestId('promo-callout')).toBeInTheDocument()
})

test('Renders price range with starting price and strikethrough price for master product with multiple variants', async () => {
    useBreakpointValue.mockReturnValue(true)

    const {getByText, getByTestId, getAllByRole, container} = renderWithProviders(
        <ProductTile product={mockMasterProductHitWithMultipleVariants} />
    )
    expect(getByText(/Long Sleeve Embellished Boat Neck Top/i)).toBeInTheDocument()
    const productImage = getByTestId('product-tile-image')
    expect(productImage.firstChild.getAttribute('src')).toBe(
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw3255ea4c/images/large/PG.10217069.JJ908XX.PZ.jpg'
    )

    const currentPriceTag = container.querySelectorAll('b')
    const strikethroughPriceTag = container.querySelectorAll('s')

    expect(currentPriceTag).toHaveLength(1)
    expect(within(currentPriceTag[0]).getByText(/From £18\.55/i)).toBeDefined()
    expect(strikethroughPriceTag).toHaveLength(1)
    expect(within(strikethroughPriceTag[0]).getByText(/£31\.36/i)).toBeDefined()

    // Navigating to different color swatch changes the image but keeps the same price range.
    const swatches = getAllByRole('radio')
    // Default selected swatch is swatches[1] as it is the represented product.
    fireEvent.mouseOver(swatches[0])
    await waitFor(() => screen.getByTestId('product-tile-image'))
    expect(productImage.firstChild.getAttribute('src')).toBe(
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7e4c00a0/images/large/PG.10217069.JJ5QZXX.PZ.jpg'
    )
    expect(currentPriceTag).toHaveLength(1)
    expect(within(currentPriceTag[0]).getByText(/From £18\.55/i)).toBeDefined()
    expect(strikethroughPriceTag).toHaveLength(1)
    expect(within(strikethroughPriceTag[0]).getByText(/£31\.36/i)).toBeDefined()
})

test('renders exact price with strikethrough price for master product with one variant', () => {
    const {getAllByText, getByText, queryByText, container} = renderWithProviders(
        <ProductTile product={mockMasterProductHitWithOneVariant} />
    )
    expect(getByText(/black flat front wool suit/i)).toBeInTheDocument()
    expect(getAllByText(/^£191\.99/i)).toHaveLength(1)
    expect(getAllByText(/^£320\.00/i)).toHaveLength(1)
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
    expect(queryByText(/from £40\.16/i)).toBeInTheDocument()
    expect(queryByText(/£44\.16/i)).not.toBeInTheDocument()
})

test('renders strike through price with standard product', () => {
    const {getByText, container} = renderWithProviders(
        <ProductTile product={mockStandardProductHit} />
    )
    expect(getByText(/Laptop Briefcase with wheels \(37L\)/i)).toBeInTheDocument()
    expect(getByText(/^£63\.99/i)).toBeInTheDocument()
    const currentPriceTag = container.querySelectorAll('b')
    const strikethroughPriceTag = container.querySelectorAll('s')
    expect(within(currentPriceTag[0]).getByText(/£63\.99/i)).toBeDefined()
    expect(within(strikethroughPriceTag[0]).getByText(/£67\.99/i)).toBeDefined()
    expect(currentPriceTag).toHaveLength(1)
    expect(strikethroughPriceTag).toHaveLength(1)
})

test('renders badges corresponding to the default custom properties', () => {
    const {getByText, getAllByTestId} = renderWithProviders(
        <ProductTile product={mockStandardProductHit} />
    )
    expect(getByText(/Laptop Briefcase with wheels \(37L\)/i)).toBeInTheDocument()
    const badges = getAllByTestId('product-badge')
    expect(badges).toHaveLength(2)
    expect(within(badges[0]).getByText(/New/i)).toBeDefined()
    expect(within(badges[1]).getByText(/Sale/i)).toBeDefined()
})

test('renders badges corresponding to the overridden custom properties', () => {
    const {getByText, getAllByTestId} = renderWithProviders(
        <ProductTile
            product={mockStandardProductHit}
            badgeDetails={[
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
    const badges = getAllByTestId('product-badge')
    expect(badges).toHaveLength(1)
    expect(within(badges[0]).getByText(/Special/i)).toBeDefined()
})

test('renders only unique badges', () => {
    const {getByText, getAllByTestId} = renderWithProviders(
        <ProductTile
            product={mockStandardProductHit}
            badgeDetails={[
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
    const badges = getAllByTestId('product-badge')
    expect(badges).toHaveLength(2)
    expect(within(badges[0]).getByText(/Special/i)).toBeDefined()
    expect(within(badges[1]).getByText(/Extra Special/i)).toBeDefined()
})

test('Ignores the badges that are NOT defined as custom properties', () => {
    const {getByText, getAllByTestId} = renderWithProviders(
        <ProductTile
            product={mockStandardProductHit}
            badgeDetails={[
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
    const badges = getAllByTestId('product-badge')
    expect(badges).toHaveLength(1)
    expect(within(badges[0]).getByText(/Special/i)).toBeDefined()
})

test('Ignores the badges that are NOT defined as boolean custom properties', () => {
    const {getByText, getAllByTestId} = renderWithProviders(
        <ProductTile
            product={mockStandardProductHit}
            badgeDetails={[
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
    const badges = getAllByTestId('product-badge')
    expect(badges).toHaveLength(1)
    expect(within(badges[0]).getByText(/Special/i)).toBeDefined()
})
