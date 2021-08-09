import {useEffect} from 'react'
import {Button} from '@chakra-ui/react'
import {screen, waitFor} from '@testing-library/react'
import React from 'react'
import withRegistration from './index'
import {renderWithProviders} from '../../utils/test-utils'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {mockedRegisteredCustomer, mockedGuestCustomer} from '../../commerce-api/mock-data'
import useCustomer from '../../commerce-api/hooks/useCustomer'

jest.setTimeout(60000)
jest.useFakeTimers()

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

const ButtonWithRegistration = withRegistration(Button)

const MockedComponent = (props) => {
    const customer = useCustomer()

    useEffect(() => {
        if (customer?.authType !== 'registered') {
            customer.login('customer@test.com', 'password1')
        }
    }, [])

    return (
        <div>
            <div>firstName: {customer?.firstName}</div>
            <ButtonWithRegistration {...props}>Button</ButtonWithRegistration>
        </div>
    )
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
beforeAll(() => {
    // Need to mock TextEncoder for tests
    if (typeof TextEncoder === 'undefined') {
        global.TextEncoder = require('util').TextEncoder
    }

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en/account')
})

beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
})

afterEach(() => {
    jest.resetModules()
})
afterAll(() => server.close())

test('should execute onClick for registered users', async () => {
    server.use(
        rest.post('*/customers/actions/login', (req, res, ctx) =>
            res(ctx.set('authorization', `Bearer testtoken`), ctx.json(mockedRegisteredCustomer))
        )
    )
    const onClick = jest.fn()

    renderWithProviders(<MockedComponent onClick={onClick} />)

    await waitFor(() => {
        // we wait for login to complete and user's firstName to show up on screen.
        expect(screen.getByText(/Testing/)).toBeInTheDocument()
    })

    const trigger = screen.getByText(/button/i)
    user.click(trigger)

    expect(onClick).toHaveBeenCalledTimes(1)
})

test('should show login modal if user not registered', () => {
    server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedGuestCustomer))
        })
    )
    const onClick = jest.fn()

    renderWithProviders(<MockedComponent onClick={onClick} />)

    const trigger = screen.getByText(/button/i)
    user.click(trigger)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
})
