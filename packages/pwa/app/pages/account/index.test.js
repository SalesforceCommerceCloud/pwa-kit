import React, {useEffect} from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {renderWithProviders} from '../../utils/test-utils'
import {
    mockedRegisteredCustomer,
    mockOrderHistory,
    mockOrderProducts
} from '../../commerce-api/mock-data'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Account from './index'

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
            customer.login()
        }
    }, [])

    return (
        <Switch>
            <Route path="/en/account" render={(props) => <Account {...props} />} />
        </Switch>
    )
}

const server = setupServer(
    rest.post('*/customers/actions/login', (req, res, ctx) =>
        res(ctx.set('authorization', `Bearer guesttoken`), ctx.json(mockedRegisteredCustomer))
    ),
    rest.get('*/customers/:customerId/orders', (req, res, ctx) =>
        res(ctx.delay(0), ctx.json(mockOrderHistory))
    ),
    rest.get('*/products', (req, res, ctx) => res(ctx.delay(0), ctx.json(mockOrderProducts)))
)

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('Redirects to login page if the customer is not logged in', async () => {
    server.use(
        rest.post('*/customers/actions/login', (req, res, ctx) =>
            res(ctx.set('authorization', `Bearer guesttoken`), ctx.json({authType: 'guest'}))
        )
    )
    renderWithProviders(<MockedComponent />)
    await waitFor(() => expect(window.location.pathname).toEqual('/en/login'))
})

test('Provides navigation for subpages', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()

    const nav = within(screen.getByTestId('account-detail-nav'))
    user.click(nav.getByText('Addresses'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en/account/addresses'))
    user.click(nav.getByText('Order History'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en/account/orders'))
    user.click(nav.getByText('Payment Methods'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en/account/payments'))
})

test('Renders account detail page by default for logged-in customer', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()
    expect(screen.getByText('Testing Tester')).toBeInTheDocument()
    expect(screen.getByText('customer@test.com')).toBeInTheDocument()
    expect(screen.getByText('(727) 555-1234')).toBeInTheDocument()
})

test('Allows customer to edit profile details', async () => {
    server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(
                ctx.json({
                    ...mockedRegisteredCustomer,
                    firstName: 'Geordi'
                })
            )
        ),
        rest.patch('*/customers/:customerId', (req, res, ctx) =>
            res(
                ctx.json({
                    ...mockedRegisteredCustomer,
                    firstName: 'Geordi'
                })
            )
        )
    )

    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()

    const el = within(screen.getByTestId('sf-toggle-card-my-profile'))
    user.click(el.getByText(/edit/i))
    user.type(el.getByLabelText(/first name/i), 'Geordi')
    user.click(el.getByText(/save/i))
    expect(await screen.findByText('Geordi Tester')).toBeInTheDocument()
})

test('Allows customer to update password', async () => {
    server.use(rest.put('*/password', (req, res, ctx) => res(ctx.json())))

    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()

    const el = within(screen.getByTestId('sf-toggle-card-password'))
    user.click(el.getByText(/edit/i))
    user.type(el.getByLabelText(/current password/i), 'Password!12345')
    user.type(el.getByLabelText(/new password/i), 'Password!98765')
    user.click(el.getByText(/save/i))
    expect(await screen.findByText('••••••••')).toBeInTheDocument()
})
