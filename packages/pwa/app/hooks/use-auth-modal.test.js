import React from 'react'
import {screen, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {renderWithProviders} from '../utils/test-utils'
import {AuthModal, useAuthModal} from './use-auth-modal'

jest.setTimeout(60000)

const mockRegisteredCustomer = {
    authType: 'registered',
    customerId: 'registeredCustomerId',
    customerNo: 'testno',
    email: 'darek@test.com',
    firstName: 'Tester',
    lastName: 'Testing',
    login: 'darek@test.com'
}

jest.mock('commerce-sdk-isomorphic', () => {
    const sdk = jest.requireActual('commerce-sdk-isomorphic')
    return {
        ...sdk,
        ShopperCustomers: class ShopperCustomersMock extends sdk.ShopperCustomers {
            async registerCustomer() {
                return mockRegisteredCustomer
            }

            async getCustomer(args) {
                if (args.parameters.customerId === 'guestCustomerId') {
                    return {
                        authType: 'guest',
                        customerId: 'guestCustomerId'
                    }
                }
                return mockRegisteredCustomer
            }

            async authorizeCustomer() {
                return {
                    headers: {
                        get(key) {
                            return {authorization: 'guestToken'}[key]
                        }
                    },
                    json: async () => ({
                        authType: 'guest',
                        customerId: 'guestCustomerId'
                    })
                }
            }
        }
    }
})

jest.mock('../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true),
        createGetTokenBody: jest.fn().mockReturnValue({
            grantType: 'test',
            code: 'test',
            usid: 'test',
            codeVerifier: 'test',
            redirectUri: 'http://localhost/test'
        })
    }
})

jest.mock('../commerce-api/pkce', () => {
    return {
        createCodeVerifier: jest.fn().mockReturnValue('codeverifier'),
        generateCodeChallenge: jest.fn().mockReturnValue('codechallenge')
    }
})

const MockedComponent = () => {
    const authModal = useAuthModal()

    return (
        <div>
            <button onClick={authModal.onOpen}>Open Modal</button>
            <AuthModal {...authModal} />
        </div>
    )
}

const server = setupServer()

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    server.listen({
        onUnhandledRequest: 'error'
    })
})
afterEach(() => {
    localStorage.clear()
    server.resetHandlers()
})
afterAll(() => server.close())

test('Renders login modal by default', async () => {
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
})

test('Allows customer to sign in to their account', async () => {
    // mock auth flow requests
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
                    refresh_token: 'testrefeshtoken'
                })
            )
        ),

        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.json({authType: 'registered', email: 'darek@test.com'}))
        )
    )

    // render our test component
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'darek@test.com')
    user.type(screen.getByLabelText('Password'), 'Password!1')
    user.click(screen.getByText(/sign in/i))

    // wait for success state to appear
    expect(
        await screen.findByText(/where would you like to go next/i, {}, {timeout: 12000})
    ).toBeInTheDocument()

    // close the modal
    user.click(screen.getByText(/continue shopping/i))
    expect(screen.queryByText(/where would you like to go next/)).not.toBeInTheDocument()
})

test('Renders error when given incorrect log in credentials', async () => {
    // mock failed auth request
    server.use(
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(401), ctx.json({message: 'Invalid Credentials.'}))
        )
    )

    // render our test component
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'foo@test.com')
    user.type(screen.getByLabelText('Password'), 'SomeFakePassword1!')
    user.click(screen.getByText(/sign in/i))

    // wait for login error alert to appear
    expect(
        await screen.findByText(
            /something's not right with your email or password\. try again\./i,
            {},
            {timeout: 12000}
        )
    ).toBeInTheDocument()
})

test('Allows customer to generate password token', async () => {
    // mock reset password request
    server.use(
        rest.post('*/create-reset-token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    email: 'foo@test.com',
                    expiresInMinutes: 10,
                    login: 'foo@test.com',
                    resetToken: 'testresettoken'
                })
            )
        )
    )

    // render our test component
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    // switch to 'reset password' view
    user.click(screen.getByText(/forgot password/i))

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'foo@test.com')
    user.click(within(screen.getByTestId('sf-auth-modal-form')).getByText(/reset password/i))

    // wait for success state
    expect(await screen.findByText(/password reset/i, {}, {timeout: 12000})).toBeInTheDocument()
    expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
})

test('Allows customer to create an account', async () => {
    server.use(
        rest.post('*/oauth2/login', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
        }),

        rest.get('*/testcallback', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200))
        }),

        rest.post('*/oauth2/token', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'test',
                    access_token: 'testtoken',
                    refresh_token: 'testrefeshtoken'
                })
            )
        }),

        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockRegisteredCustomer))
        })
    )

    // render our test component
    renderWithProviders(<MockedComponent />)

    // open the modal
    const trigger = screen.getByText(/open modal/i)
    user.click(trigger)

    // switch to 'create account' view
    user.click(screen.getByText(/create account/i))

    // fill out form and submit
    const withinForm = within(screen.getByTestId('sf-auth-modal-form'))
    user.type(withinForm.getByLabelText(/first name/i), 'Tester')
    user.type(withinForm.getByLabelText(/last name/i), 'Testing')
    user.type(withinForm.getByPlaceholderText(/you@email.com/i), 'darek@test.com')
    user.type(withinForm.getAllByLabelText(/password/i)[0], 'Password!1')
    user.click(withinForm.getByText(/create account/i))

    expect(
        await screen.findByText(/Where would you like to go next/i, {}, {timeout: 30000})
    ).toBeInTheDocument()
})
