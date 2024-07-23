/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

import {rest} from 'msw'
import {
    mockProductSearch,
    mockedEmptyCustomerProductList
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {screen, waitFor} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {
    createPathWithDefaults,
    renderWithProviders
} from '@salesforce/retail-react-app/app/utils/test-utils'
import ProductList from '.'
import EmptySearchResults from '@salesforce/retail-react-app/app/pages/product-list/partials/empty-results'

jest.setTimeout(60000)
let mockProductListSearchResponse = mockProductSearch

const MockedComponent = ({isLoading}) => {
    return (
        <Switch>
            <Route
                path={[
                    createPathWithDefaults('/category/:categoryId'),
                    createPathWithDefaults('/search')
                ]}
                render={(props) => (
                    <div>
                        <ProductList {...props} isLoading={isLoading} />
                    </div>
                )}
            />
        </Switch>
    )
}

MockedComponent.propTypes = {
    isLoading: PropTypes.bool
}

const MockedEmptyPage = () => {
    return <EmptySearchResults searchQuery={'test'} category={undefined} />
}

beforeEach(() => {
    global.server.use(
        rest.get('*/product-search', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductListSearchResponse))
        }),
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedEmptyCustomerProductList))
        }),
        rest.post('*/einstein/v3/personalization/*', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductListSearchResponse))
        })
    )
})

afterEach(() => {
    mockProductListSearchResponse = mockProductSearch
    jest.resetModules()
    localStorage.clear()
})

test('should render product list page', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
    await waitFor(() => {
        expect(screen.getByText(/Classic Glen Plaid Pant/i)).toBeInTheDocument()
    })
})

test('should render sort option list page', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-product-list-sort')).toBeInTheDocument()
})

test('should render skeleton', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent isLoading />)
    expect(screen.getAllByTestId('sf-product-tile-skeleton')).toHaveLength(25)
})

test('should render empty list page', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedEmptyPage />)
    expect(await screen.findByTestId('sf-product-empty-list-page')).toBeInTheDocument()
})

test('pagination is rendered', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-pagination')).toBeInTheDocument()
})

test('should display Selected refinements as there are some in the response', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    const countOfRefinements = await screen.findAllByText('Black')
    expect(countOfRefinements).toHaveLength(2)
})

// TODO: Fix flaky/broken test
// eslint-disable-next-line jest/no-disabled-tests
test.skip('show login modal when an unauthenticated user tries to add an item to wishlist', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    const {user} = renderWithProviders(<MockedComponent />)
    expect(await screen.findAllByText('Black')).toBeInTheDocument()
    const wishlistButton = await screen.getAllByLabelText('Wishlist')
    expect(wishlistButton).toHaveLength(25)
    await user.click(wishlistButton[0])
    expect(await screen.findByText(/Email/)).toBeInTheDocument()
    expect(await screen.findByText(/Password/)).toBeInTheDocument()
})

test('clicking a filter will change url', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })
    // NOTE: Look for a better wait to wait an additional render.
    await waitFor(() => !!screen.getByText(/Beige/i))

    await user.click(screen.getByText(/Beige/i))
    await waitFor(() =>
        expect(window.location.search).toBe(
            '?limit=25&refine=c_refinementColor%3DBeige&sort=best-matches'
        )
    )
})

test('clicking a filter on mobile or desktop applies changes to both', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })
    // NOTE: Look for a better wait to wait an additional render.
    await waitFor(() => !!screen.getByText(/Beige/i))

    // Only desktop filters should be present
    // Test using two buttons since there was a bug where using only one filter would properly
    // apply changes to both desktop and mobile, but 2 or more would cause it to fail
    let beigeBtns = screen.getAllByLabelText('Add filter: Beige (6)')
    let blueBtns = screen.getAllByLabelText('Add filter: Blue (27)')
    expect(beigeBtns).toHaveLength(1)
    expect(blueBtns).toHaveLength(1)

    // click beige filter and ensure that only beige is checked
    await user.click(beigeBtns[0])
    expect(beigeBtns[0]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Add filter: Blue (27)')).toHaveAttribute('aria-checked', 'false')

    // click filter button for mobile that is hidden on desktop but present in DOM
    // this opens the filter modal on mobile
    await user.click(screen.getByText('Filter'))

    // re-query for desktop and mobile filters
    beigeBtns = screen.getAllByLabelText('Remove filter: Beige (6)')
    blueBtns = screen.getAllByLabelText('Add filter: Blue (27)')

    // both mobile and desktop filters are present in DOM
    expect(beigeBtns).toHaveLength(2)
    expect(blueBtns).toHaveLength(2)

    // ensure mobile and desktop match
    expect(beigeBtns[0]).toHaveAttribute('aria-checked', 'true')
    expect(beigeBtns[1]).toHaveAttribute('aria-checked', 'true')
    expect(blueBtns[0]).toHaveAttribute('aria-checked', 'false')
    expect(blueBtns[1]).toHaveAttribute('aria-checked', 'false')

    // click mobile filter for blue
    await user.click(blueBtns[1])

    // buttons for beige and blue should be checked on both desktop and mobile
    expect(beigeBtns[0]).toHaveAttribute('aria-checked', 'true')
    expect(beigeBtns[1]).toHaveAttribute('aria-checked', 'true')
    expect(blueBtns[0]).toHaveAttribute('aria-checked', 'true')
    expect(blueBtns[1]).toHaveAttribute('aria-checked', 'true')

    // uncheck beige
    await user.click(beigeBtns[1])

    // beige button should be unchecked for both mobile and desktop
    expect(beigeBtns[0]).toHaveAttribute('aria-checked', 'false')
    expect(beigeBtns[1]).toHaveAttribute('aria-checked', 'false')
    expect(blueBtns[0]).toHaveAttribute('aria-checked', 'true')
    expect(blueBtns[1]).toHaveAttribute('aria-checked', 'true')
})

test('click on Clear All should clear out all the filter in search params', async () => {
    window.history.pushState(
        {},
        'ProductList',
        '/uk/en-GB/category/mens-clothing-jackets?limit=25&refine=c_refinementColor%3DBeige&sort=best-matches'
    )
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })
    const clearAllButton = await screen.findAllByText(/Clear All/i)
    await user.click(clearAllButton[0])
    await waitFor(() => expect(window.location.search).toBe('?limit=25&offset=0&sort=best-matches'))
})

test('should display Search Results for when searching', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/search?q=test')
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
})

test('clicking a filter on search result will change url', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/search?q=dress')
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })

    // NOTE: Look for a better wait to wait an additional render.
    await waitFor(() => !!screen.getByText(/Beige/i))

    await user.click(screen.getByText(/Beige/i))

    await waitFor(() =>
        expect(window.location.search).toBe(
            '?limit=25&q=dress&refine=c_refinementColor%3DBeige&sort=best-matches'
        )
    )
})
