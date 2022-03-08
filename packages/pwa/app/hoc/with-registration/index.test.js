/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import {Button} from '@chakra-ui/react'
import {screen, waitFor} from '@testing-library/react'
import React from 'react'
import withRegistration from './index'
import {renderWithProviders, setupMockServer} from '../../utils/test-utils'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {mockedGuestCustomer} from '../../commerce-api/mock-data'
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
        if (!customer.isRegistered) {
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
const server = setupMockServer()

// Set up and clean up
beforeAll(() => {
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en-GB/account')
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
