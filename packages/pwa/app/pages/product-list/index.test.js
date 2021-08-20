/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React, {useEffect} from 'react'
import PropTypes from 'prop-types'

import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {
    mockedRegisteredCustomer,
    mockProductSearch,
    mockCategories,
    mockedEmptyCustomerProductList
} from '../../commerce-api/mock-data'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {renderWithProviders} from '../../utils/test-utils'
import ProductList from '.'
import EmptySearchResults from './partials/empty-results'
import useCustomer from '../../commerce-api/hooks/useCustomer'

jest.setTimeout(60000)
let mockCategoriesResponse = mockCategories
let mockProductListSearchResponse = mockProductSearch
jest.useFakeTimers()

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
    isLoading: PropTypes.bool
}

const MockedEmptyPage = () => {
    return <EmptySearchResults searchQuery={'test'} category={undefined} />
}

// Set up the msw server to intercept fetch requests and returned mocked results. Additional
// interceptors can be defined in each test for specific requests.
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
    rest.post('*/oauth2/login', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
    ),
    rest.get('*/customers/:customerId', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
    ),
    rest.get('*/product-search', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockProductListSearchResponse))
    ),
    // rest.get('*/product-search', (req, res, ctx) =>
    //     res(ctx.delay(0), ctx.status(200), ctx.json(mockedProductSearchList))
    // ),
    rest.post('*/einstein/v3/personalization/*', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockProductListSearchResponse))
    ),
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
    )
)

// Set up and clean up
beforeAll(() => {
    // Need to mock TextEncoder for tests
    if (typeof TextEncoder === 'undefined') {
        global.TextEncoder = require('util').TextEncoder
    }

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'ProductList', 'en/category/mens-clothing-jackets')
})

beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
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
    const countOfSortComponents = await screen.findAllByText('Sort by')
    expect(countOfSortComponents.length).toEqual(2)
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
    window.history.pushState({}, 'ProductList', 'en/search?q=test')
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
})

test('product tile is rendered', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByText(/Navy Single Pleat Wool Suit/)).toBeInTheDocument()
    expect(await screen.findByText(/Charcoal Single Pleat Wool Suit/)).toBeInTheDocument()
})

test('pagination is rendered', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-pagination')).toBeInTheDocument()
})

test('show login modal when an unauthenticated user tries to add an item to wishlist', async () => {
    renderWithProviders(<MockedComponent />)
    const wishlistButton = screen.getAllByLabelText('wishlist')
    expect(wishlistButton.length).toBe(2)
    fireEvent.click(wishlistButton[0])
    expect(await screen.findByText(/Email/)).toBeInTheDocument()
    expect(await screen.findByText(/Password/)).toBeInTheDocument()
})
