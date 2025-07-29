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
    Heading, 
    Icon, 
    Flex, 
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay
} from '../shared/ui'
import {PhoneIcon} from '@chakra-ui/icons'

const OtpAuth = ({isOpen, onClose, form, setShowOtpView, handleSendEmailOtp, handleOtpVerification}) => {
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '', '', ''])
    const [resendTimer, setResendTimer] = useState(0)
    const [isVerifying, setIsVerifying] = useState(false)
    const [verificationError, setVerificationError] = useState('')
    const inputRefs = useRef([])

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, 8)
    }, [])

    // Handle resend timer
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendTimer])

    const handleOtpChange = async (index, value) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return

        // Clear any previous verification error
        setVerificationError('')

        const newOtpValues = [...otpValues]
        newOtpValues[index] = value
        setOtpValues(newOtpValues)

        // Update form value
        const otpString = newOtpValues.join('')
        form.setValue('otp', otpString)

        // Auto-focus next input
        if (value && index < 7) {
            inputRefs.current[index + 1]?.focus()
        }

        // If all 8 digits are entered, automatically verify OTP
        if (otpString.length === 8 && !isVerifying) {
            setIsVerifying(true)
            const result = await handleOtpVerification(otpString)
            setIsVerifying(false)
            
            if (!result.success) {
                setVerificationError(result.error)
                // Clear the OTP fields so user can try again
                setOtpValues(['', '', '', '', '', '', '', ''])
                form.setValue('otp', '')
                // Focus first input
                inputRefs.current[0]?.focus()
            }
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
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
        if (pastedData.length === 8) {
            // Clear any previous verification error
            setVerificationError('')
            
            const newOtpValues = pastedData.split('')
            setOtpValues(newOtpValues)
            form.setValue('otp', pastedData)
            inputRefs.current[7]?.focus()
            
            // Automatically verify the pasted OTP
            if (!isVerifying) {
                setIsVerifying(true)
                const result = await handleOtpVerification(pastedData)
                setIsVerifying(false)
                
                if (!result.success) {
                    setVerificationError(result.error)
                    // Clear the OTP fields so user can try again
                    setOtpValues(['', '', '', '', '', '', '', ''])
                    form.setValue('otp', '')
                    // Focus first input
                    inputRefs.current[0]?.focus()
                }
            }
        }
    }

    const handleResendCode = async () => {
        try {
            const email = form.getValues('email')
            await handleSendEmailOtp(email)
            setResendTimer(60) // Start 60 second countdown
        } catch (error) {
            console.error('Error resending code:', error)
        }
    }

    const handleCheckoutAsGuest = () => {
        setShowOtpView(false)
        onClose()
    }

    return (
        <Modal 
            isOpen={isOpen} 
            isCentered
            size="lg"
            closeOnOverlayClick={false}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <FormattedMessage
                        defaultMessage="Email Verification"
                        id="otp_modal.header.email_verification"
                    />
                </ModalHeader>
                <ModalCloseButton onClick={onClose} disabled={isVerifying} />
                <ModalBody pb={6}>
                    <Stack spacing={8} paddingLeft={4} paddingRight={4} alignItems="center">
                        {/* Header with title */}
                        <Stack spacing={6} alignItems="center" textAlign="center">
                            <Heading fontSize="2xl" fontWeight="normal" color="gray.700">
                                <FormattedMessage
                                    defaultMessage="Confirm it's you"
                                    id="otp.title.confirm_its_you"
                                />
                            </Heading>

                            <Text fontSize="md" color="gray.600" maxWidth="300px">
                                <FormattedMessage
                                    defaultMessage="To use your account information enter the code sent to your email."
                                    id="otp.message.enter_code_for_account"
                                />
                            </Text>
                        </Stack>

                        {/* OTP Input with Phone Icon */}
                        <Flex alignItems="center" spacing={4}>
                            <Icon as={PhoneIcon} color="blue.500" boxSize={5} mr={4} />
                            <SimpleGrid columns={8} spacing={3}>
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
                        </Flex>

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
                                disabled={isVerifying}
                                borderColor="gray.300"
                                color="gray.600"
                                _hover={{
                                    backgroundColor: "gray.50",
                                    borderColor: "gray.400"
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
                                colorScheme="blue"
                                backgroundColor="blue.500"
                                minWidth="160px"
                                disabled={resendTimer > 0 || isVerifying}
                                _hover={{
                                    backgroundColor: "blue.600"
                                }}
                                _disabled={{
                                    backgroundColor: "gray.300",
                                    color: "gray.500"
                                }}
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
    setShowOtpView: PropTypes.func.isRequired,
    handleSendEmailOtp: PropTypes.func.isRequired,
    handleOtpVerification: PropTypes.func.isRequired
}

export default OtpAuth
