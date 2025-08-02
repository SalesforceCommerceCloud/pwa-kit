/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import PageTitle from './product-list-title'
import {renderWithProviders} from '../../../utils/test-utils'

jest.mock('../../../components/breadcrumb', () => {
    // eslint-disable-next-line react/display-name
    return () => <div data-testid="breadcrumb-mock" />
})

describe('PageTitle', () => {
    const mockCategory = {
        name: 'Womens',
        parentCategoryTree: [
            {id: 'root', name: 'Root'},
            {id: 'womens', name: 'Womens'}
        ]
    }
    const mockProductSearchResult = {
        total: 100
    }

    test('renders category title, breadcrumb and product count', () => {
        renderWithProviders(
            <PageTitle
                category={mockCategory}
                productSearchResult={mockProductSearchResult}
                isLoading={false}
            />
        )
        expect(screen.getByText('Womens')).toBeInTheDocument()
        expect(screen.getByText('(100)')).toBeInTheDocument()
        expect(screen.getByTestId('breadcrumb-mock')).toBeInTheDocument()
        expect(screen.queryByText(/Search Results for/)).not.toBeInTheDocument()
    })

    test('renders search results title and product count', () => {
        renderWithProviders(
            <PageTitle
                searchQuery="dresses"
                productSearchResult={mockProductSearchResult}
                isLoading={false}
            />
        )
        expect(screen.getByText(/Search Results for/)).toBeInTheDocument()
        expect(screen.getByText('dresses')).toBeInTheDocument()
        expect(screen.getByText('(100)')).toBeInTheDocument()
        expect(screen.queryByTestId('breadcrumb-mock')).not.toBeInTheDocument()
    })

    test('does not render product count when loading', () => {
        renderWithProviders(
            <PageTitle
                category={mockCategory}
                productSearchResult={mockProductSearchResult}
                isLoading={true}
            />
        )
        expect(screen.getByText('Womens')).toBeInTheDocument()
        expect(screen.queryByText('(100)')).not.toBeInTheDocument()
    })

    test('renders empty title when no category or search query', () => {
        renderWithProviders(
            <PageTitle productSearchResult={mockProductSearchResult} isLoading={false} />
        )
        // The first heading is the title, which should be empty.
        expect(screen.getAllByRole('heading')[0]).toBeEmptyDOMElement()
        // The second heading is the product count.
        expect(screen.getByText('(100)')).toBeInTheDocument()
    })
})
