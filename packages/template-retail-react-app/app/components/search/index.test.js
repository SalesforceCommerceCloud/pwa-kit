/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import user from '@testing-library/user-event'
import {screen, waitFor} from '@testing-library/react'
import SearchInput from './index'
import Suggestions from './partials/suggestions'
import {noop} from '../../utils/utils'
import mockSearchResults from '../../commerce-api/mocks/searchResults'
import mockConfig from '../../../config/mocks/default'

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperSearch: class ShopperSearchMock extends sdk.ShopperSearch {
            async getSearchSuggestions() {
                return mockSearchResults
            }
        }
    }
})

beforeEach(() => {
    jest.resetModules()
})

test('renders SearchInput', () => {
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    expect(searchInput).toBeInTheDocument()
})

test('renders Popover if recent searches populated', async () => {
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dresses')
    expect(await screen.findByTestId('sf-suggestion')).toBeInTheDocument()
    const countOfSuggestions = await screen.findAllByText('Dresses')
    expect(countOfSuggestions.length).toEqual(2)
})

test('changes url when enter is pressed', async () => {
    renderWithProviders(<SearchInput />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dresses{enter}')
    await waitFor(() => expect(window.location.pathname).toEqual(createPathWithDefaults('/search')))
    await waitFor(() => expect(window.location.search).toEqual('?q=Dresses'))
})

test('shows previously searched items when focused', async () => {
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    user.clear(searchInput)
    await searchInput.focus()
    const countOfSuggestions = await screen.findAllByText('Recent Searches')
    expect(countOfSuggestions.length).toEqual(2)
})

test('suggestions render when there are some', async () => {
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dress')
    const countOfSuggestions = await screen.findAllByText('Dress')
    expect(countOfSuggestions.length).toEqual(2)
})

test('clicking clear searches clears searches', async () => {
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await searchInput.focus()
    const clearSearch = document.getElementById('clear-search')
    await user.click(clearSearch)
    expect(await screen.findByTestId('sf-suggestion-popover')).toBeInTheDocument()
})

test('passing undefined to Suggestions returns undefined', async () => {
    const suggestions = renderWithProviders(
        <Suggestions suggestions={undefined} closeAndNavigate={noop} />
    )
    expect(suggestions.innerHTML).not.toBeDefined()
})
