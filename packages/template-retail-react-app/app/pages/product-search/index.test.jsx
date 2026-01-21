/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
// import {rest} from 'msw'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ProductSearch from '.'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'

// Mock products data
const mockProductSearchResult = {
    hits: [
        {
            productId: 'prod123',
            productName: 'Test Product 1',
            image: {disBaseLink: '/test1.jpg'},
            price: 19.99,
            currency: 'USD'
        },
        {
            productId: 'prod456',
            productName: 'Test Product 2',
            image: {disBaseLink: '/test2.jpg'},
            price: 29.99,
            currency: 'USD'
        }
    ],
    total: 2,
    pagination: {
        urls: {}
    }
}

describe('ProductSearch', () => {
    beforeEach(() => {
        // Set up API mocks
        // you can either use global.server directly or use the prependHandlersToServer util to reduce boilderplate code for api mock
        // global.server.use(
        //     rest.get('', (req, res, ctx) => {
        //         return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductSearchResult))
        //     })
        // )
        prependHandlersToServer([
            {
                path: '*/product-search',
                res: () => mockProductSearchResult
            }
        ])
    })
    // Restore all mocks after each test
    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('should render loading state', async () => {
        // Set up API mocks
        prependHandlersToServer([
            {
                path: '*/product-search',
                // notice the delay here to give the component time to render the loading state
                delay: 1000,
                res: () => mockProductSearchResult
            }
        ])
        window.history.pushState({}, 'ProductSearch', '/uk/en-GB/product-search?q=shirt')
        renderWithProviders(<ProductSearch />)

        await waitFor(() => {
            expect(screen.getByText(/Loading/i)).toBeInTheDocument()
        })
    })

    test('should render product search page with results', async () => {
        window.history.pushState({}, 'ProductSearch', '/uk/en-GB/product-search?q=shirt')
        renderWithProviders(<ProductSearch />)

        expect(await screen.findByTestId('sf-product-search-page')).toBeInTheDocument()
        await waitFor(() => {
            expect(screen.getByText(/Search Results for/i)).toBeInTheDocument()
        })
    })
    // add more tests here
})