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

const ProductSearchComponent = ({q, refine}: {q: string; refine: string[]}): ReactElement => {
    const {data, isLoading, error} = useProductSearch({
        q,
        refine
    })
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && 'we got data!'}
            {error && <span>error</span>}
        </div>
    )
}

const SearchSuggestionsComponent = ({q}: {q: string}): ReactElement => {
    const {data, isLoading, error} = useSearchSuggestions({
        q
    })
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && 'we got data!'}
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
                    const refinement = ['price=(0..50)']
                    renderWithProviders(<ProductSearchComponent q={q} refine={refinement} />)
                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('we got data!'))
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    const q = 'shirt'
                    // passing malformed refinement to trigger a 400 error
                    const refinement = ['price=(0.500)']
                    renderWithProviders(<ProductSearchComponent q={q} refine={refinement} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    },
    {
        hook: 'useSearchSuggestions',
        cases: [
            {
                name: 'returns data',
                assertions: withMocks(async () => {
                    const q = 'shirt'
                    renderWithProviders(<SearchSuggestionsComponent q={q} />)
                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('we got data!'))
                })
            },
            {
                name: 'returns error',
                assertions: withMocks(async () => {
                    // passing query with 2 characters to trigger a 400 error (query must be 3-50 characters)
                    const q = 'sh'
                    renderWithProviders(<SearchSuggestionsComponent q={q} />)

                    expect(screen.getByText('Loading...')).toBeInTheDocument()
                    await waitFor(() => screen.getByText('error'))
                    expect(screen.getByText('error')).toBeInTheDocument()
                    expect(screen.queryByText('Loading...')).toBeNull()
                })
            }
        ]
    }
]

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})
