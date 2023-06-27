/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {screen, waitFor} from '@testing-library/react'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import userEvent from '@testing-library/user-event'
import {rest} from 'msw'
import {mockedGuestCustomer} from '@salesforce/retail-react-app/app/mocks/mock-data'

const ButtonWithRegistration = withRegistration(Button)

const MockedComponent = (props) => {
    return (
        <div>
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
    sessionStorage.clear()
})

describe('Registered users tests', function () {
    test('should execute onClick for registered users', async () => {
        const user = userEvent.setup()

        const onClick = jest.fn()
        renderWithProviders(<MockedComponent onClick={onClick} />)

        const trigger = screen.getByText(/button/i)
        expect(trigger).toBeInTheDocument()
        await user.click(trigger)

        await waitFor(() => {
            expect(onClick).toHaveBeenCalledTimes(1)
        })
    })
})

describe('Guest user tests', function () {
    beforeEach(() => {
        global.server.use(
            rest.get('*/customers/:customerId', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockedGuestCustomer))
            })
        )
    })
    test('should show login modal if user not registered', async () => {
        const user = userEvent.setup()
        const onClick = jest.fn()
        renderWithProviders(
            <ButtonWithRegistration onClick={onClick}>Button</ButtonWithRegistration>,
            {
                wrapperProps: {
                    isGuest: true
                }
            }
        )

        const trigger = await screen.findByText(/button/i)
        await user.click(trigger)

        await waitFor(() => {
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
            expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
            expect(screen.getByText(/sign in/i)).toBeInTheDocument()
        })
    })
})
