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
import {createServer} from '../../../jest-setup'

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
    createServer()
    test('should execute onClick for registered users', async () => {
        const onClick = jest.fn()
        renderWithProviders(<MockedComponent onClick={onClick} />)

        const trigger = screen.getByText(/button/i)
        expect(trigger).toBeInTheDocument()
        user.click(trigger)

        await waitFor(() => {
            expect(onClick).toHaveBeenCalledTimes(1)
        })
    })
})

describe('Guest user tests', function () {
    createServer()
    test('should show login modal if user not registered', async () => {
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
})
