/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import React, {useEffect} from 'react'
import AccountWishlist from '.'
import useCustomer from '../../../commerce-api/hooks/useCustomer'
import {
    mockedCustomerProductListsDetails,
    mockedRegisteredCustomer
} from '../../../commerce-api/mock-data'
import {renderWithProviders} from '../../../utils/test-utils'
import {screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {mockedCustomerProductLists} from '../../../commerce-api/mock-data'

let mockedWishlist = mockedCustomerProductLists
const testProductId = 'apple-ipod-nano-green-16gM'
const productDetail = {
    [testProductId]: mockedCustomerProductListsDetails.data[0]
}
mockedWishlist.data[0]._productItemsDetail = productDetail
const wishlistItemId = mockedWishlist.data[0].customerProductListItems.find(
    (e) => e.productId === testProductId
).id

jest.setTimeout(60000)

jest.mock('../../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

jest.mock('../../../commerce-api/hooks/useCustomerProductLists', () => {
    const originalModule = jest.requireActual('../../../commerce-api/hooks/useCustomerProductLists')
    const useCustomerProductLists = originalModule.default
    return () => {
        const customerProductLists = useCustomerProductLists()

        return {
            ...customerProductLists,
            ...mockedWishlist,
            loaded: jest.fn().mockReturnValue(true),
            getProductsInList: jest.fn(),
            fetchOrCreateProductLists: jest.fn(),
            getProductListPerType: jest.fn().mockReturnValue(mockedWishlist.data[0])
        }
    }
})

const MockedComponent = () => {
    const customer = useCustomer()
    useEffect(() => {
        customer.login('test@test.com', 'password')
    }, [])

    return (
        <div>
            <div>{customer.customerId}</div>
            <AccountWishlist />
        </div>
    )
}

const server = setupServer(
    rest.post('*/customers/actions/login', (req, res, ctx) =>
        res(
            ctx.delay(0),
            ctx.set('authorization', `Bearer fakeToken`),
            ctx.json(mockedRegisteredCustomer)
        )
    ),
    rest.get('*/customers/:customerId', (req, res, ctx) =>
        res(ctx.delay(0), ctx.json(mockedRegisteredCustomer))
    ),
    rest.post('*/oauth2/authorize', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
    ),

    rest.get('*/oauth2/authorize', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
    ),

    rest.post('*/oauth2/login', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
    ),

    rest.get('*/testcallback', (req, res, ctx) => {
        return res(ctx.delay(0), ctx.status(200))
    }),

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
beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})

    // Need to mock TextEncoder for tests
    if (typeof TextEncoder === 'undefined') {
        global.TextEncoder = require('util').TextEncoder
    }
})

afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('Renders wishlist page for registered customers', () => {
    renderWithProviders(<MockedComponent />)
    expect(screen.getByTestId('account-wishlist-page')).toBeInTheDocument()
})

test('renders product item name, attributes and price', async () => {
    renderWithProviders(<MockedComponent />)

    await waitFor(() => {
        expect(screen.getByText(/apple ipod nano/i)).toBeInTheDocument()
        expect(screen.getByText(/color: green/i)).toBeInTheDocument()
        expect(screen.getByText(/memory size: 16 GB/i)).toBeInTheDocument()
        expect(screen.getByText(/199/i)).toBeInTheDocument()
    })
})

test('Can remove item from the wishlist', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-wishlist-page')).toBeInTheDocument()
    expect(screen.getByText(/apple ipod nano/i)).toBeInTheDocument()

    const wishlistRemoveButton = await screen.findByTestId(`sf-wishlist-remove-${wishlistItemId}`)
    userEvent.click(wishlistRemoveButton)
    mockedWishlist.data[0].customerProductListItems = []
    userEvent.click(screen.getByRole('button', {name: /yes, remove item/i}))

    expect(await screen.getByText(/no wishlist items/i)).toBeInTheDocument()
})

test('renders no wishlist items for empty wishlist', () => {
    mockedWishlist.data[0].customerProductListItems = []
    renderWithProviders(<MockedComponent />)

    expect(screen.getByText(/no wishlist items/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /continue shopping/i})).toBeInTheDocument()
})

test('renders skeleton when product list is loading', () => {
    mockedWishlist.data[0] = undefined
    renderWithProviders(<MockedComponent />)
    expect(screen.getByTestId('sf-wishlist-skeleton')).toBeInTheDocument()
})
