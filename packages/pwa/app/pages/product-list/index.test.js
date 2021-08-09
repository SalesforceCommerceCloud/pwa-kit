import React from 'react'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {mockedRegisteredCustomer, productsResponse} from '../../commerce-api/mock-data'
import {screen} from '@testing-library/react'
import {Route, Switch} from 'react-router-dom'
import {renderWithProviders} from '../../utils/test-utils'
import ProductList from '.'

jest.setTimeout(60000)

jest.useFakeTimers()

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

const MockedComponent = () => {
    return (
        <Switch>
            <Route
                path="/:locale/category/:categoryId"
                render={(props) => <ProductList {...props} />}
            />
        </Switch>
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
    rest.get('*/product-search', (req, res, ctx) =>
        res(ctx.delay(0), ctx.status(200), ctx.json(productsResponse))
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
    window.history.pushState({}, 'ProductList', 'en/category/mens-clothing-jackets')
})

beforeEach(() => {
    jest.resetModules()
    server.listen({onUnhandledRequest: 'error'})
})

afterEach(() => {
    jest.resetModules()
})
afterAll(() => server.close())

test('should render product list page', async () => {
    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('sf-product-list-page')).toBeInTheDocument()
})
