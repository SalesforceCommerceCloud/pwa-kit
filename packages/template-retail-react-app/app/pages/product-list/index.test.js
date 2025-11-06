/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'

import {rest} from 'msw'
import {
    mockProductSearch,
    mockedEmptyCustomerProductList,
    mockCategories
} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {screen, waitFor} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {
    createPathWithDefaults,
    renderWithProviders
} from '@salesforce/retail-react-app/app/utils/test-utils'
import ProductList from '.'
import EmptySearchResults from '@salesforce/retail-react-app/app/pages/product-list/partials/empty-results'
import {useProductSearch, useCategory} from '@salesforce/commerce-sdk-react'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'

const MOCK_USE_QUERY_RESULT = {
    data: undefined,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isIdle: false,
    isLoading: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    status: 'success',
    refetch: jest.fn(),
    remove: jest.fn()
}

jest.setTimeout(60000)
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useProductSearch: jest.fn(),
        useCategory: jest.fn()
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-selected-store', () => ({
    useSelectedStore: jest.fn()
}))

jest.mock('@salesforce/retail-react-app/app/components/image/utils', () => ({
    ...jest.requireActual('@salesforce/retail-react-app/app/components/image/utils'),
    isServer: jest.fn().mockReturnValue(true)
}))

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
    useProductSearch.mockImplementation(() => ({
        ...MOCK_USE_QUERY_RESULT,
        data: mockProductSearch
    }))
    useCategory.mockImplementation(() => ({
        data: mockCategories.root.categories[0].categories[0]
    }))
    useSelectedStore.mockReturnValue({
        selectedStore: null,
        isLoading: false,
        error: null,
        hasSelectedStore: false
    })
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

    const helmet = Helmet.peek()
    expect(helmet.linkTags).toHaveLength(15) // 3 images with 5 specific preload links with media queries each
    expect(helmet.linkTags).toStrictEqual([
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg',
            imageSizes: '50vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=240&q=60 240w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=480&q=60 480w',
            media: '(max-width: 29.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg',
            imageSizes: '50vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=384&q=60 384w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=768&q=60 768w',
            media: '(min-width: 30em) and (max-width: 47.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=149&q=60 149w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=298&q=60 298w',
            media: '(min-width: 48em) and (max-width: 61.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=192&q=60 192w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=384&q=60 384w',
            media: '(min-width: 62em) and (max-width: 79.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=230&q=60 230w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1c5f9222/images/large/PG.10221626.JJ3WCXX.PZ.jpg?sw=460&q=60 460w',
            media: '(min-width: 80em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
            imageSizes: '50vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=240&q=60 240w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=480&q=60 480w',
            media: '(max-width: 29.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
            imageSizes: '50vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=384&q=60 384w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=768&q=60 768w',
            media: '(min-width: 30em) and (max-width: 47.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=149&q=60 149w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=298&q=60 298w',
            media: '(min-width: 48em) and (max-width: 61.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=192&q=60 192w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=384&q=60 384w',
            media: '(min-width: 62em) and (max-width: 79.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=230&q=60 230w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw22e88fa3/images/large/PG.10224484.JJ0CZXX.PZ.jpg?sw=460&q=60 460w',
            media: '(min-width: 80em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg',
            imageSizes: '50vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=240&q=60 240w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=480&q=60 480w',
            media: '(max-width: 29.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg',
            imageSizes: '50vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=384&q=60 384w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=768&q=60 768w',
            media: '(min-width: 30em) and (max-width: 47.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=149&q=60 149w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=298&q=60 298w',
            media: '(min-width: 48em) and (max-width: 61.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=192&q=60 192w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=384&q=60 384w',
            media: '(min-width: 62em) and (max-width: 79.99em)',
            rel: 'preload'
        },
        {
            as: 'image',
            fetchPriority: 'high',
            href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg',
            imageSizes: '15vw',
            imageSrcSet:
                'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=230&q=60 230w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwab413b1b/images/large/PG.10243116.JJ2DGXX.PZ.jpg?sw=460&q=60 460w',
            media: '(min-width: 80em)',
            rel: 'preload'
        }
    ])
})

test('should render sort option list page', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-product-list-sort')).toBeInTheDocument()
})

test('should render skeleton when productSearch data is undefined', async () => {
    useProductSearch.mockImplementation(() => ({
        ...MOCK_USE_QUERY_RESULT
    }))
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent isLoading />)
    expect(screen.getAllByTestId('sf-product-tile-skeleton')).toHaveLength(25)
})

test('should render skeleton on initial fetch', async () => {
    useProductSearch.mockImplementation(() => ({
        ...MOCK_USE_QUERY_RESULT,
        data: mockProductSearch,
        isRefetching: true,
        isFetched: false
    }))
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent isLoading />)
    expect(screen.getAllByTestId('sf-product-tile-skeleton')).toHaveLength(25)
})

test('should render only pricing and promotions skeleton when data is refreshing', async () => {
    useProductSearch.mockImplementation(() => ({
        ...MOCK_USE_QUERY_RESULT,
        data: mockProductSearch,
        isRefetching: true,
        isFetched: true
    }))
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent isLoading />)
    expect(screen.getAllByTestId('sf-product-tile-pricing-and-promotions-skeleton')).toHaveLength(
        25
    )
    expect(screen.queryByTestId('sf-product-tile-skeleton')).not.toBeInTheDocument()
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
    const countOfRefinements = await screen.findAllByLabelText(`Remove filter: Black`)
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

test('should filter out refinements in the disallow list', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />)

    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()

    await waitFor(() => {
        // Verify that the disallowed refinement (c_isNew) is not present
        expect(screen.queryByText('New Arrivals')).not.toBeInTheDocument()

        // Verify that allowed refinements are still present
        expect(screen.getByText('Color')).toBeInTheDocument()
        expect(screen.getByText('Size')).toBeInTheDocument()
        expect(screen.getByText('Price')).toBeInTheDocument()
    })
})
test('should display Store Inventory Filter component', async () => {
    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })

    // Wait for the page to load
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()

    // Check that the Store Inventory Filter component is present
    expect(await screen.findByTestId('sf-store-inventory-filter')).toBeInTheDocument()
})

test('should filter by inventory when inventory filter is clicked', async () => {
    const mockStoreData = {
        id: 'store-123',
        name: 'Test Store',
        inventoryId: 'inventory_m_store_store12'
    }

    useSelectedStore.mockReturnValue({
        selectedStore: mockStoreData,
        isLoading: false,
        error: null,
        hasSelectedStore: true
    })

    window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}}
    })

    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()

    await waitFor(() => {
        expect(screen.getByTestId('sf-store-inventory-filter')).toBeInTheDocument()
    })

    useProductSearch.mockClear()
    const inventoryCheckbox = await screen.findByTestId('sf-store-inventory-filter-checkbox')
    await user.click(inventoryCheckbox)

    // Verify that useProductSearch was called with the inventory filter
    await waitFor(() => {
        expect(useProductSearch).toHaveBeenCalledWith(
            expect.objectContaining({
                parameters: expect.objectContaining({
                    refine: expect.arrayContaining(['ilids=inventory_m_store_store12'])
                })
            }),
            {keepPreviousData: true}
        )
    })

    // Verify URL hasn't changed
    expect(window.location.pathname).toBe('/uk/en-GB/category/mens-clothing-jackets')
})
