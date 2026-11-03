/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, fireEvent} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {ChakraProvider} from '@salesforce/retail-react-app/app/components/shared/ui'
import {MultiSiteContext} from '@salesforce/retail-react-app/app/contexts'
import AiSearch from '@salesforce/retail-react-app/app/components/ai-search'
const mockNavigate = jest.fn()
const mockOpen = jest.fn()
const mockConfig = {
    app: {
        searchSummary: {enabled: true, agentHandoff: true},
        sites: [
            {
                id: 'shop-a',
                searchSummary: {
                    homeHero: {
                        title: 'Explore shop A',
                        suggestedSearches: [{label: 'Our shoes', query: 'running shoes'}]
                    }
                },
                commerceAgent: {enabled: 'true', provider: 'commerce-client'}
            },
            {
                id: 'shop-b',
                searchSummary: {
                    searchPlaceholder: 'Search shop B',
                    homeHero: {title: 'Discover shop B'}
                },
                commerceAgent: {enabled: 'false'}
            }
        ]
    }
}
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({getConfig: () => mockConfig}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => ({
    __esModule: true,
    default: () => mockNavigate
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-shopper-agent', () => ({
    useShopperAgent: () => ({actions: {open: mockOpen}})
}))
const renderSearch = (site, hero) =>
    render(
        <MultiSiteContext.Provider value={{site: {id: site}}}>
            <MemoryRouter>
                <ChakraProvider>
                    <AiSearch hero={hero} />
                </ChakraProvider>
            </MemoryRouter>
        </MultiSiteContext.Provider>
    )
afterEach(() => jest.clearAllMocks())
test('hero copy and suggested searches come from the active customer', () => {
    renderSearch('shop-a', true)
    expect(screen.getByRole('heading', {name: 'Explore shop A'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Our shoes'}))
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=running%20shoes')
    fireEvent.click(screen.getByRole('button', {name: /Help me choose/}))
    expect(mockOpen).toHaveBeenCalledTimes(1)
})
test('another site has its own copy and no unsupported agent action', () => {
    renderSearch('shop-b', true)
    expect(screen.getByRole('heading', {name: 'Discover shop B'})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Our shoes'})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /Help me choose/})).not.toBeInTheDocument()
})
test('compact search uses site placeholder and routes the shopper query', () => {
    renderSearch('shop-b', false)
    const input = screen.getByPlaceholderText('Search shop B')
    fireEvent.change(input, {target: {value: 'blue jacket'}})
    fireEvent.submit(input.closest('form'))
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=blue%20jacket')
})

// The hero inherits white text for its artwork; the white input must keep its own ink color.
test.each([true, false])('search text stays readable on the white field (hero=%s)', (hero) => {
    renderSearch('shop-a', hero)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, {target: {value: 'linen shirt'}})
    fireEvent.focus(input)
    expect(input).toHaveValue('linen shirt')
    expect(getComputedStyle(input).color).toBe('rgb(35, 61, 36)')
    expect(getComputedStyle(input).backgroundColor).toBe('rgb(255, 255, 255)')
})
