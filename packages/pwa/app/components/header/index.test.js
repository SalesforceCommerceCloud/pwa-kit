import React, {useEffect} from 'react'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import Header from './index'
import {renderWithProviders} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {setupServer} from 'msw/node'
import {rest} from 'msw'
import {mockedCustomerProductLists, mockedRegisteredCustomer} from '../../commerce-api/mock-data'
import {Route, Switch} from 'react-router-dom'
import Account from '../../pages/account'

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

const MockedComponent = () => {
    const customer = useCustomer()

    useEffect(() => {
        if (customer?.authType !== 'registered') {
            customer.login('customer@test.com', 'password1')
        }
    }, [])

    return (
        <Switch>
            <Header />
            <Route path="/en/account" render={(props) => <Account {...props} />} />
        </Switch>
    )
}

const server = setupServer(
    rest.post('*/customers/actions/login', (req, res, ctx) =>
        res(ctx.set('authorization', `Bearer guesttoken`), ctx.json(mockedRegisteredCustomer))
    ),
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

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('renders Header', () => {
    renderWithProviders(<Header />)
    const menu = document.querySelector('button[aria-label="Menu"]')
    const logo = document.querySelector('button[aria-label="Logo"]')
    const account = document.querySelector('svg[aria-label="My account"]')
    const cart = document.querySelector('button[aria-label="My cart"]')
    const wishlist = document.querySelector('button[aria-label="Wishlist"]')
    const searchInput = document.querySelector('input[type="search"]')
    expect(menu).toBeInTheDocument()
    expect(logo).toBeInTheDocument()
    expect(account).toBeInTheDocument()
    expect(cart).toBeInTheDocument()
    expect(wishlist).toBeInTheDocument()
    expect(searchInput).toBeInTheDocument()
})

test('renders Header with event handlers', () => {
    const onMenuClick = jest.fn()
    const onLogoClick = jest.fn()
    const onMyAccountClick = jest.fn()
    const onMyCartClick = jest.fn()
    const onSearchChange = jest.fn()
    const onSearchSubmit = jest.fn()
    renderWithProviders(
        <Header
            onMenuClick={onMenuClick}
            onLogoClick={onLogoClick}
            onMyAccountClick={onMyAccountClick}
            onMyCartClick={onMyCartClick}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
        />
    )
    const menu = document.querySelector('button[aria-label="Menu"]')
    const logo = document.querySelector('button[aria-label="Logo"]')
    const account = document.querySelector('svg[aria-label="My account"]')
    const cart = document.querySelector('button[aria-label="My cart"]')
    const searchInput = document.querySelector('input[type="search"]')
    const form = document.querySelector('form')

    fireEvent.click(menu)
    expect(onMenuClick).toHaveBeenCalledTimes(1)
    fireEvent.click(logo)
    expect(onLogoClick).toHaveBeenCalledTimes(1)
    fireEvent.click(account)
    expect(onMyAccountClick).toHaveBeenCalledTimes(1)
    fireEvent.click(cart)
    expect(onMyCartClick).toHaveBeenCalledTimes(1)
    fireEvent.change(searchInput, {target: {value: '123'}})
    expect(searchInput.value).toBe('123')
    expect(onSearchChange).toHaveBeenCalledTimes(1)
    fireEvent.submit(form)
    expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    expect(onSearchSubmit).toHaveBeenCalledWith(expect.anything(), '123')
})

/**
 * The badge component on the cart that shows the number of items in the cart
 * should only be displayed when there is a valid cart loaded.
 */
const testBaskets = [null, undefined, {basketId: null}, {basketId: undefined}]

test.each(testBaskets)('does not render cart badge when basket not loaded', (initialBasket) => {
    renderWithProviders(<Header />, {wrapperProps: {initialBasket}})

    // Look for badge.
    const badge = document.querySelector('button[aria-label="My cart"] .chakra-badge')

    expect(badge).toBeNull()
})

test('renders cart badge when basket is loaded', () => {
    const initialBasket = {basketId: 'valid_id'}

    renderWithProviders(<Header />, {wrapperProps: {initialBasket}})

    // Look for badge.
    const badge = document.querySelector('button[aria-label="My cart"] .chakra-badge')

    expect(badge).toBeInTheDocument()
})

test('direct users to account page when an authenticated users click on account icon', async () => {
    server.use(
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
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
        ),
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(
                ctx.json({
                    ...mockedRegisteredCustomer,
                    firstName: 'Geordi'
                })
            )
        )
    )
    renderWithProviders(<MockedComponent />)
    // Look for account icon
    const account = document.querySelector('svg[aria-label="My account"]')

    fireEvent.click(account)

    await waitFor(() => {
        expect(screen.getByText('My Account')).toBeInTheDocument()
    })
})

test('shows dropdown menu when an authenticated users hover on the account icon', async () => {
    server.use(
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
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
        ),
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(
                ctx.json({
                    ...mockedRegisteredCustomer,
                    firstName: 'Geordi'
                })
            )
        ),
        // mock fetch product lists
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        })
    )
    renderWithProviders(<MockedComponent />)
    // Look for account icon
    const account = document.querySelector('svg[aria-label="My account"]')

    fireEvent.mouseOver(account)

    await waitFor(() => {
        expect(screen.getByText('My Account')).toBeInTheDocument()
    })
})
