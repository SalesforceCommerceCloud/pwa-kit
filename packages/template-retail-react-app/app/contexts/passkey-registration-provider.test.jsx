/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {render, act, screen} from '@testing-library/react'
import {
    PasskeyRegistrationProvider,
    PasskeyRegistrationContext,
    usePasskeyRegistrationContext
} from '@salesforce/retail-react-app/app/contexts/passkey-registration-provider'

// Mock PasskeyRegistrationModal
let mockOnSuccessCallback = null
jest.mock('@salesforce/retail-react-app/app/components/passkey-registration-modal', () => {
    const PropTypes = jest.requireActual('prop-types')
    const MockPasskeyRegistrationModal = ({isOpen, onClose, onSuccess}) => {
        mockOnSuccessCallback = onSuccess
        return isOpen ? (
            <div data-testid="passkey-registration-modal">
                <button data-testid="modal-close" onClick={onClose}>
                    Close
                </button>
                <button data-testid="modal-success" onClick={onSuccess}>
                    Succeed
                </button>
            </div>
        ) : null
    }
    MockPasskeyRegistrationModal.propTypes = {
        isOpen: PropTypes.bool.isRequired,
        onClose: PropTypes.func.isRequired,
        onSuccess: PropTypes.func
    }
    return MockPasskeyRegistrationModal
})

describe('PasskeyRegistrationProvider', () => {
    const TestWrapper = ({children}) => (
        <PasskeyRegistrationProvider>{children}</PasskeyRegistrationProvider>
    )

    TestWrapper.propTypes = {
        children: PropTypes.node
    }

    beforeEach(() => {
        mockOnSuccessCallback = null
    })

    it('provides the expected context value including setOnSuccess', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(PasskeyRegistrationContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        expect(contextValue).toBeTruthy()
        expect(contextValue?.passkeyModal).toBeDefined()
        expect(typeof contextValue?.passkeyModal.isOpen).toBe('boolean')
        expect(typeof contextValue?.passkeyModal.onOpen).toBe('function')
        expect(typeof contextValue?.passkeyModal.onClose).toBe('function')
        expect(typeof contextValue?.passkeyModal.setOnSuccess).toBe('function')
    })

    it('initializes with modal closed', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(PasskeyRegistrationContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        expect(contextValue?.passkeyModal.isOpen).toBe(false)
    })

    it('handles modal state correctly', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(PasskeyRegistrationContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Initially modal should be closed
        expect(contextValue?.passkeyModal.isOpen).toBe(false)
        expect(screen.queryByTestId('passkey-registration-modal')).not.toBeInTheDocument()

        // Open modal
        act(() => {
            contextValue?.passkeyModal.onOpen()
        })
        expect(contextValue?.passkeyModal.isOpen).toBe(true)
        expect(screen.getByTestId('passkey-registration-modal')).toBeInTheDocument()

        // Close modal
        act(() => {
            contextValue?.passkeyModal.onClose()
        })
        expect(contextValue?.passkeyModal.isOpen).toBe(false)
        expect(screen.queryByTestId('passkey-registration-modal')).not.toBeInTheDocument()
    })

    it('renders children correctly', () => {
        const TestChild = () => <div data-testid="test-child">Test Child</div>

        const {getByTestId} = render(
            <TestWrapper>
                <TestChild />
            </TestWrapper>
        )

        expect(getByTestId('test-child')).toBeTruthy()
        expect(getByTestId('test-child')).toHaveTextContent('Test Child')
    })

    it('renders PasskeyRegistrationModal component', () => {
        let contextValue
        const TestComponent = () => {
            contextValue = React.useContext(PasskeyRegistrationContext)
            return null
        }

        render(
            <TestWrapper>
                <TestComponent />
            </TestWrapper>
        )

        // Modal should be rendered but not visible initially
        expect(contextValue?.passkeyModal.isOpen).toBe(false)

        // Open modal to verify it's rendered
        act(() => {
            contextValue?.passkeyModal.onOpen()
        })
        expect(screen.getByTestId('passkey-registration-modal')).toBeInTheDocument()
    })

    describe('setOnSuccess / onSuccess callback', () => {
        it('calls the registered onSuccess callback when modal fires onSuccess', () => {
            const mockSuccessFn = jest.fn()
            let contextValue
            const TestComponent = () => {
                contextValue = React.useContext(PasskeyRegistrationContext)
                return null
            }

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            )

            // Register a success callback
            act(() => {
                contextValue.passkeyModal.setOnSuccess(mockSuccessFn)
            })

            // Open modal so onSuccess button is rendered
            act(() => {
                contextValue.passkeyModal.onOpen()
            })

            // Trigger onSuccess from the modal
            act(() => {
                mockOnSuccessCallback?.()
            })

            expect(mockSuccessFn).toHaveBeenCalledTimes(1)
        })

        it('replaces the previous onSuccess when setOnSuccess is called again', () => {
            const firstFn = jest.fn()
            const secondFn = jest.fn()
            let contextValue
            const TestComponent = () => {
                contextValue = React.useContext(PasskeyRegistrationContext)
                return null
            }

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            )

            act(() => {
                contextValue.passkeyModal.setOnSuccess(firstFn)
            })
            act(() => {
                contextValue.passkeyModal.setOnSuccess(secondFn)
            })

            act(() => {
                contextValue.passkeyModal.onOpen()
            })

            act(() => {
                mockOnSuccessCallback?.()
            })

            expect(firstFn).not.toHaveBeenCalled()
            expect(secondFn).toHaveBeenCalledTimes(1)
        })

        it('does not throw when onSuccess fires with no callback registered', () => {
            let contextValue
            const TestComponent = () => {
                contextValue = React.useContext(PasskeyRegistrationContext)
                return null
            }

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            )

            act(() => {
                contextValue.passkeyModal.onOpen()
            })

            expect(() => {
                act(() => {
                    mockOnSuccessCallback?.()
                })
            }).not.toThrow()
        })
    })

    describe('usePasskeyRegistrationContext', () => {
        it('returns context value when used within provider', () => {
            let hookValue
            const TestComponent = () => {
                hookValue = usePasskeyRegistrationContext()
                return null
            }

            render(
                <TestWrapper>
                    <TestComponent />
                </TestWrapper>
            )

            expect(hookValue).toBeTruthy()
            expect(hookValue?.passkeyModal).toBeDefined()
            expect(typeof hookValue?.passkeyModal.isOpen).toBe('boolean')
            expect(typeof hookValue?.passkeyModal.onOpen).toBe('function')
            expect(typeof hookValue?.passkeyModal.onClose).toBe('function')
        })

        it('throws error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

            const TestComponent = () => {
                usePasskeyRegistrationContext()
                return null
            }

            expect(() => {
                render(<TestComponent />)
            }).toThrow(
                'usePasskeyRegistrationContext must be used within a PasskeyRegistrationProvider'
            )

            consoleError.mockRestore()
        })
    })
})
