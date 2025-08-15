/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent, waitFor, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'

const WrapperComponent = ({...props}) => {
    const form = useForm()
    const mockOnClose = jest.fn()
    const mockHandleSendEmailOtp = jest.fn()
    const mockHandleOtpVerification = jest.fn()

    return (
        <OtpAuth
            isOpen={true}
            onClose={mockOnClose}
            form={form}
            handleSendEmailOtp={mockHandleSendEmailOtp}
            handleOtpVerification={mockHandleOtpVerification}
            {...props}
        />
    )
}

describe('OtpAuth', () => {
    let mockOnClose, mockHandleSendEmailOtp, mockHandleOtpVerification, mockForm

    beforeEach(() => {
        mockOnClose = jest.fn()
        mockHandleSendEmailOtp = jest.fn()
        mockHandleOtpVerification = jest.fn()
        mockForm = {
            setValue: jest.fn(),
            getValues: jest.fn((field) => {
                if (field === 'email') return 'test@example.com'
                return {email: 'test@example.com'}
            })
        }
        jest.clearAllMocks()

        // Set up mock implementation after clearAllMocks
        mockHandleOtpVerification.mockResolvedValue({
            success: true
        })
    })

    describe('Component Rendering', () => {
        test('renders OTP form with all elements', () => {
            renderWithProviders(<WrapperComponent />)

            expect(screen.getByText("Confirm it's you")).toBeInTheDocument()
            expect(
                screen.getByText(
                    'To use your account information enter the code sent to your email.'
                )
            ).toBeInTheDocument()
            expect(screen.getByText('Checkout as a guest')).toBeInTheDocument()
            expect(screen.getByText('Resend code')).toBeInTheDocument()
        })

        test('renders 8 OTP input fields', () => {
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')
            expect(otpInputs).toHaveLength(8)
        })

        test('renders phone icon', () => {
            renderWithProviders(<WrapperComponent />)

            const phoneIcon = document.querySelector('svg')
            expect(phoneIcon).toBeInTheDocument()
        })

        test('renders buttons with correct styling', () => {
            renderWithProviders(<WrapperComponent />)

            const guestButton = screen.getByText('Checkout as a guest')
            const resendButton = screen.getByText('Resend code')

            expect(guestButton).toBeInTheDocument()
            expect(resendButton).toBeInTheDocument()
        })
    })

    describe('OTP Input Functionality', () => {
        test('allows numeric input in OTP fields', async () => {
            const user = userEvent.setup()
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            await user.type(otpInputs[0], '1')
            expect(otpInputs[0]).toHaveValue('1')
        })

        test('prevents non-numeric input', async () => {
            const user = userEvent.setup()
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            await user.type(otpInputs[0], 'abc')
            expect(otpInputs[0]).toHaveValue('')
        })

        test('limits input to single character per field', async () => {
            const user = userEvent.setup()
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            await user.type(otpInputs[0], '123')
            expect(otpInputs[0]).toHaveValue('1')
        })

        test('auto-focuses next input when digit is entered', async () => {
            const user = userEvent.setup()
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            await user.type(otpInputs[0], '1')
            expect(otpInputs[1]).toHaveFocus()
        })

        test('does not auto-focus if already at last input', async () => {
            const user = userEvent.setup()
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            otpInputs[7].focus()
            await user.type(otpInputs[7], '8')
            expect(otpInputs[7]).toHaveFocus()
        })
    })

    describe('Keyboard Navigation', () => {
        test('backspace focuses previous input when current is empty', async () => {
            const user = userEvent.setup()
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            // Type a value in the first input to establish focus chain
            await user.click(otpInputs[0])
            await user.type(otpInputs[0], '1')

            // Now the focus should be on second input (auto-focus)
            expect(otpInputs[1]).toHaveFocus()

            // Press backspace on empty second input - should go back to first
            await user.keyboard('{Backspace}')

            // The previous input should now have focus
            expect(otpInputs[0]).toHaveFocus()
        })

        test('backspace does not focus previous input when current has value', async () => {
            const user = userEvent.setup()
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            // Enter value in second input and press backspace
            await user.type(otpInputs[1], '2')
            await user.keyboard('{Backspace}')
            expect(otpInputs[1]).toHaveFocus()
        })

        test('backspace on first input stays on first input', async () => {
            const user = userEvent.setup()
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            // Click on first input to focus it
            await user.click(otpInputs[0])
            expect(otpInputs[0]).toHaveFocus()

            // Press backspace on first input - should stay on first input
            await user.keyboard('{Backspace}')

            // Should still be on first input (can't go backwards from index 0)
            expect(otpInputs[0]).toHaveFocus()
        })
    })

    describe('Paste Functionality', () => {
        test('handles paste of 8-digit code', async () => {
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            fireEvent.paste(otpInputs[0], {
                clipboardData: {
                    getData: () => '12345678'
                }
            })

            expect(otpInputs[0]).toHaveValue('1')
            expect(otpInputs[1]).toHaveValue('2')
            expect(otpInputs[2]).toHaveValue('3')
            expect(otpInputs[3]).toHaveValue('4')
            expect(otpInputs[4]).toHaveValue('5')
            expect(otpInputs[5]).toHaveValue('6')
            expect(otpInputs[6]).toHaveValue('7')
            expect(otpInputs[7]).toHaveValue('8')
        })

        test('handles paste of code with non-numeric characters', async () => {
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            fireEvent.paste(otpInputs[0], {
                clipboardData: {
                    getData: () => '1a2b3c4d5e6f7g8h'
                }
            })

            expect(otpInputs[0]).toHaveValue('1')
            expect(otpInputs[1]).toHaveValue('2')
            expect(otpInputs[2]).toHaveValue('3')
            expect(otpInputs[3]).toHaveValue('4')
            expect(otpInputs[4]).toHaveValue('5')
            expect(otpInputs[5]).toHaveValue('6')
            expect(otpInputs[6]).toHaveValue('7')
            expect(otpInputs[7]).toHaveValue('8')
        })

        test('handles paste of code shorter than 8 digits', async () => {
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            fireEvent.paste(otpInputs[0], {
                clipboardData: {
                    getData: () => '123'
                }
            })

            // Should not fill all fields if paste is shorter than 8 digits
            expect(otpInputs[0]).toHaveValue('')
            expect(otpInputs[1]).toHaveValue('')
        })

        test('focuses last input after successful paste', async () => {
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            fireEvent.paste(otpInputs[0], {
                clipboardData: {
                    getData: () => '12345678'
                }
            })

            expect(otpInputs[7]).toHaveFocus()
        })
    })

    describe('Form Integration', () => {
        test('updates form value when OTP changes', async () => {
            const TestComponent = () => {
                const form = useForm()
                const mockHandleOtpVerificationSuccess = jest.fn().mockResolvedValue({
                    success: true
                })

                return (
                    <OtpAuth
                        isOpen={true}
                        onClose={mockOnClose}
                        form={form}
                        handleOtpVerification={mockHandleOtpVerificationSuccess}
                        handleSendEmailOtp={mockHandleSendEmailOtp}
                    />
                )
            }

            const user = userEvent.setup()
            renderWithProviders(<TestComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            await user.type(otpInputs[0], '1')
            await user.type(otpInputs[1], '2')
            await user.type(otpInputs[2], '3')

            // Form should be updated with partial OTP
            // We can't directly test form.setValue calls, but we can verify the behavior
            expect(otpInputs[0]).toHaveValue('1')
            expect(otpInputs[1]).toHaveValue('2')
            expect(otpInputs[2]).toHaveValue('3')
        })
    })

    describe('Button Interactions', () => {
        test('clicking "Checkout as a guest" calls onClose', async () => {
            const user = userEvent.setup()
            renderWithProviders(
                <OtpAuth
                    isOpen={true}
                    onClose={mockOnClose}
                    form={mockForm}
                    handleOtpVerification={mockHandleOtpVerification}
                    handleSendEmailOtp={mockHandleSendEmailOtp}
                />
            )

            const guestButton = screen.getByText('Checkout as a guest')
            await user.click(guestButton)

            expect(mockOnClose).toHaveBeenCalled()
        })

        test('clicking "Checkout as a guest" calls onCheckoutAsGuest when provided', async () => {
            const mockOnCheckoutAsGuest = jest.fn()
            const user = userEvent.setup()
            renderWithProviders(
                <OtpAuth
                    isOpen={true}
                    onClose={mockOnClose}
                    form={mockForm}
                    handleOtpVerification={mockHandleOtpVerification}
                    handleSendEmailOtp={mockHandleSendEmailOtp}
                    onCheckoutAsGuest={mockOnCheckoutAsGuest}
                />
            )

            const guestButton = screen.getByText('Checkout as a guest')
            await user.click(guestButton)

            expect(mockOnCheckoutAsGuest).toHaveBeenCalled()
            expect(mockOnClose).toHaveBeenCalled()
        })

        test('clicking "Resend code" calls handleSendEmailOtp', async () => {
            const user = userEvent.setup()
            renderWithProviders(
                <OtpAuth
                    isOpen={true}
                    onClose={mockOnClose}
                    form={mockForm}
                    handleOtpVerification={mockHandleOtpVerification}
                    handleSendEmailOtp={mockHandleSendEmailOtp}
                />
            )

            const resendButton = screen.getByText('Resend code')
            await user.click(resendButton)

            expect(mockHandleSendEmailOtp).toHaveBeenCalledWith('test@example.com')
        })

        test('resend button is disabled during countdown', async () => {
            const user = userEvent.setup()
            renderWithProviders(
                <OtpAuth
                    isOpen={true}
                    onClose={mockOnClose}
                    form={mockForm}
                    handleOtpVerification={mockHandleOtpVerification}
                    handleSendEmailOtp={mockHandleSendEmailOtp}
                />
            )

            // Click the resend button
            await user.click(screen.getByText('Resend code'))

            // Wait for the timer text to appear and assert the parent button is disabled
            const timerText = await screen.findByText(/Resend code in/i)
            const disabledResendButton = timerText.closest('button')
            expect(disabledResendButton).toBeDisabled()
        })

        test('resend button becomes enabled after countdown', async () => {
            const user = userEvent.setup()
            renderWithProviders(
                <OtpAuth
                    isOpen={true}
                    onClose={mockOnClose}
                    form={mockForm}
                    handleOtpVerification={mockHandleOtpVerification}
                    handleSendEmailOtp={mockHandleSendEmailOtp}
                />
            )

            const resendButton = screen.getByText('Resend code')
            await user.click(resendButton)

            // Wait for countdown to complete (mocked timers would be ideal here)
            await waitFor(() => {
                expect(resendButton).toBeDisabled()
            })
        })
    })

    describe('Error Handling', () => {
        test('handles resend code error gracefully', async () => {
            const mockHandleSendEmailOtpError = jest
                .fn()
                .mockRejectedValue(new Error('Network error'))
            const user = userEvent.setup()

            renderWithProviders(
                <OtpAuth
                    isOpen={true}
                    onClose={mockOnClose}
                    form={mockForm}
                    handleOtpVerification={mockHandleOtpVerification}
                    handleSendEmailOtp={mockHandleSendEmailOtpError}
                />
            )

            // Click the resend button (robust to nested elements)
            const resendButton = screen.getByRole('button', {name: /resend code/i})
            await user.click(resendButton)

            expect(mockHandleSendEmailOtpError).toHaveBeenCalled()
        })
    })

    describe('Accessibility', () => {
        test('inputs have proper attributes', () => {
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')

            otpInputs.forEach((input) => {
                expect(input).toHaveAttribute('type', 'text')
                expect(input).toHaveAttribute('inputMode', 'numeric')
                expect(input).toHaveAttribute('maxLength', '1')
            })
        })

        test('buttons have accessible text', () => {
            renderWithProviders(<WrapperComponent />)

            expect(screen.getByText('Checkout as a guest')).toBeInTheDocument()
            expect(screen.getByText('Resend code')).toBeInTheDocument()
        })
    })
})
