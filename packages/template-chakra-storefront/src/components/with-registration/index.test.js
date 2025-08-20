/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Button} from '@chakra-ui/react'
import {act, screen, waitFor} from '@testing-library/react'
import withRegistration from './index'
import {renderWithProviders} from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import {useToast, useCurrentCustomer, useAuthModal} from '../../hooks'

// Mock the hooks used in withRegistration
let mockIsGuestTest = false

jest.mock('../../hooks', () => ({
    useToast: jest.fn(),
    useCurrentCustomer: jest.fn(),
    AuthModal: jest.fn(({isOpen}) => {
        // In guest tests, always show the modal content when isOpen would be true
        if (mockIsGuestTest || isOpen) {
            return (
                <div data-testid="auth-modal">
                    <form>
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" />
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" />
                        <button type="button">Sign In</button>
                        <button type="button">Forgot Password</button>
                    </form>
                </div>
            )
        }
        return null
    }),
    useAuthModal: jest.fn()
}))

// Setup default mock implementations
const mockToast = jest.fn()

const createMockAuthModal = () => ({
    isOpen: false,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    initialView: 'login',
    isPasswordlessEnabled: false,
    idps: []
})

useToast.mockReturnValue(mockToast)
useAuthModal.mockImplementation(() => createMockAuthModal())
useCurrentCustomer.mockReturnValue({
    data: {
        isRegistered: true,
        isGuest: false,
        customerType: 'registered',
        customerId: 'test-customer-id'
    }
})

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
    // Reset all mocks
    jest.clearAllMocks()

    // Reset to default mock implementations
    useToast.mockReturnValue(mockToast)
    useAuthModal.mockImplementation(() => createMockAuthModal())
    useCurrentCustomer.mockReturnValue({
        data: {
            isRegistered: true,
            isGuest: false,
            customerType: 'registered',
            customerId: 'test-customer-id'
        }
    })
})

describe('Registered users tests', function () {
    test('should execute onClick for registered users', async () => {
        const user = userEvent.setup()

        const onClick = jest.fn()
        renderWithProviders(<MockedComponent onClick={onClick} />)

        const trigger = screen.getByText(/button/i)
        expect(trigger).toBeInTheDocument()
        await act(async () => {
            await user.click(trigger)
        })

        await waitFor(() => {
            expect(onClick).toHaveBeenCalledTimes(1)
        })
    })
})

describe('Guest user tests', function () {
    beforeEach(() => {
        mockIsGuestTest = true

        // Mock unregistered/guest user
        useCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: false,
                isGuest: true,
                customerType: 'guest',
                customerId: 'guest-customer-id'
            }
        })
    })

    afterEach(() => {
        mockIsGuestTest = false
    })

    test('should show login modal if user not registered', async () => {
        const user = userEvent.setup()
        const onClick = jest.fn()
        const mockAuthModal = createMockAuthModal()
        useAuthModal.mockReturnValue(mockAuthModal)

        renderWithProviders(
            <ButtonWithRegistration onClick={onClick}>Button</ButtonWithRegistration>,
            {
                wrapperProps: {
                    isGuest: true
                }
            }
        )

        const trigger = await screen.findByText(/button/i)
        await act(async () => {
            await user.click(trigger)
        })

        // Verify that onOpen was called
        expect(mockAuthModal.onOpen).toHaveBeenCalled()

        await waitFor(() => {
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
            expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
            expect(screen.getByText(/sign in/i)).toBeInTheDocument()
        })
    })
})
