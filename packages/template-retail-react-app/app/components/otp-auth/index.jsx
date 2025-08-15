/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Button,
    Input,
    SimpleGrid,
    Stack,
    Text,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay
} from '../shared/ui'

const OtpAuth = ({ isOpen, onClose, form, handleSendEmailOtp, handleOtpVerification, onCheckoutAsGuest }) => {
    const OTP_LENGTH = 8
    const [otpValues, setOtpValues] = useState(new Array(OTP_LENGTH).fill(''))
    const [resendTimer, setResendTimer] = useState(0)
    const [isVerifying, setIsVerifying] = useState(false)
    const [verificationError, setVerificationError] = useState('')
    const inputRefs = useRef([])

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, OTP_LENGTH)
    }, [])

    // Handle resend timer
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendTimer])

    // Focus first OTP input when modal opens and clear previous values
    useEffect(() => {
        if (isOpen) {
            // Clear previous OTP values
            setOtpValues(new Array(OTP_LENGTH).fill(''))
            setVerificationError('')
            form.setValue('otp', '')

            // Small delay to ensure modal is fully rendered
            const timer = setTimeout(() => {
                inputRefs.current[0]?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen, form])

    // Validation function to check if value contains only digits
    const isNumericValue = (value) => {
        return /^\d*$/.test(value)
    }

    // Function to verify OTP and handle the result
    const verifyOtpCode = async (otpCode) => {
        setIsVerifying(true)
        const result = await handleOtpVerification(otpCode)
        setIsVerifying(false)

        if (result && !result.success) {
            setVerificationError(result.error)
            // Clear the OTP fields so user can try again
            setOtpValues(new Array(OTP_LENGTH).fill(''))
            form.setValue('otp', '')
            // Focus first input
            inputRefs.current[0]?.focus()
        }
    }

    const handleOtpChange = async (index, value) => {
        // Only allow digits
        if (!isNumericValue(value)) return

        // Clear any previous verification error
        setVerificationError('')

        const newOtpValues = [...otpValues]
        newOtpValues[index] = value
        setOtpValues(newOtpValues)

        // Update form value
        const otpString = newOtpValues.join('')
        form.setValue('otp', otpString)

        // Auto-focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // If all digits are entered, automatically verify OTP
        if (otpString.length === OTP_LENGTH && !isVerifying) {
            await verifyOtpCode(otpString)
        }
    }

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = async (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
        if (pastedData.length === OTP_LENGTH) {
            // Clear any previous verification error
            setVerificationError('')

            const newOtpValues = pastedData.split('')
            setOtpValues(newOtpValues)
            form.setValue('otp', pastedData)
            inputRefs.current[7]?.focus()

            // Automatically verify the pasted OTP
            if (!isVerifying) {
                await verifyOtpCode(pastedData)
            }
        }
    }

    const handleResendCode = async () => {
        try {
            // Start countdown immediately to disable the button while request is in-flight
            setResendTimer(5)
            const email = form.getValues('email')
            await handleSendEmailOtp(email)
        } catch (error) {
            // Reset timer so user can try again
            setResendTimer(0)
            console.error('Error resending code:', error)
        }
    }

    const handleCheckoutAsGuest = () => {
        if (onCheckoutAsGuest) {
            onCheckoutAsGuest()
        }
        onClose()
    }

    const isResendDisabled = resendTimer > 0 || isVerifying

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg" closeOnOverlayClick={false}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <FormattedMessage
                        defaultMessage="Confirm it's you"
                        id="otp.title.confirm_its_you"
                    />
                </ModalHeader>
                <ModalCloseButton disabled={isVerifying} />
                <ModalBody pb={6}>
                    <Stack spacing={12} paddingLeft={4} paddingRight={4} alignItems="center">
                        <Text fontSize="md" maxWidth="300px" textAlign="center">
                            <FormattedMessage
                                defaultMessage="To use your account information enter the code sent to your email."
                                id="otp.message.enter_code_for_account"
                            />
                        </Text>

                        {/* OTP Input */}
                        <SimpleGrid columns={OTP_LENGTH} spacing={3}>
                                {otpValues.map((value, index) => (
                                    <Input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        value={value}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        textAlign="center"
                                        fontSize="lg"
                                        fontWeight="bold"
                                        size="lg"
                                        width="48px"
                                        height="56px"
                                        borderRadius="md"
                                        borderColor="gray.300"
                                        borderWidth="2px"
                                        disabled={isVerifying}
                                        _focus={{
                                            borderColor: 'blue.500',
                                            boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                                        }}
                                        _hover={{
                                            borderColor: 'gray.400'
                                        }}
                                    />
                                ))}
                            </SimpleGrid>

                        {/* Loading indicator during verification */}
                        {isVerifying && (
                            <Text fontSize="sm" color="blue.500">
                                <FormattedMessage
                                    defaultMessage="Verifying code..."
                                    id="otp.message.verifying"
                                />
                            </Text>
                        )}

                        {/* Error message */}
                        {verificationError && (
                            <Text fontSize="sm" color="red.500" textAlign="center">
                                {verificationError}
                            </Text>
                        )}

                        {/* Buttons */}
                        <HStack spacing={4} width="100%" justifyContent="center">
                            <Button
                                onClick={handleCheckoutAsGuest}
                                variant="outline"
                                colorScheme="gray"
                                size="lg"
                                minWidth="160px"
                                isDisabled={isVerifying}
                                borderColor="gray.300"
                                color="gray.600"
                                _hover={{
                                    bg: 'gray.50',
                                    borderColor: 'gray.400'
                                }}
                            >
                                <FormattedMessage
                                    defaultMessage="Checkout as a guest"
                                    id="otp.button.checkout_as_guest"
                                />
                            </Button>

                            <Button
                                onClick={handleResendCode}
                                variant="solid"
                                size="lg"
                                colorScheme={isResendDisabled ? 'gray' : 'blue'}
                                bg={isResendDisabled ? 'gray.300' : 'blue.500'}
                                minWidth="160px"
                                isDisabled={isResendDisabled}
                                _hover={isResendDisabled ? {} : {bg: 'blue.600'}}
                                _disabled={{bg: 'gray.300', color: 'gray.600'}}
                            >
                                {resendTimer > 0 ? (
                                    <FormattedMessage
                                        defaultMessage="Resend code in {timer}s"
                                        id="otp.button.resend_timer"
                                        values={{timer: resendTimer}}
                                    />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Resend code"
                                        id="otp.button.resend_code"
                                    />
                                )}
                            </Button>
                        </HStack>
                    </Stack>
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

OtpAuth.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    form: PropTypes.object.isRequired,
    handleSendEmailOtp: PropTypes.func.isRequired,
    handleOtpVerification: PropTypes.func.isRequired,
    onCheckoutAsGuest: PropTypes.func
}

export default OtpAuth
