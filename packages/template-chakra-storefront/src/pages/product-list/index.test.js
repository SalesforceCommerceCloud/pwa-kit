/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

import {
    mockProductSearch,
    mockedEmptyCustomerProductList,
    mockedCustomerProductLists
} from '../../../mocks/mock-data'
import {act, screen, waitFor} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {createPathWithDefaults, renderWithProviders} from '../../utils/test-utils'
import {prependHandlersToServer} from '../../../jest-setup'
import ProductList from '.'
import EmptySearchResults from '../../pages/product-list/partials/empty-results'
import {useCustomerType} from '@salesforce/commerce-sdk-react'

jest.setTimeout(60000)
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useCustomerType: jest.fn()
    }
})

jest.mock('../../hooks/use-datacloud', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        sendViewPage: jest.fn(),
        sendViewProduct: jest.fn(),
        sendViewCategory: jest.fn(),
        sendViewSearchResults: jest.fn(),
        sendViewRecommendations: jest.fn()
    }))
}))
let mockProductListSearchResponse = mockProductSearch

const MockedComponent = () => {
    return (
        <Switch>
            <Route
                path={[
                    createPathWithDefaults('/category/:categoryId'),
                    createPathWithDefaults('/search')
                ]}
                render={(props) => (
                    <div>
                        <ProductList {...props} />
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
    prependHandlersToServer([
        {
            path: '*/product-search',
            method: 'get',
            status: 200,
            delay: 0,
            res: () => mockProductListSearchResponse
        },
        {
            path: '*/customers/:customerId/product-lists',
            method: 'get',
            status: 200,
            delay: 0,
            res: () => mockedEmptyCustomerProductList
        },
        {
            path: '*/einstein/v3/personalization/*',
            method: 'post',
            status: 200,
            delay: 0,
            res: () => mockProductListSearchResponse
        }
    ])
})

afterEach(() => {
    jest.resetModules()
    localStorage.clear()
})

describe('Product List renders properly', () => {
    beforeEach(() => {
        useCustomerType.mockReturnValue({
            isRegistered: true,
            isGuest: false,
            customerType: 'isRegistered'
        })
    })
    test('should render product list page', async () => {
        window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
        renderWithProviders(<MockedComponent />)
        expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
        await waitFor(() => {
            expect(screen.getByText(/Classic Glen Plaid Pant/i)).toBeInTheDocument()
        })
    })
    test('should render skeleton on initial fetch', async () => {
        // Add delay to API to test skeleton loading state
        prependHandlersToServer([
            {
                path: '*/product-search',
                method: 'get',
                status: 200,
                delay: 1000, // 1 second delay to simulate loading
                res: () => mockProductListSearchResponse
            }
        ])
        window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
        renderWithProviders(<MockedComponent />)
        await waitFor(() => {
            expect(screen.getAllByTestId('sf-product-tile-skeleton')).toHaveLength(25)
        })
    })
    test('should render sort option list page', async () => {
        window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
        renderWithProviders(<MockedComponent />)
        expect(await screen.findByTestId('sf-product-list-sort')).toBeInTheDocument()
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

    test('should display Search Results for when searching', async () => {
        window.history.pushState({}, 'ProductList', '/uk/en-GB/search?q=test')
        renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
        })
        expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
    })

    test('should display Selected refinements as there are some in the response', async () => {
        window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
        renderWithProviders(<MockedComponent />)
        const countOfRefinements = await screen.findAllByLabelText(`Remove filter: Black`)
        expect(countOfRefinements).toHaveLength(2)
    })
})

//@sfdc-extension-block-start SFDC_EXT_WISHLIST
test('show login modal when an unauthenticated user tries to add an item to wishlist', async () => {
    prependHandlersToServer([
        {
            path: '*/customers/:customerId/product-lists',
            method: 'get',
            status: 200,
            delay: 0,
            res: () => mockedCustomerProductLists
        }
    ])
    // Mock customer as guest user
    useCustomerType.mockReturnValue({
        isRegistered: false,
        isGuest: true,
        customerType: 'guest'
    })

    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    const {user} = renderWithProviders(<MockedComponent />)

    expect(await screen.findAllByText('Black')).toHaveLength(18)

    const wishlistButton = screen.getAllByLabelText(/Wishlist/i)
    expect(wishlistButton).toHaveLength(25)
    await act(async () => {
        await user.click(wishlistButton[0])
    })

    await waitFor(() => {
        expect(screen.getByText(/email/i)).toBeInTheDocument()
        expect(screen.getByText(/^password$/i)).toBeInTheDocument()
    })
})
//@sfdc-extension-block-end SFDC_EXT_WISHLIST

test('clicking a filter will change url', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })
    // NOTE: Look for a better wait to wait an additional render.
    await waitFor(() => !!screen.getByText(/Beige/i))
    await act(async () => {
        await user.click(screen.getByText(/Beige/i))
    })
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

    await act(async () => {
        // click beige filter and ensure that only beige is checked
        await user.click(beigeBtns[0])
    })
    expect(beigeBtns[0]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Add filter: Blue (27)')).toHaveAttribute('aria-checked', 'false')

    await act(async () => {
        // click filter button for mobile that is hidden on desktop but present in DOM
        // this opens the filter modal on mobile
        await user.click(screen.getByText('Filter'))
    })

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

    await act(async () => {
        // click mobile filter for blue
        await user.click(blueBtns[1])
    })

    // buttons for beige and blue should be checked on both desktop and mobile
    expect(beigeBtns[0]).toHaveAttribute('aria-checked', 'true')
    expect(beigeBtns[1]).toHaveAttribute('aria-checked', 'true')
    expect(blueBtns[0]).toHaveAttribute('aria-checked', 'true')
    expect(blueBtns[1]).toHaveAttribute('aria-checked', 'true')

    await act(async () => {
        // uncheck beige
        await user.click(beigeBtns[1])
    })

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
    await act(async () => {
        await user.click(clearAllButton[0])
    })
    await waitFor(() => expect(window.location.search).toBe('?limit=25&offset=0&sort=best-matches'))
})

test('clicking a filter on search result will change url', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/search?q=dress')
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })

    // NOTE: Look for a better wait to wait an additional render.
    await waitFor(() => !!screen.getByText(/Beige/i))

    await act(async () => {
        await user.click(screen.getByText(/Beige/i))
    })

    await waitFor(() =>
        expect(window.location.search).toBe(
            '?limit=25&q=dress&refine=c_refinementColor%3DBeige&sort=best-matches'
        )
    )
})
