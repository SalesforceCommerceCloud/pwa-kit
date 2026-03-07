/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import SearchSuggestions from '@salesforce/retail-react-app/app/components/search/partials/search-suggestions'

jest.mock(
    '@salesforce/retail-react-app/app/components/search/partials/search-suggestions-section',
    () => {
        /* eslint-disable react/prop-types -- mock component; cannot reference PropTypes inside jest.mock factory */
        const MockSuggestionSection = (props) => (
            <div data-testid="suggestion-section">
                {props.showAskAssistantBanner && props.onAskAssistantClick && (
                    <button
                        type="button"
                        onClick={props.onAskAssistantClick}
                        aria-label="Ask Shopping Agent - Discover, compare and shop smarter with your personal shopping assistant"
                    >
                        Ask Shopping Agent
                    </button>
                )}
            </div>
        )
        /* eslint-enable react/prop-types */
        return MockSuggestionSection
    }
)

test('when no suggestions: renders RecentSearches and shows Ask Shopping Agent banner when enabled with click handler', () => {
    renderWithProviders(
        <SearchSuggestions
            recentSearches={['shoes', 'dress']}
            searchSuggestions={{}}
            closeAndNavigate={jest.fn()}
            enableAgentFromSearchSuggestions={true}
            onAskAssistantClick={jest.fn()}
        />
    )

    expect(screen.getByTestId('sf-suggestion-recent')).toBeInTheDocument()
    expect(
        screen.getByRole('button', {
            name: /Ask Shopping Agent.*discover, compare,? and shop smarter/i
        })
    ).toBeInTheDocument()
})

test('when no suggestions and enableAgentFromSearchSuggestions false: does not show Ask Shopping Agent banner', () => {
    renderWithProviders(
        <SearchSuggestions
            recentSearches={['shoes']}
            searchSuggestions={{}}
            closeAndNavigate={jest.fn()}
            enableAgentFromSearchSuggestions={false}
            onAskAssistantClick={jest.fn()}
        />
    )

    expect(screen.getByTestId('sf-suggestion-recent')).toBeInTheDocument()
    expect(
        screen.queryByRole('button', {
            name: /Ask Shopping Agent.*discover, compare,? and shop smarter/i
        })
    ).not.toBeInTheDocument()
})

test('when no suggestions and onAskAssistantClick not provided: does not show Ask Shopping Agent banner', () => {
    renderWithProviders(
        <SearchSuggestions
            recentSearches={['shoes']}
            searchSuggestions={{}}
            closeAndNavigate={jest.fn()}
            enableAgentFromSearchSuggestions={true}
        />
    )

    expect(
        screen.queryByRole('button', {
            name: /Ask Shopping Agent.*discover, compare,? and shop smarter/i
        })
    ).not.toBeInTheDocument()
})

test('enableAgentFromSearchSuggestions string "true" shows banner when no suggestions', () => {
    renderWithProviders(
        <SearchSuggestions
            recentSearches={['shoes']}
            searchSuggestions={{}}
            closeAndNavigate={jest.fn()}
            enableAgentFromSearchSuggestions="true"
            onAskAssistantClick={jest.fn()}
        />
    )

    expect(
        screen.getByRole('button', {
            name: /Ask Shopping Agent.*discover, compare,? and shop smarter/i
        })
    ).toBeInTheDocument()
})

test('when has suggestions: renders SuggestionSection with showAskAssistantBanner and onAskAssistantClick', () => {
    const onAskAssistantClick = jest.fn()
    renderWithProviders(
        <SearchSuggestions
            recentSearches={[]}
            searchSuggestions={{
                categorySuggestions: [{type: 'category', name: 'Women', link: '/women'}]
            }}
            closeAndNavigate={jest.fn()}
            enableAgentFromSearchSuggestions={true}
            onAskAssistantClick={onAskAssistantClick}
        />
    )

    expect(screen.getByTestId('suggestion-section')).toBeInTheDocument()
    const banner = screen.getByRole('button', {
        name: /Ask Shopping Agent.*discover, compare,? and shop smarter/i
    })
    expect(banner).toBeInTheDocument()
})

test('when has suggestions and banner enabled: clicking banner calls onAskAssistantClick', async () => {
    const user = userEvent.setup()
    const onAskAssistantClick = jest.fn()
    renderWithProviders(
        <SearchSuggestions
            recentSearches={[]}
            searchSuggestions={{
                recentSearchSuggestions: [{type: 'recent', name: 'shoes', link: '/search?q=shoes'}]
            }}
            closeAndNavigate={jest.fn()}
            enableAgentFromSearchSuggestions={true}
            onAskAssistantClick={onAskAssistantClick}
        />
    )

    const banner = screen.getByRole('button', {
        name: /Ask Shopping Agent.*discover, compare,? and shop smarter/i
    })
    await user.click(banner)
    expect(onAskAssistantClick).toHaveBeenCalledTimes(1)
})
