/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import PropTypes from 'prop-types'

import {rest} from 'msw'
import {
    mockProductSearch,
    mockCategories,
    mockedEmptyCustomerProductList
} from '../../commerce-api/mock-data'
import {screen, waitFor} from '@testing-library/react'
import user from '@testing-library/user-event'
import {Route, Switch} from 'react-router-dom'
import {renderWithProviders, setupMockServer} from '../../utils/test-utils'
import ProductList from '.'
import EmptySearchResults from './partials/empty-results'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useWishlist from '../../hooks/use-wishlist'
import {getUrlConfig} from '../../utils/utils'

jest.setTimeout(60000)
let mockCategoriesResponse = mockCategories
let mockProductListSearchResponse = mockProductSearch
jest.useFakeTimers()

jest.mock('../../hooks/use-wishlist')
jest.mock('../../utils/utils', () => {
    const original = jest.requireActual('../../utils/utils')
    return {
        ...original,
        getUrlConfig: jest.fn()
    }
})
jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperProducts: class ShopperProductsMock extends sdk.ShopperProducts {
            async productSearch() {
                return {data: [mockProductListSearchResponse]}
            }
            async getCategory() {
                return mockCategoriesResponse
            }
        },
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async getCustomerProductLists() {
                return mockedEmptyCustomerProductList
            }
        }
    }
})

const MockedComponent = ({isLoading, isLoggedIn = false, searchQuery}) => {
    const customer = useCustomer()
    useEffect(() => {
        if (isLoggedIn) {
            customer.login('test@test.com', 'password')
        }
    }, [])
    return (
        <Switch>
            <Route
                path="/:locale/category/:categoryId"
                render={(props) => (
                    <div>
                        <div>{customer.customerId}</div>
                        <ProductList
                            {...props}
                            isLoading={isLoading}
                            searchQuery={searchQuery}
                            productSearchResult={mockProductListSearchResponse}
                        />
                    </div>
                )}
            />
        </Switch>
    )
}

MockedComponent.propTypes = {
    isLoading: PropTypes.bool,
    isLoggedIn: PropTypes.bool,
    searchQuery: PropTypes.string
}

const MockedEmptyPage = () => {
    return <EmptySearchResults searchQuery={'test'} category={undefined} />
}

// Set up the msw server to intercept fetch requests and returned mocked results. Additional
// interceptors can be defined in each test for specific requests.
const server = setupMockServer(
    rest.get('*/product-search', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockProductListSearchResponse))
    ),
    rest.post('*/einstein/v3/personalization/*', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockProductListSearchResponse))
    )
)

// Set up and clean up
beforeAll(() => {
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductList', 'en/category/mens-clothing-jackets')
})

beforeEach(() => {
    getUrlConfig.mockImplementation(() => ({
        locale: 'path'
    }))
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
    useWishlist.mockReturnValue({
        isInitialized: true,
        isEmpty: false,
        data: {},
        findItemByProductId: () => {}
    })
})

afterEach(() => {
    mockProductListSearchResponse = mockProductSearch
    jest.resetModules()
    localStorage.clear()
})
afterAll(() => server.close())

test('should render product list page', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
})

test('should render sort option list page', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-product-list-sort')).toBeInTheDocument()
})

test('should render skeleton', async () => {
    renderWithProviders(<MockedComponent isLoading />)
    expect(screen.getAllByTestId('sf-product-tile-skeleton').length).toEqual(25)
})

test('should render empty list page', async () => {
    renderWithProviders(<MockedEmptyPage />)
    expect(await screen.findByTestId('sf-product-empty-list-page')).toBeInTheDocument()
})

test('should display Search Results for when searching ', async () => {
    renderWithProviders(<MockedComponent />)
    window.history.pushState({}, 'ProductList', 'en-GB/search?q=test')
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
})

test('pagination is rendered', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-pagination')).toBeInTheDocument()
})

test('should display Selected refinements as there are some in the response', async () => {
    renderWithProviders(<MockedComponent />)
    const countOfRefinements = await screen.findAllByText('Black')
    expect(countOfRefinements.length).toEqual(2)
})

test('show login modal when an unauthenticated user tries to add an item to wishlist', async () => {
    renderWithProviders(<MockedComponent />)
    const wishlistButton = screen.getAllByLabelText('Wishlist')
    expect(wishlistButton.length).toBe(25)
    user.click(wishlistButton[0])
    expect(await screen.findByText(/Email/)).toBeInTheDocument()
    expect(await screen.findByText(/Password/)).toBeInTheDocument()
})

test('clicking a filter will change url', async () => {
    renderWithProviders(<MockedComponent />)
    user.click(screen.getByText(/Beige/i))
    await waitFor(() =>
        expect(window.location.search).toEqual(
            '?limit=25&q=test&refine=c_refinementColor%3DBeige&sort=best-matches'
        )
    )
})

test('clicking a filter will change url', async () => {
    renderWithProviders(<MockedComponent />)
    const clearAllButton = screen.queryAllByText(/Clear All/i)
    user.click(clearAllButton[0])
    await waitFor(() => expect(window.location.search).toEqual(''))
})
