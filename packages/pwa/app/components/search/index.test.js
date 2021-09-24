/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import user from '@testing-library/user-event'
import {screen, waitFor} from '@testing-library/react'
import SearchInput from './index'
import {setupServer} from 'msw/node'
import {rest} from 'msw'
import Suggestions from './partials/suggestions'
import {noop} from '../../utils/utils'

const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
}

global.sessionStorage = sessionStorageMock

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

const server = setupServer(
    rest.post('*/oauth2/authorize', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
    ),
    rest.get('*/oauth2/authorize', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
    ),
    rest.get('*/testcallback', (req, res, ctx) => {
        return res(ctx.delay(0), ctx.status(200))
    }),
    rest.post('*/oauth2/token', (req, res, ctx) =>
        res(
            ctx.delay(0),
            ctx.json({
                customer_id: 'test',
                access_token: 'testtoken',
                refresh_token: 'testrefeshtoken',
                usid: 'testusid',
                enc_user_id: 'testEncUserId'
            })
        )
    ),
    rest.get('*/search-suggestions', (req, res, ctx) => {
        return res(
            ctx.delay(0),
            ctx.json({
                brandSuggestions: {
                    suggestedTerms: [
                        {
                            originalTerm: 'dresss'
                        }
                    ]
                },
                categorySuggestions: {
                    categories: [
                        {
                            id: 'womens-clothing-dresses',
                            name: 'Dresses',
                            parentCategoryName: 'Clothing'
                        }
                    ],
                    suggestedPhrases: [
                        {
                            exactMatch: false,
                            phrase: 'Dresses'
                        }
                    ],
                    suggestedTerms: [
                        {
                            originalTerm: 'dresss',
                            terms: [
                                {
                                    completed: false,
                                    corrected: true,
                                    exactMatch: false,
                                    value: 'dresses'
                                },
                                {
                                    completed: false,
                                    corrected: true,
                                    exactMatch: false,
                                    value: 'dress'
                                }
                            ]
                        }
                    ]
                },
                contentSuggestions: {
                    suggestedTerms: [
                        {
                            originalTerm: 'dresss'
                        }
                    ]
                },
                customSuggestions: {
                    customSuggestions: ['Dresses'],
                    suggestedPhrases: [
                        {
                            exactMatch: false,
                            phrase: 'Dresses'
                        }
                    ],
                    suggestedTerms: [
                        {
                            originalTerm: 'dresss',
                            terms: [
                                {
                                    completed: false,
                                    corrected: true,
                                    exactMatch: false,
                                    value: 'dresses'
                                },
                                {
                                    completed: false,
                                    corrected: true,
                                    exactMatch: false,
                                    value: 'dress'
                                }
                            ]
                        }
                    ]
                },
                productSuggestions: {
                    products: [
                        {
                            currency: 'USD',
                            price: 195.0,
                            productId: '42416786M',
                            productName: 'Casual To Dressy Trousers'
                        },
                        {
                            currency: 'USD',
                            price: 195.0,
                            productId: '42416786-3M',
                            productName: 'Casual To Dressy Trousers'
                        },
                        {
                            currency: 'USD',
                            price: 195.0,
                            productId: '42416786-1M',
                            productName: 'Casual To Dressy Trousers'
                        },
                        {
                            currency: 'USD',
                            price: 195.0,
                            productId: '42416786-2M',
                            productName: 'Casual To Dressy Trousers'
                        },
                        {
                            currency: 'USD',
                            price: 129.0,
                            productId: '25592581M',
                            productName: 'Floral Dress'
                        }
                    ],
                    suggestedPhrases: [
                        {
                            exactMatch: false,
                            phrase: 'dresses'
                        }
                    ],
                    suggestedTerms: [
                        {
                            originalTerm: 'dresss',
                            terms: [
                                {
                                    completed: false,
                                    corrected: true,
                                    exactMatch: false,
                                    value: 'dresses'
                                },
                                {
                                    completed: false,
                                    corrected: true,
                                    exactMatch: false,
                                    value: 'dressy'
                                }
                            ]
                        }
                    ]
                },
                searchPhrase: 'dresss'
            })
        )
    })
)

beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
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
    renderWithProviders(<SearchInput />)
    const searchInput = document.querySelector('input[type="search"]')
    await user.type(searchInput, 'Dresses{enter}')
    await waitFor(() => expect(window.location.pathname).toEqual('/en-GB/search'))
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
