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
import {renderWithProviders} from '../../utils/test-utils'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {mockedGuestCustomer, mockedRegisteredCustomer} from '../../commerce-api/mock-data'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {AuthHelpers} from '@salesforce/commerce-sdk-react'

jest.setTimeout(60000)

const ButtonWithRegistration = withRegistration(Button)

const mockAuthHelperFunctions = {
    [AuthHelpers.LoginRegisteredUserB2C]: {mutateAsync: jest.fn()}
}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useAuthHelper: jest
            .fn()
            .mockImplementation((helperType) => mockAuthHelperFunctions[helperType])
    }
})

const MockedComponent = (props) => {
    const customer = useCustomer()

    useEffect(() => {
        const doLogin = async () => {
            if (!customer.isRegistered) {
                await customer.login({email: 'customer@test.com', password: 'password1'})
            }
        }
        doLogin()
    }, [])

    return (
        <div>
            <div>firstName: {customer?.firstName}</div>
            <ButtonWithRegistration {...props}>Button</ButtonWithRegistration>
        </div>
    )
}

// Set up and clean up
beforeAll(() => {
    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', '/en-GB/account')
})

beforeEach(() => {
    jest.clearAllMocks()
})

afterEach(() => {
    sessionStorage.clear()
})

test('should execute onClick for registered users', async () => {
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        })
    )
    const onClick = jest.fn()
    renderWithProviders(<MockedComponent onClick={onClick} />)

    await waitFor(() => {
        // we wait for login to complete and user's firstName to show up on screen.
        expect(screen.getByText(/Testing/)).toBeInTheDocument()
    })

    const trigger = await screen.findByText(/button/i)
    await user.click(trigger)

    await waitFor(() => {
        expect(onClick).toHaveBeenCalledTimes(1)
    })
})

test('should show login modal if user not registered', async () => {
    global.server.use(
        rest.get('*/customers/:customerId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedGuestCustomer))
        })
    )
    const onClick = jest.fn()
    renderWithProviders(<MockedComponent onClick={onClick} />)

    const trigger = await screen.findByText(/button/i)
    await waitFor(() => {
        user.click(trigger)
    })

    await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
        expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })
})
