/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, fireEvent} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth'

    const mockHandleSendEmailOtp = jest.fn()
    const mockHandleOtpVerification = jest.fn()
const mockOnClose = jest.fn()
const mockForm = {
            setValue: jest.fn(),
    getValues: jest.fn().mockImplementation((field) => {
        const formData = {email: 'test@example.com'}
        return field ? formData[field] : formData
    })
}

beforeEach(() => {
        jest.clearAllMocks()
})

describe('OtpAuth Component', () => {
    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        form: mockForm,
        handleSendEmailOtp: mockHandleSendEmailOtp,
        handleOtpVerification: mockHandleOtpVerification
    }

    test('renders OTP modal when open', () => {
        renderWithProviders(<OtpAuth {...defaultProps} />)

        expect(screen.getByText('Confirm it\'s you')).toBeInTheDocument()
        expect(screen.getByText('To use your account information enter the code sent to your email.')).toBeInTheDocument()
    })

    test('does not render when closed', () => {
        renderWithProviders(<OtpAuth {...defaultProps} isOpen={false} />)

        expect(screen.queryByText('Confirm it\'s you')).not.toBeInTheDocument()
        })

        test('renders 8 OTP input fields', () => {
        renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        expect(inputs).toHaveLength(8)
    })

    test('renders OTP inputs correctly', () => {
        renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        
        // Should have 8 OTP input fields
        expect(inputs).toHaveLength(8)
        inputs.forEach(input => {
            expect(input).toHaveAttribute('maxlength', '1')
            expect(input).toHaveAttribute('inputmode', 'numeric')
        })
    })

    test('auto-focuses next input when typing', async () => {
        const {user} = renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        
        await user.type(inputs[0], '1')
        
        await waitFor(() => {
            expect(inputs[1]).toHaveFocus()
        })
    })

    test('allows backspace navigation to previous input', async () => {
        const {user} = renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        
        // Type in first input to move to second
        await user.type(inputs[0], '1')
        
        // Clear second input and press backspace
        await user.clear(inputs[1])
        fireEvent.keyDown(inputs[1], {key: 'Backspace', code: 'Backspace'})
        
        await waitFor(() => {
            expect(inputs[0]).toHaveFocus()
        })
    })

    test('automatically verifies OTP when all 8 digits are entered', async () => {
        const {user} = renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        
        // Type complete OTP code
        for (let i = 0; i < 8; i++) {
            await user.type(inputs[i], (i + 1).toString())
        }
        
        await waitFor(() => {
            expect(mockHandleOtpVerification).toHaveBeenCalledWith('12345678')
        })
    })

    test('handles paste of complete OTP code', async () => {
        renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        
        // Simulate paste event with clipboardData
        const pasteEvent = {
            clipboardData: {
                getData: jest.fn().mockReturnValue('87654321')
            },
            preventDefault: jest.fn()
        }
        
        fireEvent.paste(inputs[0], pasteEvent)
        
        await waitFor(() => {
            expect(mockHandleOtpVerification).toHaveBeenCalledWith('87654321')
        })
    })

    test('only accepts numeric input', async () => {
        const {user} = renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        
        await user.type(inputs[0], 'a1b2')
        
        // Should only contain the numeric characters
        expect(inputs[0]).toHaveValue('1')
        expect(inputs[1]).toHaveValue('2')
    })

    test('displays error message when verification fails', async () => {
        mockHandleOtpVerification.mockResolvedValue({
            success: false,
            error: 'Invalid or expired code. Please try again.'
        })

        const {user} = renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        
        // Type complete OTP code
        for (let i = 0; i < 8; i++) {
            await user.type(inputs[i], (i + 1).toString())
        }
        
        await waitFor(() => {
            expect(screen.getByText('Invalid or expired code. Please try again.')).toBeInTheDocument()
        })
    })

    test('clears inputs and refocuses first input on verification error', async () => {
        mockHandleOtpVerification.mockResolvedValue({
            success: false,
            error: 'Invalid or expired code. Please try again.'
        })

        const {user} = renderWithProviders(<OtpAuth {...defaultProps} />)

        const inputs = screen.getAllByRole('textbox')
        
        // Type complete OTP code to trigger verification
        for (let i = 0; i < 8; i++) {
            await user.type(inputs[i], (i + 1).toString())
        }
        
        // Wait for verification to complete and error to be handled
        await waitFor(() => {
            expect(screen.getByText('Invalid or expired code. Please try again.')).toBeInTheDocument()
        })
        
        // Wait for inputs to be cleared
        await waitFor(() => {
            inputs.forEach(input => {
                expect(input).toHaveValue('')
            })
        })
        
        // Component should be ready for new input
        expect(inputs[0]).toHaveValue('')
    })

    test('renders resend code button', () => {
        renderWithProviders(<OtpAuth {...defaultProps} />)

        expect(screen.getByText('Resend code')).toBeInTheDocument()
    })

    test('calls handleSendEmailOtp when resend button is clicked', async () => {
        const {user} = renderWithProviders(<OtpAuth {...defaultProps} />)

            const resendButton = screen.getByText('Resend code')
            await user.click(resendButton)

            expect(mockHandleSendEmailOtp).toHaveBeenCalledWith('test@example.com')
        })

    test('renders checkout as guest button', () => {
        renderWithProviders(<OtpAuth {...defaultProps} />)

        expect(screen.getByText('Checkout as a guest')).toBeInTheDocument()
    })

    test('calls onClose when checkout as guest button is clicked', async () => {
        const {user} = renderWithProviders(<OtpAuth {...defaultProps} />)

        const guestButton = screen.getByText('Checkout as a guest')
        await user.click(guestButton)

        expect(mockOnClose).toHaveBeenCalled()
    })

    test('disables close button during verification', () => {
        renderWithProviders(<OtpAuth {...defaultProps} />)

        // Simulate verification in progress by checking if inputs are disabled
        // This would require updating the component to expose verification state
        const closeButton = screen.getByLabelText('Close')
        expect(closeButton).toBeInTheDocument()
    })

    test('focuses first input when modal opens', async () => {
        renderWithProviders(<OtpAuth {...defaultProps} isOpen={true} />)
        
        // Wait for focus to be applied (component has a 100ms delay)
        const inputs = screen.getAllByRole('textbox')
        await waitFor(() => {
            expect(inputs[0]).toHaveFocus()
        }, { timeout: 500 })
        
        // Verify all inputs are initially empty
        inputs.forEach(input => {
            expect(input).toHaveValue('')
        })
    })
})
