/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SuggestionSection from '@salesforce/retail-react-app/app/components/search/partials/search-suggestions-section'

// Mock dynamic image to keep DOM simple when HorizontalSuggestions renders
jest.mock('@salesforce/retail-react-app/app/components/dynamic-image', () => {
    return function MockDynamicImage(props) {
        const {src, widths, imageProps} = props || {}
        return (
            <img
                data-testid="dynamic-image"
                data-src={src}
                data-widths={(widths || []).join(',')}
                alt={imageProps?.alt ?? ''}
            />
        )
    }
})

const baseStyles = {
    textContainer: {},
    sectionHeader: {},
    phraseContainer: {}
}

const makeSearchSuggestions = (overrides = {}) => ({
    searchPhrase: 'Dress',
    phraseSuggestions: [],
    categorySuggestions: [],
    productSuggestions: [],
    ...overrides
})

test('renders "Did you mean" with suggestion link when non-exact phrase exists (mobile and desktop)', () => {
    const searchSuggestions = makeSearchSuggestions({
        phraseSuggestions: [{name: 'dresses', link: '/search?q=dresses', exactMatch: false}]
    })

    renderWithProviders(
        <SuggestionSection
            searchSuggestions={searchSuggestions}
            closeAndNavigate={jest.fn()}
            styles={baseStyles}
        />
    )

    // Appears in both mobile and desktop sections
    const didYouMeanTexts = screen.getAllByText(/Did you mean/i)
    expect(didYouMeanTexts.length).toBeGreaterThanOrEqual(1)

    const links = screen.getAllByRole('link', {name: /dresses\?/i})
    expect(links.length).toBeGreaterThanOrEqual(1)
})

test('renders Categories header and category suggestions', () => {
    const searchSuggestions = makeSearchSuggestions({
        categorySuggestions: [
            {type: 'category', name: 'Women', link: '/women'},
            {type: 'category', name: 'Men', link: '/men'}
        ]
    })

    renderWithProviders(
        <SuggestionSection
            searchSuggestions={searchSuggestions}
            closeAndNavigate={jest.fn()}
            styles={baseStyles}
        />
    )

    // Header present (could be duplicated for mobile/desktop)
    expect(screen.getAllByText('Categories').length).toBeGreaterThanOrEqual(1)

    // Suggestions component renders buttons; ensure names are present
    expect(screen.getAllByText('Women').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Men').length).toBeGreaterThanOrEqual(1)
})

test('renders horizontal product suggestions and "View All"; clicking a tile calls closeAndNavigate', async () => {
    const user = userEvent.setup()
    const closeAndNavigate = jest.fn()

    const searchSuggestions = makeSearchSuggestions({
        productSuggestions: [
            {
                type: 'product',
                name: 'Product 1',
                link: '/p1',
                image: 'https://example.com/p1.jpg',
                price: '19.99'
            },
            {type: 'product', name: 'Product 2', link: '/p2'}
        ]
    })

    renderWithProviders(
        <SuggestionSection
            searchSuggestions={searchSuggestions}
            closeAndNavigate={closeAndNavigate}
            styles={baseStyles}
        />
    )

    // HorizontalSuggestions container
    expect(screen.getByTestId('sf-horizontal-product-suggestions')).toBeInTheDocument()

    // "View All" link only renders when products exist (may be hidden by responsive wrapper in tests)
    expect(screen.getByText(/View All/i, {selector: 'a'})).toBeInTheDocument()

    // Click a product tile (desktop horizontal suggestions)
    const container = screen.getByTestId('sf-horizontal-product-suggestions')
    const tiles = within(container).getAllByTestId('product-tile')
    await user.click(tiles[1])
    expect(closeAndNavigate).toHaveBeenCalledWith('/p2')
})

test('renders nothing when there are no categories, products, or phrase suggestions', () => {
    const searchSuggestions = makeSearchSuggestions()

    renderWithProviders(
        <SuggestionSection
            searchSuggestions={searchSuggestions}
            closeAndNavigate={jest.fn()}
            styles={baseStyles}
        />
    )

    expect(screen.queryByText('Categories')).not.toBeInTheDocument()
    expect(screen.queryByText('Products')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sf-horizontal-product-suggestions')).not.toBeInTheDocument()
})
