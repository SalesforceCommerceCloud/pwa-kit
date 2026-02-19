/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Button,
    Input,
    SimpleGrid,
    Spinner,
    Stack,
    Text,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay
} from '@salesforce/retail-react-app/app/components/shared/ui'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useUsid, useCustomerType, useDNT} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useOtpInputs} from '@salesforce/retail-react-app/app/hooks/use-otp-inputs'
import {useCountdown} from '@salesforce/retail-react-app/app/hooks/use-countdown'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const OtpAuth = ({
    isOpen,
    onClose,
    form,
    handleSendEmailOtp,
    handleOtpVerification,
    onCheckoutAsGuest,
    isGuestRegistration = false,
    hideCheckoutAsGuestButton = false,
    resendCooldownDuration = 30
}) => {
    const {tokenLength} = getConfig().app.login
    const parsedLength = Number(tokenLength)
    const isValidOtpLength = parsedLength === 6 || parsedLength === 8
    const OTP_LENGTH = isValidOtpLength ? parsedLength : 8

    if (!isValidOtpLength) {
        console.warn(
            `Invalid OTP token length: ${tokenLength}. Expected 6 or 8. Defaulting to ${OTP_LENGTH}.`
        )
    }

    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState('')
    const [resendTimer, setResendTimer] = useCountdown(0)

    // Privacy-aware user identification hooks
    const {getUsidWhenReady} = useUsid()
    const {isRegistered} = useCustomerType()
    const {data: customer} = useCurrentCustomer()
    const {effectiveDnt} = useDNT()

    // Einstein tracking
    const {sendViewPage} = useEinstein()

    // Get privacy-compliant user identifier
    const getUserIdentifier = async () => {
        // Respect Do Not Track
        if (effectiveDnt) {
            return '__DNT__'
        }
        // Use customer ID for registered users
        if (isRegistered && customer?.customerId) {
            return customer.customerId
        }
        // Use USID for guest users
        const usid = await getUsidWhenReady()
        return usid
    }

    const track = async (path, payload = {}) => {
        const userId = await getUserIdentifier()
        sendViewPage(path, {
            userId,
            userType: isRegistered ? 'registered' : 'guest',
            dntCompliant: effectiveDnt,
            ...payload
        })
    }

    const otpInputs = useOtpInputs(OTP_LENGTH, (code) => {
        if (code.length === OTP_LENGTH) {
            handleVerify(code)
        }
    })

    useEffect(() => {
        if (isOpen) {
            otpInputs.clear()
            setError('')
            form.setValue('otp', '')
            // Start resend cooldown when modal opens
            setResendTimer(resendCooldownDuration)

            // Track OTP modal view activity
            track('/otp-authentication', {
                activity: 'otp_modal_viewed',
                context: 'authentication'
            })

            setTimeout(() => otpInputs.inputRefs.current[0]?.focus(), 100)
        }
    }, [isOpen, resendCooldownDuration])

    const handleVerify = async (code = otpInputs.values.join('')) => {
        if (isVerifying || code.length !== OTP_LENGTH) return

        setIsVerifying(true)
        setError('')

        // Track OTP verification attempt
        track('/otp-verification', {
            activity: 'otp_verification_attempted',
            context: 'authentication',
            otpLength: code.length
        })

        try {
            const result = await handleOtpVerification(code)
            if (result && !result.success) {
                setError(result.error)
                otpInputs.clear()

                // Track failed OTP verification
                track('/otp-verification-failed', {
                    activity: 'otp_verification_failed',
                    context: 'authentication',
                    error: result.error
                })
            }
        } finally {
            setIsVerifying(false)
            // Track successful OTP verification
            track('/otp-verification-success', {
                activity: 'otp_verification_successful',
                context: 'authentication'
            })
        }
    }

    const handleResend = async () => {
        // No action while verifying or during cooldown; button stays visible/enabled
        if (isVerifying || resendTimer > 0) return

        setResendTimer(resendCooldownDuration)
        try {
            await track('/otp-resend', {
                activity: 'otp_code_resent',
                context: 'authentication',
                resendAttempt: true
            })
            await handleSendEmailOtp(form.getValues('email'), true)
        } catch (error) {
            setResendTimer(0)
            await track('/otp-resend-failed', {
                activity: 'otp_resend_failed',
                context: 'authentication',
                error: error.message
            })
            console.error('Error resending code:', error)
        }
    }

    const handleCheckoutAsGuest = async () => {
        if (isVerifying) return

        // Track checkout as guest selection
        await track('/checkout-as-guest', {
            activity: 'checkout_as_guest_selected',
            context: 'otp_authentication',
            userChoice: 'guest_checkout'
        })

        if (onCheckoutAsGuest) {
            onCheckoutAsGuest()
        }
        onClose()
    }

    const handleInputChange = (index, value) => {
        const code = otpInputs.setValue(index, value)
        setError('') // Clear error on user input
        if (typeof code === 'string') {
            form.setValue('otp', code)
            if (code.length === OTP_LENGTH) {
                handleVerify(code)
            }
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg" closeOnOverlayClick={false}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {isGuestRegistration ? (
                        <FormattedMessage
                            defaultMessage="Create an account"
                            id="otp.title.create_account"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="Confirm it's you"
                            id="otp.title.confirm_its_you"
                        />
                    )}
                </ModalHeader>
                <ModalCloseButton disabled={isVerifying} />
                <ModalBody pb={6}>
                    <Stack spacing={12} paddingLeft={4} paddingRight={4} alignItems="center">
                        <Text fontSize="md" maxWidth={80} textAlign="center">
                            {isGuestRegistration ? (
                                <FormattedMessage
                                    defaultMessage="We sent a one-time password (OTP) to your email. To create your account and proceed to checkout, enter the {otpLength}-digit code below."
                                    id="otp.message.enter_code_for_account_guest"
                                    values={{otpLength: OTP_LENGTH}}
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="To log in to your account, enter the code sent to your email."
                                    id="otp.message.enter_code_for_account_returning"
                                />
                            )}
                        </Text>

                        <Stack spacing={6} width="100%" alignItems="center">
                            {/* OTP Input */}
                            <SimpleGrid columns={OTP_LENGTH} spacing={3}>
                                {Array.from({length: OTP_LENGTH}).map((_, index) => (
                                    <Input
                                        key={index}
                                        ref={(el) => (otpInputs.inputRefs.current[index] = el)}
                                        value={otpInputs.values[index]}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        onKeyDown={(e) => otpInputs.handleKeyDown(index, e)}
                                        onPaste={otpInputs.handlePaste}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        textAlign="center"
                                        fontSize="lg"
                                        fontWeight="bold"
                                        size="lg"
                                        width={12}
                                        height={14}
                                        borderRadius="md"
                                        borderColor={error ? 'red.500' : 'gray.300'}
                                        borderWidth={2}
                                        disabled={isVerifying}
                                        _focus={{
                                            borderColor: error ? 'red.500' : 'blue.500',
                                            boxShadow: error
                                                ? '0 0 0 1px var(--chakra-colors-red-500)'
                                                : '0 0 0 1px var(--chakra-colors-blue-500)'
                                        }}
                                        _hover={{
                                            borderColor: error ? 'red.500' : 'gray.400'
                                        }}
                                    />
                                ))}
                            </SimpleGrid>

                            {/* Loading spinner during verification */}
                            {isVerifying && (
                                <Spinner
                                    size="sm"
                                    color="blue.500"
                                    role="status"
                                    aria-live="polite"
                                    data-testid="otp-verifying-spinner"
                                />
                            )}

                            {/* Error message */}
                            {error && (
                                <Text fontSize="sm" color="red.500" textAlign="center">
                                    {error}
                                </Text>
                            )}

                            {/* Countdown message */}
                            {resendTimer > 0 && (
                                <Text fontSize="sm" color="gray.600" textAlign="center">
                                    <FormattedMessage
                                        defaultMessage="You can request a new code in {timer} {timer, plural, one {second} other {seconds}}."
                                        id="otp.message.resend_cooldown"
                                        values={{timer: resendTimer}}
                                    />
                                </Text>
                            )}

                            {/* Buttons */}
                            <HStack spacing={4} width="100%" justifyContent="center">
                                {!hideCheckoutAsGuestButton && (
                                    <Button
                                        onClick={handleCheckoutAsGuest}
                                        variant="solid"
                                        size="lg"
                                        minWidth={40}
                                        isDisabled={isVerifying}
                                        bg="gray.50"
                                        color="gray.800"
                                        fontWeight="bold"
                                        border="none"
                                        _hover={{
                                            bg: 'gray.100'
                                        }}
                                        _active={{
                                            bg: 'gray.200'
                                        }}
                                    >
                                        {isGuestRegistration ? (
                                            <FormattedMessage
                                                defaultMessage="Cancel"
                                                id="otp.button.cancel_guest_registration"
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Checkout as a Guest"
                                                id="otp.button.checkout_as_guest"
                                            />
                                        )}
                                    </Button>
                                )}

                                <Button
                                    onClick={handleResend}
                                    variant="solid"
                                    size="lg"
                                    colorScheme="blue"
                                    bg="blue.500"
                                    minWidth={40}
                                    _hover={{bg: 'blue.600'}}
                                >
                                    <FormattedMessage
                                        defaultMessage="Resend Code"
                                        id="otp.button.resend_code"
                                    />
                                </Button>
                            </HStack>
                        </Stack>
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
    onCheckoutAsGuest: PropTypes.func,
    isGuestRegistration: PropTypes.bool,
    hideCheckoutAsGuestButton: PropTypes.bool,
    /** Resend cooldown (in seconds). Default 30. */
    resendCooldownDuration: PropTypes.number
}

export default OtpAuth
