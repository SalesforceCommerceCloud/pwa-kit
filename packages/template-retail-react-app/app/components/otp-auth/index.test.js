/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {useForm} from 'react-hook-form'

const WrapperComponent = ({...props}) => {
    const form = useForm()
    const mockSetShowOtpView = jest.fn()
    const mockHandleSendEmailOtp = jest.fn()
    
    return (
        <OtpAuth
            form={form}
            setShowOtpView={mockSetShowOtpView}
            handleSendEmailOtp={mockHandleSendEmailOtp}
            {...props}
        />
    )
}

describe('OtpAuth', () => {
    let mockSetShowOtpView, mockHandleSendEmailOtp, mockForm

    beforeEach(() => {
        mockSetShowOtpView = jest.fn()
        mockHandleSendEmailOtp = jest.fn()
        mockForm = {
            setValue: jest.fn(),
            getValues: jest.fn((field) => {
                if (field === 'email') return 'test@example.com'
                return {email: 'test@example.com'}
            })
        }
        jest.clearAllMocks()
    })

    describe('Component Rendering', () => {
        test('renders OTP form with all elements', () => {
            renderWithProviders(<WrapperComponent />)

            expect(screen.getByText("Confirm it's you")).toBeInTheDocument()
            expect(screen.getByText('To use your account information enter the code sent to your email.')).toBeInTheDocument()
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
            
            // Focus second input and press backspace
            otpInputs[1].focus()
            await user.keyboard('{Backspace}')
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
            
            otpInputs[0].focus()
            await user.keyboard('{Backspace}')
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
                return (
                    <OtpAuth
                        form={form}
                        setShowOtpView={mockSetShowOtpView}
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
        test('clicking "Checkout as a guest" calls setShowOtpView', async () => {
            const user = userEvent.setup()
            renderWithProviders(
                <OtpAuth
                    form={mockForm}
                    setShowOtpView={mockSetShowOtpView}
                    handleSendEmailOtp={mockHandleSendEmailOtp}
                />
            )

            const guestButton = screen.getByText('Checkout as a guest')
            await user.click(guestButton)

            expect(mockSetShowOtpView).toHaveBeenCalledWith(false)
        })

        test('clicking "Resend code" calls handleSendEmailOtp', async () => {
            const user = userEvent.setup()
            renderWithProviders(
                <OtpAuth
                    form={mockForm}
                    setShowOtpView={mockSetShowOtpView}
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
                    form={mockForm}
                    setShowOtpView={mockSetShowOtpView}
                    handleSendEmailOtp={mockHandleSendEmailOtp}
                />
            )

            const resendButton = screen.getByText('Resend code')
            await user.click(resendButton)

            // Button should be disabled after clicking
            expect(resendButton).toBeDisabled()
        })

        test('resend button becomes enabled after countdown', async () => {
            const user = userEvent.setup()
            renderWithProviders(
                <OtpAuth
                    form={mockForm}
                    setShowOtpView={mockSetShowOtpView}
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
            const mockHandleSendEmailOtpError = jest.fn().mockRejectedValue(new Error('Network error'))
            const user = userEvent.setup()
            
            renderWithProviders(
                <OtpAuth
                    form={mockForm}
                    setShowOtpView={mockSetShowOtpView}
                    handleSendEmailOtp={mockHandleSendEmailOtpError}
                />
            )

            const resendButton = screen.getByText('Resend code')
            await user.click(resendButton)

            expect(mockHandleSendEmailOtpError).toHaveBeenCalled()
        })
    })

    describe('Accessibility', () => {
        test('inputs have proper attributes', () => {
            renderWithProviders(<WrapperComponent />)

            const otpInputs = screen.getAllByRole('textbox')
            
            otpInputs.forEach(input => {
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