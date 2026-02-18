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
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

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
    const {showRegisterPasskeyToast} = usePasskeyRegistration()

    return (
        <div>
            <button data-testid="show-toast-button" onClick={showRegisterPasskeyToast}>
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
        getConfig.mockReturnValue(mockConfig)
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
        test('returns showRegisterPasskeyToast function and passkeyModal state', () => {
            renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            expect(screen.getByTestId('show-toast-button')).toBeInTheDocument()
            expect(screen.queryByTestId('passkey-registration-modal')).not.toBeInTheDocument()
        })

        test('initializes with modal closed', () => {
            renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            expect(screen.queryByTestId('passkey-registration-modal')).not.toBeInTheDocument()
        })
    })

    describe('Toast Functionality', () => {
        beforeEach(() => {
            getConfig.mockReturnValue(mockConfig)
            global.PublicKeyCredential = {
                isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true),
                isConditionalMediationAvailable: jest.fn().mockResolvedValue(true)
            }
            global.window.PublicKeyCredential = global.PublicKeyCredential
        })

        afterEach(() => {
            delete global.PublicKeyCredential
            delete global.window.PublicKeyCredential
        })

        test('displays toast when showRegisterPasskeyToast is called', async () => {
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
        beforeEach(() => {
            getConfig.mockReturnValue(mockConfig)
            global.PublicKeyCredential = {
                isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true),
                isConditionalMediationAvailable: jest.fn().mockResolvedValue(true)
            }
            global.window.PublicKeyCredential = global.PublicKeyCredential
        })

        afterEach(() => {
            delete global.PublicKeyCredential
            delete global.window.PublicKeyCredential
        })

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

    describe('Preconditions for showing the toast', () => {
        let mockIsUserVerifying
        let mockIsConditionalMediation

        beforeEach(() => {
            mockIsUserVerifying = jest.fn().mockResolvedValue(true)
            mockIsConditionalMediation = jest.fn().mockResolvedValue(true)
            global.PublicKeyCredential = {
                isUserVerifyingPlatformAuthenticatorAvailable: mockIsUserVerifying,
                isConditionalMediationAvailable: mockIsConditionalMediation
            }
            global.window.PublicKeyCredential = global.PublicKeyCredential
        })

        afterEach(() => {
            delete global.PublicKeyCredential
            delete global.window.PublicKeyCredential
        })

        test('does not display toast when passkey is disabled in config', async () => {
            getConfig.mockReturnValue({
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    login: {
                        ...mockConfig.app.login,
                        passkey: {enabled: false}
                    }
                }
            })

            const {user} = renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            await user.click(screen.getByTestId('show-toast-button'))
            await waitFor(() => {
                expect(mockIsUserVerifying).not.toHaveBeenCalled()
            })
            expect(
                screen.queryByText('Create a passkey for a more secure and easier login')
            ).not.toBeInTheDocument()
        })

        test('does not display toast when PublicKeyCredential is not available', async () => {
            getConfig.mockReturnValue({
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    login: {
                        ...mockConfig.app.login,
                        passkey: {enabled: true}
                    }
                }
            })
            delete global.PublicKeyCredential
            delete global.window.PublicKeyCredential

            const {user} = renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            await user.click(screen.getByTestId('show-toast-button'))

            expect(
                screen.queryByText('Create a passkey for a more secure and easier login')
            ).not.toBeInTheDocument()
        })

        test('does not display toast when isUserVerifyingPlatformAuthenticatorAvailable returns false', async () => {
            getConfig.mockReturnValue({
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    login: {
                        ...mockConfig.app.login,
                        passkey: {enabled: true}
                    }
                }
            })
            mockIsUserVerifying.mockResolvedValue(false)

            const {user} = renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            await user.click(screen.getByTestId('show-toast-button'))

            expect(
                screen.queryByText('Create a passkey for a more secure and easier login')
            ).not.toBeInTheDocument()
        })

        test('does not display toast when isConditionalMediationAvailable returns false', async () => {
            getConfig.mockReturnValue({
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    login: {
                        ...mockConfig.app.login,
                        passkey: {enabled: true}
                    }
                }
            })
            mockIsConditionalMediation.mockResolvedValue(false)

            const {user} = renderWithProviders(
                <TestComponentWithProvider>
                    <TestComponent />
                </TestComponentWithProvider>
            )

            await user.click(screen.getByTestId('show-toast-button'))

            expect(
                screen.queryByText('Create a passkey for a more secure and easier login')
            ).not.toBeInTheDocument()
        })
    })
})
