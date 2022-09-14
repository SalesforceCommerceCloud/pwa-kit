/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import path from 'path'
import '@testing-library/jest-dom'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {useProductSearch, useSearchSuggestions} from './query'
import {screen, waitFor} from '@testing-library/react'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const ProductSearchComponent = ({
    q,
    currency,
    locale,
    refine,
}: {
    q: string
    currency: string
    locale: string
    refine: string[]
}): ReactElement => {
    const {data, isLoading, error} = useProductSearch({
        q,
        currency,
        locale,
        refine,
    })
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && (
                <div>
                    {data.data?.map(({name}: {name: string}) => (
                        <div key={name}>{name}</div>
                    ))}
                </div>
            )}
            {error && <span>error</span>}
        </div>
    )
}

const SearchSuggestionsComponent = ({
    q,
    currency,
    locale,
}: {
    q: string
    currency: string
    locale: string
}): ReactElement => {
    const {data, isLoading, error} = useSearchSuggestions({
        q,
        currency,
        locale,
    })
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && (
                <div>
                    {data.productSuggestions?.products?.map(({name}) => (
                        <div key={name}>{name}</div>
                    ))}
                </div>
            )}
            {error && <span>error</span>}
        </div>
    )
}

const tests = [
    {
        hook: 'useProductSearch',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    const q = 'shirt'
                    const currency = 'USD'
                    const locale = 'en-US'
                    const refinement = ['price=(0..50)']
                    renderWithProviders(
                        <ProductSearchComponent
                            q={q}
                            currency={currency}
                            locale={locale}
                            refine={refinement}
                        />
                    )
                    const productNames = ['Striped Shirt', 'Paisley Shirt', 'Denim Shirt Jacket']

                    expect(screen.queryByText(productNames[0])).toBeNull()
                    expect(screen.queryByText(productNames[1])).toBeNull()
                    expect(screen.queryByText(productNames[2])).toBeNull()
                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(productNames[0]))
                    expect(screen.getByText(productNames[0])).toBeInTheDocument()
                    expect(screen.getByText(productNames[1])).toBeInTheDocument()
                    expect(screen.getByText(productNames[2])).toBeInTheDocument()
                }),
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    const q = 'shirt'
                    const currency = 'USD'
                    const locale = 'en-US'
                    // passing malformed refinement to trigger a 400 error
                    const refinement = ['price=(0.500)']
                    renderWithProviders(
                        <ProductSearchComponent
                            q={q}
                            currency={currency}
                            locale={locale}
                            refine={refinement}
                        />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                }),
            },
        ],
    },
    {
        hook: 'useSearchSuggestions',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    const q = 'shirt'
                    const currency = 'USD'
                    const locale = 'en-US'
                    renderWithProviders(
                        <SearchSuggestionsComponent
                            q={q}
                            currency={currency}
                            locale={locale}
                        />
                    )
                    const productNames = ['Striped Shirt', 'Paisley Shirt', 'Denim Shirt Jacket']

                    expect(screen.queryByText(productNames[0])).toBeNull()
                    expect(screen.queryByText(productNames[1])).toBeNull()
                    expect(screen.queryByText(productNames[2])).toBeNull()
                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText(productNames[0]))
                    expect(screen.getByText(productNames[0])).toBeInTheDocument()
                    expect(screen.getByText(productNames[1])).toBeInTheDocument()
                    expect(screen.getByText(productNames[2])).toBeInTheDocument()
                }),
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    // passing query with 2 characters to trigger a 400 error (query must be 3-50 characters)
                    const q = 'sh'
                    const currency = 'USD'
                    const locale = 'en-US'
                    renderWithProviders(
                        <SearchSuggestionsComponent
                            q={q}
                            currency={currency}
                            locale={locale}
                        />
                    )

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                }),
            },
        ],
    },
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
