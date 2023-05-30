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
        const suggestionsEl = within(suggestionPopoverEl).getByTestId('sf-suggestion')
        expect(suggestionsEl.querySelector('button').textContent).toBe('Dresses')
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
