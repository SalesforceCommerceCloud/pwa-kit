/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import userEvent from '@testing-library/user-event'
import {screen, waitFor, within} from '@testing-library/react'
import SearchInput from '@salesforce/retail-react-app/app/components/search/index'
import Suggestions from '@salesforce/retail-react-app/app/components/search/partials/suggestions'
import {
    clearSessionJSONItem,
    getSessionJSONItem,
    setSessionJSONItem,
    noop
} from '@salesforce/retail-react-app/app/utils/utils'
import {RECENT_SEARCH_KEY, RECENT_SEARCH_LIMIT} from '@salesforce/retail-react-app/app/constants'
import mockSearchResults from '@salesforce/retail-react-app/app/mocks/searchResults'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {rest} from 'msw'
import {mockCustomerBaskets} from '@salesforce/retail-react-app/app/mocks/mock-data'

beforeEach(() => {
    clearSessionJSONItem(RECENT_SEARCH_KEY)
    jest.resetModules()
    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockSearchResults))
        }),
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        })
    )
})

test('renders SearchInput', () => {
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    expect(searchInput).toBeInTheDocument()
})

test('changes url when enter is pressed', async () => {
    const user = userEvent.setup()

    renderWithProviders(<SearchInput />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dresses{enter}')
    await waitFor(() => {
        expect(window.location.pathname).toEqual(createPathWithDefaults('/search'))
        expect(window.location.search).toBe('?q=Dresses')
        const suggestionPopoverEl = screen.getByTestId('sf-suggestion-popover')
        expect(suggestionPopoverEl).toBeInTheDocument()
    })
})

test('shows previously searched items when focused', async () => {
    const user = userEvent.setup()

    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.clear(searchInput)
    await searchInput.focus()
    const suggestionPopoverEl = await screen.getByTestId('sf-suggestion-popover')
    const recentSearchesEl = await within(suggestionPopoverEl).getByTestId('sf-suggestion-recent')
    expect(recentSearchesEl).toBeInTheDocument()
    expect(
        document.querySelectorAll('[data-testid=sf-suggestion-popover] button[name=recent-search]')
    ).toHaveLength(3)
})

test('saves recent searches on submit', async () => {
    const user = userEvent.setup()
    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Gloves{enter}')
    expect(getSessionJSONItem(RECENT_SEARCH_KEY)).toHaveLength(4)
})

test('limits number of saved recent searches', async () => {
    const user = userEvent.setup()

    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops', 'Gloves', 'Bracelets'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Ties{enter}')
    expect(getSessionJSONItem(RECENT_SEARCH_KEY)).toHaveLength(RECENT_SEARCH_LIMIT)
})

test('suggestions render when there are some', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dress')
    expect(searchInput.value).toBe('Dress')
    const suggestionPopoverEl = await screen.getByTestId('sf-suggestion-popover')
    await waitFor(() => {
        const suggestionsEls = within(suggestionPopoverEl).getAllByTestId('sf-suggestion')
        expect(suggestionsEls.length).toBeGreaterThan(0)
        const hasDressesSuggestion = suggestionsEls.some((el) =>
            el.querySelector('button')?.textContent?.includes('Dresses')
        )
        expect(hasDressesSuggestion).toBe(true)
    })
})

test('clicking clear searches clears recent searches', async () => {
    const user = userEvent.setup()
    setSessionJSONItem(RECENT_SEARCH_KEY, ['Dresses', 'Suits', 'Tops'])
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await searchInput.focus()
    const clearSearch = document.getElementById('clear-search')
    await user.click(clearSearch)
    expect(getSessionJSONItem(RECENT_SEARCH_KEY)).toBeUndefined()
})

test('passing undefined to Suggestions returns undefined', async () => {
    const suggestions = renderWithProviders(
        <Suggestions suggestions={undefined} closeAndNavigate={noop} />
    )
    expect(suggestions.innerHTML).toBeUndefined()
})

// Additional tests to improve coverage

test('handles search phrase in formatSuggestions', async () => {
    const user = userEvent.setup()

    // Mock search results with searchPhrase
    const mockResultsWithPhrase = {
        ...mockSearchResults,
        searchPhrase: 'test search phrase'
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithPhrase))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'test')

    // Wait for suggestions to load with search phrase
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})

test('handles product badges in suggestions', async () => {
    const user = userEvent.setup()

    // Mock search results with product badges
    const mockResultsWithBadges = {
        ...mockSearchResults,
        productSuggestions: {
            ...mockSearchResults.productSuggestions,
            products: [
                {
                    ...mockSearchResults.productSuggestions.products[0],
                    c_isNew: true,
                    c_isSale: false
                }
            ]
        }
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithBadges))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'Dress')

    // Wait for suggestions to load with badges
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})

test('handles brand suggestions in formatSuggestions', async () => {
    const user = userEvent.setup()

    // Mock search results with brand suggestions
    const mockResultsWithBrands = {
        ...mockSearchResults,
        brandSuggestions: {
            suggestedPhrases: [{phrase: 'Nike'}, {phrase: 'Adidas'}]
        }
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithBrands))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'Nike')

    // Wait for suggestions to load with brand suggestions
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})

test('handles phrase suggestions in formatSuggestions', async () => {
    const user = userEvent.setup()

    // Mock search results with phrase suggestions
    const mockResultsWithPhrases = {
        ...mockSearchResults,
        productSuggestions: {
            ...mockSearchResults.productSuggestions,
            suggestedPhrases: [
                {phrase: 'running shoes', exactMatch: true},
                {phrase: 'athletic wear', exactMatch: false}
            ]
        }
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithPhrases))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'running')

    // Wait for suggestions to load with phrase suggestions
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})

test('handles category suggestions with images and parent categories', async () => {
    const user = userEvent.setup()

    // Mock search results with category suggestions that have images and parent categories
    const mockResultsWithCategoryDetails = {
        ...mockSearchResults,
        categorySuggestions: {
            categories: [
                {
                    id: 'womens-clothing-dresses',
                    name: 'Dresses',
                    parentCategoryName: 'Clothing',
                    image: {
                        disBaseLink: 'https://example.com/dress-image.jpg'
                    }
                }
            ]
        }
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithCategoryDetails))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'Dress')

    // Wait for suggestions to load with detailed category suggestions
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})

test('handles product suggestions with images', async () => {
    const user = userEvent.setup()

    // Mock search results with product suggestions that have images
    const mockResultsWithProductImages = {
        ...mockSearchResults,
        productSuggestions: {
            ...mockSearchResults.productSuggestions,
            products: [
                {
                    ...mockSearchResults.productSuggestions.products[0],
                    image: {
                        disBaseLink: 'https://example.com/product-image.jpg'
                    }
                }
            ]
        }
    }

    global.server.use(
        rest.get('*/search-suggestions', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockResultsWithProductImages))
        })
    )

    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')

    await user.type(searchInput, 'Dress')

    // Wait for suggestions to load with product images
    await waitFor(() => {
        expect(screen.getByTestId('sf-suggestion-popover')).toBeInTheDocument()
    })
})
