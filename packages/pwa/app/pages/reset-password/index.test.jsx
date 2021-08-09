import React from 'react'
import {screen, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {renderWithProviders} from '../../utils/test-utils'
import ResetPassword from '.'

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

const MockedComponent = () => {
    return (
        <div>
            <ResetPassword />
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

    // enter credentials and submit
    user.type(screen.getByLabelText('Email'), 'foo@test.com')
    user.click(within(screen.getByTestId('sf-auth-modal-form')).getByText(/reset password/i))

    // wait for success state
    expect(await screen.findByText(/password reset/i, {}, {timeout: 12000})).toBeInTheDocument()
    expect(screen.getByText(/foo@test.com/i)).toBeInTheDocument()
})
