/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {act, screen, waitFor} from '@testing-library/react'
import ProductListHeader from './product-list-header'
import {useHistory} from 'react-router-dom'
import {renderWithProviders} from '../../../utils/test-utils'

// Mock child components to isolate the component under test
jest.mock('../partials/refinements', () =>
    // eslint-disable-next-line react/display-name
    () => <div data-testid="refinements-mock" />
)
jest.mock(
    '../partials/category-links',
    // eslint-disable-next-line react/display-name
    () => () => <div data-testid="category-links-mock" />
)
jest.mock(
    '../partials/selected-refinements',
    // eslint-disable-next-line react/display-name
    () => () => <div data-testid="selected-refinements-mock" />
)
jest.mock(
    './product-list-title',
    // eslint-disable-next-line react/display-name
    () => () => <div data-testid="page-title-mock" />
)
// eslint-disable-next-line react/display-name
jest.mock('../partials/sort', () => () => <div data-testid="sort-mock" />)

// Mock react-router-dom's useHistory
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom')
    return {
        ...actual,
        useHistory: jest.fn()
    }
})

// Default props for the component
const defaultProps = {
    searchQuery: 'shirts',
    category: {
        id: 'mens-clothing-shirts',
        name: 'Shirts',
        categories: [{id: 'mens-clothing-shirts-t-shirts', name: 'T-Shirts'}]
    },
    productSearchResult: {
        total: 100,
        sortingOptions: [
            {id: 'best-matches', label: 'Best Matches'},
            {id: 'price-high-to-low', label: 'Price High to Low'},
            {id: 'price-low-to-high', label: 'Price Low to High'}
        ],
        selectedSortingOption: 'best-matches',
        refinements: [
            {
                attributeId: 'color',
                label: 'Color',
                values: [
                    {label: 'Blue', value: 'blue', hitCount: 10},
                    {label: 'Red', value: 'red', hitCount: 5}
                ]
            }
        ],
        selectedRefinements: {
            color: 'blue'
        }
    },
    isLoading: false,
    filtersLoading: false,
    toggleFilter: jest.fn(),
    resetFilters: jest.fn(),
    sortUrls: ['/sort/best-matches', '/sort/price-high-to-low', '/sort/price-low-to-high'],
    basePath: '/category/mens-clothing-shirts',
    searchParams: {refine: {color: 'blue'}}
}

const history = {push: jest.fn()}

describe('ProductListHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useHistory.mockReturnValue(history)
    })

    test('renders desktop view by default in tests', () => {
        renderWithProviders(<ProductListHeader {...defaultProps} />)
        // Check for desktop components
        expect(screen.getAllByTestId('page-title-mock')).toHaveLength(2)
        expect(screen.getAllByTestId('selected-refinements-mock')).toHaveLength(2)
        expect(screen.getByTestId('sort-mock')).toBeInTheDocument()

        // Check for mobile components
        expect(screen.getByText(/Filter/i)).toBeInTheDocument()
        expect(screen.getByText(/Sort By/i)).toBeInTheDocument()
    })

    test('mobile filter button opens and closes filter modal', async () => {
        const {user} = renderWithProviders(<ProductListHeader {...defaultProps} />)

        const filterButton = screen.getByText(/Filter/i)
        expect(filterButton).toBeInTheDocument()

        // Modal content is not visible initially
        expect(screen.queryByText(/View 100 Items/i)).not.toBeInTheDocument()

        await act(async () => {
            await user.click(filterButton)
        })
        // Modal content is now visible
        expect(screen.getByText(/View 100 Items/i)).toBeInTheDocument()
        expect(screen.getByText(/Clear Filters/i)).toBeInTheDocument()
        expect(screen.getByTestId('refinements-mock')).toBeInTheDocument()

        // Click to close modal
        const viewItemsButton = screen.getByText(/View 100 Items/i)
        await act(async () => {
            await user.click(viewItemsButton)
        })

        // Modal content is gone
        await waitFor(() => {
            expect(screen.queryByText(/View 100 Items/i)).not.toBeInTheDocument()
        })
    })

    test('reset filter button in modal calls resetFilters', async () => {
        const resetFilters = jest.fn()
        const {user} = renderWithProviders(
            <ProductListHeader {...defaultProps} resetFilters={resetFilters} />
        )

        const filterButton = screen.getByText(/Filter/i)
        await act(async () => {
            await user.click(filterButton)
        })

        const clearButton = screen.getByText(/Clear Filters/i)
        await act(async () => {
            await user.click(clearButton)
        })

        expect(resetFilters).toHaveBeenCalled()
    })

    test('mobile sort button opens sort drawer and allows sorting', async () => {
        const {user} = renderWithProviders(<ProductListHeader {...defaultProps} />)

        const sortButton = screen.getByText(/Sort By: Best Matches/i)
        expect(sortButton).toBeInTheDocument()

        // Drawer not visible initially
        expect(screen.queryByText('Price High to Low')).not.toBeInTheDocument()

        await act(async () => {
            await user.click(sortButton)
        })
        // Drawer is now visible with sort options
        expect(screen.getByText('Best Matches')).toBeInTheDocument()
        expect(screen.getByText('Price High to Low')).toBeInTheDocument()
        expect(screen.getByText('Price Low to High')).toBeInTheDocument()

        // Click a sort option
        const highToLow = screen.getByText('Price High to Low')
        await act(async () => {
            await user.click(highToLow)
        })

        // History is updated with new sort URL
        expect(history.push).toHaveBeenCalledWith('/sort/price-high-to-low')
    })

    test('displays loading spinner when filters are loading in modal', async () => {
        const {user} = renderWithProviders(
            <ProductListHeader {...defaultProps} filtersLoading={true} />
        )

        const filterButton = screen.getByText(/Filter/i)
        await act(async () => {
            await user.click(filterButton)
        })

        expect(await screen.findByTestId('loading')).toBeInTheDocument()
    })
})
