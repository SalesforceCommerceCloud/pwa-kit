import {rest} from 'msw'
import {setupServer} from 'msw/node'
import React, {useEffect} from 'react'
import AccountWishlist from '.'
import useCustomer from '../../../commerce-api/hooks/useCustomer'
import {mockedRegisteredCustomer} from '../../../commerce-api/mock-data'
import {renderWithProviders} from '../../../utils/test-utils'
import {screen} from '@testing-library/react'

let mockCustomer = {}

jest.setTimeout(60000)

jest.mock('../../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
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
        res(ctx.delay(0), ctx.set('authorization', `Bearer fakeToken`), ctx.json(mockCustomer))
    ),
    rest.get('*/customers/:customerId', (req, res, ctx) =>
        res(ctx.delay(0), ctx.json(mockCustomer))
    ),
    rest.get('*/customers/:customerId/product-lists', (req, res, ctx) =>
        res(ctx.delay(0), ctx.json({total: 0, limit: 0}))
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
                usid: 'testusid'
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

test('shows appropriate message for empty wishlist', async () => {
    renderWithProviders(<MockedComponent />)
    expect(screen.getByTestId('account-wishlist-page')).toBeInTheDocument()
    expect(screen.getByText(/no wishlist items/i)).toBeInTheDocument()
    expect(
        screen.getByRole('button', {
            name: /continue shopping/i
        })
    ).toBeInTheDocument()
})
