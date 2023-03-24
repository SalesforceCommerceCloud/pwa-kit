/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Button} from '@chakra-ui/react'
import {screen, waitFor} from '@testing-library/react'
import withRegistration from './index'
import {renderWithProviders} from '../../utils/test-utils'
import user from '@testing-library/user-event'
import {rest} from 'msw'
import {mockedGuestCustomer} from '../../mocks/mock-data'
import {useCurrentCustomer} from '../../hooks/use-current-customer'

const ButtonWithRegistration = withRegistration(Button)

const MockedComponent = (props) => {
    const {data: customer} = useCurrentCustomer()
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

afterEach(() => {
    jest.resetModules()
    jest.resetAllMocks()
    sessionStorage.clear()
})

describe('Registered users tests', function () {
    test('should execute onClick for registered users', async () => {
        const onClick = jest.fn()
        renderWithProviders(<MockedComponent onClick={onClick} />)

        await waitFor(() => {
            // we wait for login to complete and user's firstName to show up on screen.
            expect(screen.getByText(/Testing/)).toBeInTheDocument()
        })

        const trigger = screen.getByText(/button/i)
        user.click(trigger)

        await waitFor(() => {
            expect(onClick).toHaveBeenCalledTimes(1)
        })
    })
})

//TODO: revisit when fechtedToken is fixed
describe('Guest user tests', function () {
    beforeEach(() => {
        global.server.use(
            rest.get('*/customers/:customerId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockedGuestCustomer))
            })
        )
    })
    test.skip('should show login modal if user not registered', async () => {
        const onClick = jest.fn()
        renderWithProviders(
            <ButtonWithRegistration onClick={onClick}>Button</ButtonWithRegistration>
        )

        const trigger = await screen.findByText(/button/i)
        await waitFor(() => {
            user.click(trigger)
        })

        await waitFor(
            () => {
                expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
                expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
                expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
                expect(screen.getByText(/sign in/i)).toBeInTheDocument()
            },
            {timeout: 5000}
        )
    })
})
