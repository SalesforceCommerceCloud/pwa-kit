/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {rest} from 'msw'

// Unmock the component so we can test it
jest.unmock('@salesforce/retail-react-app/app/components/passkey-registration-modal')
import PasskeyRegistrationModal from '@salesforce/retail-react-app/app/components/passkey-registration-modal/index'

// Mock Commerce SDK hooks
const mockMutateAsync = jest.fn()
const mockUseAuthHelper = jest.fn()

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useAuthHelper: (param) => mockUseAuthHelper(param),
    AuthHelpers: {
        AuthorizeWebauthnRegistration: 'AuthorizeWebauthnRegistration',
        StartWebauthnUserRegistration: 'StartWebauthnUserRegistration',
        FinishWebauthnUserRegistration: 'FinishWebauthnUserRegistration'
    }
}))

// Mock useCurrentCustomer
const mockUseCurrentCustomer = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: () => mockUseCurrentCustomer()
}))

// Mock OtpAuth component - expose handleOtpVerification for testing
let otpVerificationHandler = null
jest.mock('@salesforce/retail-react-app/app/components/otp-auth', () => {
    const PropTypes = jest.requireActual('prop-types')
    const React = jest.requireActual('react')
    const MockOtpAuth = ({isOpen, handleOtpVerification}) => {
        React.useEffect(() => {
            if (handleOtpVerification) {
                otpVerificationHandler = handleOtpVerification
            }
        }, [handleOtpVerification])
        return isOpen ? <div data-testid="otp-auth-modal">OTP Auth Modal</div> : null
    }
    MockOtpAuth.propTypes = {
        isOpen: PropTypes.bool,
        handleOtpVerification: PropTypes.func
    }
    return MockOtpAuth
})

