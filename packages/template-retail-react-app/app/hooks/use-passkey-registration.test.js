/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {rest} from 'msw'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {usePasskeyRegistration} from '@salesforce/retail-react-app/app/hooks/use-passkey-registration'
import {PasskeyRegistrationProvider} from '@salesforce/retail-react-app/app/contexts/passkey-registration-provider'

// Mock PasskeyRegistrationModal
jest.mock('@salesforce/retail-react-app/app/components/passkey-registration-modal/index', () => {
    const PropTypes = jest.requireActual('prop-types')
    const MockPasskeyRegistrationModal = ({isOpen, onClose}) => {
        return isOpen ? (
            <div data-testid="passkey-registration-modal">
                <button data-testid="modal-close" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null
    }
    MockPasskeyRegistrationModal.propTypes = {
        isOpen: PropTypes.bool,
        onClose: PropTypes.func
    }
    return MockPasskeyRegistrationModal
})

// Mock Commerce SDK hooks
const mockMutateAsync = jest.fn()
const mockUseAuthHelper = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useAuthHelper: (param) => mockUseAuthHelper(param)
}))

// Mock useCurrentCustomer
const mockUseCurrentCustomer = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => mockUseCurrentCustomer()
}))

const TestComponent = () => {
    const {showToast} = usePasskeyRegistration()

    return (
        <div>
            <button data-testid="show-toast-button" onClick={showToast}>
                Show Toast
            </button>
        </div>
    )
}

const TestComponentWithProvider = ({children}) => (
    <PasskeyRegistrationProvider>{children}</PasskeyRegistrationProvider>
)

TestComponentWithProvider.propTypes = {
    children: PropTypes.node.isRequired
}

describe('usePasskeyRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseCurrentCustomer.mockReturnValue({
            data: {email: 'test@example.com'}
        })
        mockUseAuthHelper.mockReturnValue({
            mutateAsync: mockMutateAsync
        })

        // Mock product API calls that may be triggered by components in the provider tree
        global.server.use(
            rest.get('*/products*', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json({data: []}))
            })
        )
    })

    describe('Hook Return Values', () => {
        test('returns showToast function and passkeyModal state', () => {
            let hookResult
            const TestHook = () => {
                hookResult = usePasskeyRegistration()
                return null
            }

            renderWithProviders(
                <TestComponentWithProvider>
                    <TestHook />
                </TestComponentWithProvider>
            )

            expect(hookResult).toBeDefined()
            expect(typeof hookResult.showToast).toBe('function')
            expect(hookResult.passkeyModal).toBeDefined()
            expect(typeof hookResult.passkeyModal.isOpen).toBe('boolean')
            expect(typeof hookResult.passkeyModal.onClose).toBe('function')
            expect(typeof hookResult.passkeyModal.onOpen).toBe('function')
        })

        test('initializes with modal closed', () => {
            let hookResult
            const TestHook = () => {
                hookResult = usePasskeyRegistration()
                return null
            }

            renderWithProviders(
                <TestComponentWithProvider>
                    <TestHook />
                </TestComponentWithProvider>
            )

            expect(hookResult.passkeyModal.isOpen).toBe(false)
        })
    })

    describe('Toast Functionality', () => {
        test('displays toast when showToast is called', async () => {
            const {user} = renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            const showToastButton = screen.getByTestId('show-toast-button')
            await user.click(showToastButton)

            await waitFor(() => {
                expect(
                    screen.getByText('Create a passkey for a more secure and easier login')
                ).toBeInTheDocument()
            })
        })

        test('toast contains Create Passkey button', async () => {
            const {user} = renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            const showToastButton = screen.getByTestId('show-toast-button')
            await user.click(showToastButton)

            await waitFor(() => {
                expect(screen.getByText('Create Passkey')).toBeInTheDocument()
            })
        })
    })

    describe('Modal Integration', () => {
        test('clicking Create Passkey button in toast opens modal', async () => {
            const {user} = renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            // Show toast
            const showToastButton = screen.getByTestId('show-toast-button')
            await user.click(showToastButton)

            // Wait for toast to appear and click Create Passkey button
            await waitFor(() => {
                expect(screen.getByText('Create Passkey')).toBeInTheDocument()
            })

            const createPasskeyButton = screen.getByText('Create Passkey')
            await user.click(createPasskeyButton)

            // Modal should open
            await waitFor(() => {
                expect(screen.getByTestId('passkey-registration-modal')).toBeInTheDocument()
            })
        })

        test('can close modal using onClose', async () => {
            const {user} = renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            // Show toast and open modal
            const showToastButton = screen.getByTestId('show-toast-button')
            await user.click(showToastButton)

            await waitFor(() => {
                expect(screen.getByText('Create Passkey')).toBeInTheDocument()
            })

            const createPasskeyButton = screen.getByText('Create Passkey')
            await user.click(createPasskeyButton)

            await waitFor(() => {
                expect(screen.getByTestId('passkey-registration-modal')).toBeInTheDocument()
            })

            // Close modal
            const closeButton = screen.getByTestId('modal-close')
            await user.click(closeButton)

            await waitFor(() => {
                expect(screen.queryByTestId('passkey-registration-modal')).not.toBeInTheDocument()
            })
        })
    })
})
