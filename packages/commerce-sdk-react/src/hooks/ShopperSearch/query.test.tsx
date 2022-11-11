/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import nock from 'nock'
import {screen, waitFor} from '@testing-library/react'
import {renderHookWithProviders} from '../../test-utils'
import {useProductSearch, useSearchSuggestions} from './query'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'}),
    }))
})

const QUERY_TESTS = [
    {
        name: 'useProductSearch',
        hook: () => useProductSearch({q: 'test'}),
        endpoint: '/product-search',
    },
    {
        name: 'useSearchSuggestions',
        hook: () => useSearchSuggestions({q: 'test'}),
        endpoint: '/search-suggestions',
    },
]

test.each(QUERY_TESTS)('%j - 200 returns data', async ({hook, endpoint}) => {
    const data = {test: true}
    nock('http://localhost:8888')
        .get((uri) => uri.includes(endpoint))
        .reply(200, data)
    // @ts-ignore
    const {result, waitForNextUpdate} = renderHookWithProviders(hook)
    expect(result.current.data).toBe(undefined)
    expect(result.current.isLoading).toBe(true)

    await waitForNextUpdate()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(data)
})

test.each(QUERY_TESTS)('%j - 400 returns error', async ({hook, endpoint}) => {
    nock('http://localhost:8888')
        .get((uri) => uri.includes(endpoint))
        .reply(400)
    // @ts-ignore
    const {result, waitForNextUpdate} = renderHookWithProviders(hook)
    expect(result.current.data).toBe(undefined)
    expect(result.current.isLoading).toBe(true)

    await waitForNextUpdate()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeTruthy()
})