describe('PasskeyRegistrationModal', () => {
    const mockOnClose = jest.fn()
    const mockCustomer = {
        email: 'test@example.com'
    }

    function PasskeyRegistrationModalWrapper() {
        const [isOpen, setIsOpen] = React.useState(true)

        return <PasskeyRegistrationModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    }

    beforeEach(() => {
        jest.clearAllMocks()
        otpVerificationHandler = null
        mockUseCurrentCustomer.mockReturnValue({
            data: mockCustomer
        })
        mockUseAuthHelper.mockReturnValue({
            mutateAsync: mockMutateAsync
        })

        // Mock WebAuthn API
        global.navigator.credentials = {
            create: jest.fn()
        }

        // Mock PublicKeyCredential API
        global.PublicKeyCredential = {
            parseCreationOptionsFromJSON: jest.fn((options) => ({
                challenge: new Uint8Array([1, 2, 3]),
                rp: {name: 'Test RP', id: 'example.com'},
                user: {
                    id: new Uint8Array([4, 5, 6]),
                    name: 'test@example.com',
                    displayName: 'Test User'
                },
                pubKeyCredParams: [{type: 'public-key', alg: -7}],
                ...options
            })),
            isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true),
            isConditionalMediationAvailable: jest.fn().mockResolvedValue(true)
        }

        // Mock product API calls that may be triggered by components in the provider tree
        global.server.use(
            rest.get('*/products*', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json({data: []}))
            })
        )
    })

    afterEach(() => {
        delete global.PublicKeyCredential
    })

    describe('Rendering', () => {
        test('renders modal when isOpen is true', () => {
            renderWithProviders(<PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />, {
                wrapperProps: {appConfig: mockConfig.app}
            })

            expect(screen.getByText('Create Passkey')).toBeInTheDocument()
            expect(screen.getByText(/Passkey Nickname/)).toBeInTheDocument()
            expect(
                screen.getByPlaceholderText("e.g., 'iPhone', 'Personal Laptop'")
            ).toBeInTheDocument()
            expect(screen.getByText('Register Passkey')).toBeInTheDocument()
        })

        test('does not render modal when isOpen is false', () => {
            renderWithProviders(<PasskeyRegistrationModal isOpen={false} onClose={mockOnClose} />)

            expect(screen.queryByText('Create Passkey')).not.toBeInTheDocument()
        })
    })

    describe('User Interactions', () => {
        test('allows user to type in nickname input', async () => {
            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />
            )

            const input = screen.getByPlaceholderText("e.g., 'iPhone', 'Personal Laptop'")
            await user.type(input, 'My iPhone')

            expect(input).toHaveValue('My iPhone')
        })

        test('calls onClose when close button is clicked', async () => {
            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />
            )

            const closeButton = screen.getByLabelText('Close passkey form')
            await user.click(closeButton)

            expect(mockOnClose).toHaveBeenCalledTimes(1)
        })

        test('resets form state when modal opens', async () => {
            const {user} = renderWithProviders(<PasskeyRegistrationModalWrapper />)

            const input = screen.getByPlaceholderText("e.g., 'iPhone', 'Personal Laptop'")
            await user.type(input, 'Test Nickname')
            expect(input).toHaveValue('Test Nickname')

            // Close modal
            const closeButton = screen.getByTestId('passkey-registration-modal-close-button')
            await user.click(closeButton)

            await waitFor(() => {
                expect(
                    screen.queryByPlaceholderText("e.g., 'iPhone', 'Personal Laptop'")
                ).not.toBeInTheDocument()
            })

            // Reopen modal - state should be reset
            renderWithProviders(<PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />)
            const newInput = screen.getByPlaceholderText("e.g., 'iPhone', 'Personal Laptop'")
            expect(newInput).toHaveValue('')
        })
    })

    describe('Passkey Registration', () => {
        test('calls authorizeWebauthnRegistration on register button click', async () => {
            mockMutateAsync.mockResolvedValue({})
            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />
            )

            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(mockMutateAsync).toHaveBeenCalledWith({
                    user_id: 'test@example.com',
                    mode: 'callback',
                    callback_uri: 'https://webhook.site/ee47be40-e9fc-4313-8b56-18e4fe819043'
                })
            })
        })

        test('closes modal and opens OTP auth modal on successful registration', async () => {
            mockMutateAsync.mockResolvedValue({})
            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />
            )

            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled()
                expect(screen.getByTestId('otp-auth-modal')).toBeInTheDocument()
            })
        })

        test('displays error message when registration fails', async () => {
            const errorMessage = 'Registration failed'
            mockMutateAsync.mockRejectedValue(new Error(errorMessage))
            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />
            )

            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(screen.getByText('Something went wrong. Try again!')).toBeInTheDocument()
            })
        })

        test('shows loading state during registration', async () => {
            mockMutateAsync.mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 100))
            )
            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />
            )

            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            expect(screen.getByText('Registering...')).toBeInTheDocument()
            expect(registerButton).toBeDisabled()
        })
    })

    describe('handleOtpVerification', () => {
        let mockStartWebauthnRegistration
        let mockFinishWebauthnRegistration
        let mockAuthorizeWebauthnRegistration

        beforeEach(() => {
            // Setup separate mocks for each auth helper
            mockStartWebauthnRegistration = jest.fn()
            mockFinishWebauthnRegistration = jest.fn()
            mockAuthorizeWebauthnRegistration = jest.fn()

            mockUseAuthHelper.mockImplementation((helperType) => {
                if (helperType === 'StartWebauthnUserRegistration') {
                    return {mutateAsync: mockStartWebauthnRegistration}
                }
                if (helperType === 'FinishWebauthnUserRegistration') {
                    return {mutateAsync: mockFinishWebauthnRegistration}
                }
                if (helperType === 'AuthorizeWebauthnRegistration') {
                    return {mutateAsync: mockAuthorizeWebauthnRegistration}
                }
                return {mutateAsync: mockMutateAsync}
            })
        })

        test('calls onSuccess after successful passkey registration', async () => {
            const mockOnSuccess = jest.fn()
            const otpCode = '12345678'
            const mockStartResponse = {
                challenge: 'dGVzdA==',
                rp: {name: 'Test', id: 'example.com'},
                user: {id: 'dGVzdA==', name: 'test@example.com'},
                pubKeyCredParams: [],
                timeout: 60000
            }
            const mockCredential = {
                type: 'public-key',
                id: 'test-id',
                rawId: new ArrayBuffer(8),
                response: {
                    attestationObject: new ArrayBuffer(16),
                    clientDataJSON: new ArrayBuffer(16)
                }
            }

            mockStartWebauthnRegistration.mockResolvedValue(mockStartResponse)
            global.navigator.credentials.create.mockResolvedValue(mockCredential)
            mockFinishWebauthnRegistration.mockResolvedValue({})

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />,
                {wrapperProps: {appConfig: mockConfig.app}}
            )

            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result).toEqual({success: true})
            expect(mockOnSuccess).toHaveBeenCalledTimes(1)
        })

        test('does not call onSuccess when registration fails', async () => {
            const mockOnSuccess = jest.fn()
            const otpCode = '12345678'

            mockStartWebauthnRegistration.mockRejectedValue(new Error('Registration failed'))

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />,
                {wrapperProps: {appConfig: mockConfig.app}}
            )

            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result.success).toBe(false)
            expect(mockOnSuccess).not.toHaveBeenCalled()
        })

        test('successfully completes OTP verification and passkey registration flow', async () => {
            const otpCode = '12345678'
            const mockChallenge = 'dGVzdC1jaGFsbGVuZ2U='
            const mockUserId = 'dGVzdC11c2VyLWlk'

            // Mock startWebauthnUserRegistration response
            const mockStartResponse = {
                challenge: mockChallenge,
                rp: {
                    name: 'Test RP',
                    id: 'example.com'
                },
                user: {
                    id: mockUserId,
                    name: 'test@example.com',
                    displayName: 'Test User'
                },
                pubKeyCredParams: [
                    {
                        type: 'public-key',
                        alg: -7
                    }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required'
                },
                timeout: 60000,
                attestation: 'none'
            }

            // Mock WebAuthn credential
            const mockCredential = {
                type: 'public-key',
                id: 'test-credential-id',
                rawId: new ArrayBuffer(8),
                response: {
                    attestationObject: new ArrayBuffer(16),
                    clientDataJSON: new ArrayBuffer(16)
                }
            }

            mockStartWebauthnRegistration.mockResolvedValue(mockStartResponse)
            global.navigator.credentials.create.mockResolvedValue(mockCredential)
            mockFinishWebauthnRegistration.mockResolvedValue({})

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            // Open OTP modal first
            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(screen.getByTestId('otp-auth-modal')).toBeInTheDocument()
            })

            // Wait for handler to be set
            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            // Call handleOtpVerification
            const result = await otpVerificationHandler(otpCode)

            // Verify startWebauthnUserRegistration was called correctly
            expect(mockStartWebauthnRegistration).toHaveBeenCalledWith({
                user_id: 'test@example.com',
                pwd_action_token: otpCode
            })

            // Verify navigator.credentials.create was called
            expect(global.navigator.credentials.create).toHaveBeenCalled()
            const publicKeyOptions = global.navigator.credentials.create.mock.calls[0][0].publicKey

            // Verify structure and key properties
            expect(publicKeyOptions.challenge).toBeDefined()
            expect(publicKeyOptions.rp).toMatchObject({
                name: 'Test RP',
                id: 'example.com'
            })
            expect(publicKeyOptions.user.id).toBeDefined()
            expect(Array.isArray(publicKeyOptions.pubKeyCredParams)).toBe(true)
            expect(publicKeyOptions.authenticatorSelection).toBeDefined()
            expect(typeof publicKeyOptions.timeout).toBe('number')
            expect(publicKeyOptions.attestation).toBe('none')

            // Verify finishWebauthnUserRegistration was called correctly
            expect(mockFinishWebauthnRegistration).toHaveBeenCalledWith({
                username: 'test@example.com',
                credential: expect.objectContaining({
                    type: 'public-key',
                    id: 'test-credential-id'
                }),
                pwd_action_token: otpCode
            })

            // Verify success result
            expect(result).toEqual({success: true})

            // Verify modals are closed
            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled()
            })
        })

        test('includes nickname in startWebauthnUserRegistration when provided', async () => {
            const otpCode = '12345678'
            const nickname = 'My iPhone'
            const mockStartResponse = {
                challenge: 'dGVzdA==',
                rp: {name: 'Test', id: 'example.com'},
                user: {id: 'dGVzdA==', name: 'test@example.com'},
                pubKeyCredParams: [],
                timeout: 60000
            }

            const mockCredential = {
                type: 'public-key',
                id: 'test-id',
                rawId: new ArrayBuffer(8),
                response: {
                    attestationObject: new ArrayBuffer(16),
                    clientDataJSON: new ArrayBuffer(16)
                }
            }

            mockStartWebauthnRegistration.mockResolvedValue(mockStartResponse)
            global.navigator.credentials.create.mockResolvedValue(mockCredential)
            mockFinishWebauthnRegistration.mockResolvedValue({})

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            // Set nickname
            const input = screen.getByPlaceholderText("e.g., 'iPhone', 'Personal Laptop'")
            await user.type(input, nickname)

            // Open OTP modal
            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            await otpVerificationHandler(otpCode)

            // Verify nickname was included
            expect(mockStartWebauthnRegistration).toHaveBeenCalledWith({
                user_id: 'test@example.com',
                pwd_action_token: otpCode,
                nick_name: nickname
            })
        })

        test('returns error when startWebauthnUserRegistration fails', async () => {
            const otpCode = '12345678'
            const errorMessage = 'Failed to start registration'

            mockStartWebauthnRegistration.mockRejectedValue(new Error(errorMessage))

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            // Open OTP modal
            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result).toEqual({
                success: false,
                error: 'Something went wrong. Try again!'
            })

            // Verify modals are not closed on error
            // mockOnClose was called once when opening OTP modal, but not again after error
            expect(mockOnClose).toHaveBeenCalledTimes(1)
        })

        test('returns error when WebAuthn API is not available', async () => {
            const otpCode = '12345678'
            const mockStartResponse = {
                challenge: 'dGVzdA==',
                rp: {name: 'Test', id: 'example.com'},
                user: {id: 'dGVzdA==', name: 'test@example.com'},
                pubKeyCredParams: [],
                timeout: 60000
            }

            mockStartWebauthnRegistration.mockResolvedValue(mockStartResponse)
            // Remove credentials API
            delete global.navigator.credentials

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            // Open OTP modal
            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result).toEqual({
                success: false,
                error: 'Something went wrong. Try again!'
            })
        })

        test('returns error when user cancels WebAuthn prompt', async () => {
            const otpCode = '12345678'
            const mockStartResponse = {
                challenge: 'dGVzdA==',
                rp: {name: 'Test', id: 'example.com'},
                user: {id: 'dGVzdA==', name: 'test@example.com'},
                pubKeyCredParams: [],
                timeout: 60000
            }

            const notAllowedError = new Error('User cancelled')
            notAllowedError.name = 'NotAllowedError'

            mockStartWebauthnRegistration.mockResolvedValue(mockStartResponse)
            global.navigator.credentials.create.mockRejectedValue(notAllowedError)

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            // Open OTP modal
            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result).toEqual({
                success: false,
                error: 'Something went wrong. Try again!'
            })
        })

        test('returns error when WebAuthn create returns null credential', async () => {
            const otpCode = '12345678'
            const mockStartResponse = {
                challenge: 'dGVzdA==',
                rp: {name: 'Test', id: 'example.com'},
                user: {id: 'dGVzdA==', name: 'test@example.com'},
                pubKeyCredParams: [],
                timeout: 60000
            }

            mockStartWebauthnRegistration.mockResolvedValue(mockStartResponse)
            global.navigator.credentials.create.mockResolvedValue(null)

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            // Open OTP modal
            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result).toEqual({
                success: false,
                error: 'Something went wrong. Try again!'
            })
        })

        test('returns error when finishWebauthnUserRegistration fails', async () => {
            const otpCode = '12345678'
            const mockStartResponse = {
                challenge: 'dGVzdA==',
                rp: {name: 'Test', id: 'example.com'},
                user: {id: 'dGVzdA==', name: 'test@example.com'},
                pubKeyCredParams: [],
                timeout: 60000
            }

            const mockCredential = {
                type: 'public-key',
                id: 'test-id',
                rawId: new ArrayBuffer(8),
                response: {
                    attestationObject: new ArrayBuffer(16),
                    clientDataJSON: new ArrayBuffer(16)
                }
            }

            const errorMessage = 'Failed to finish registration'

            mockStartWebauthnRegistration.mockResolvedValue(mockStartResponse)
            global.navigator.credentials.create.mockResolvedValue(mockCredential)
            mockFinishWebauthnRegistration.mockRejectedValue(new Error(errorMessage))

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            // Open OTP modal
            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result).toEqual({
                success: false,
                error: 'Something went wrong. Try again!'
            })
        })

        test('handles AbortError from WebAuthn API', async () => {
            const otpCode = '12345678'
            const mockStartResponse = {
                challenge: 'dGVzdA==',
                rp: {name: 'Test', id: 'example.com'},
                user: {id: 'dGVzdA==', name: 'test@example.com'},
                pubKeyCredParams: [],
                timeout: 60000
            }

            const abortError = new Error('Operation aborted')
            abortError.name = 'AbortError'

            mockStartWebauthnRegistration.mockResolvedValue(mockStartResponse)
            global.navigator.credentials.create.mockRejectedValue(abortError)

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            // Open OTP modal
            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result).toEqual({
                success: false,
                error: 'Something went wrong. Try again!'
            })
        })

        test('returns INVALID_TOKEN_ERROR_MESSAGE when startWebauthnUserRegistration fails with 401', async () => {
            const otpCode = '12345678'

            mockStartWebauthnRegistration.mockRejectedValue(new Error('401'))

            const {user} = renderWithProviders(
                <PasskeyRegistrationModal isOpen={true} onClose={mockOnClose} />,
                {
                    wrapperProps: {appConfig: mockConfig.app}
                }
            )

            const registerButton = screen.getByText('Register Passkey')
            await user.click(registerButton)

            await waitFor(() => {
                expect(otpVerificationHandler).toBeTruthy()
            })

            const result = await otpVerificationHandler(otpCode)

            expect(result).toEqual({
                success: false,
                error: 'Invalid token, please try again.'
            })
        })
    })
})
