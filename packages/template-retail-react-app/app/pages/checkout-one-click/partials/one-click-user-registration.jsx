/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef} from 'react'
import {FormattedMessage} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Checkbox,
    Stack,
    Text,
    Heading,
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCustomerType, useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import useBasketRecovery from '@salesforce/retail-react-app/app/hooks/use-basket-recovery'

export default function UserRegistration({
    enableUserRegistration,
    setEnableUserRegistration,
    isGuestCheckout = false,
    isDisabled = false,
    onSavePreferenceChange,
    onRegistered
}) {
    const {data: basket} = useCurrentBasket()
    const {isGuest} = useCustomerType()
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const loginPasswordless = useAuthHelper(AuthHelpers.LoginPasswordlessUser)
    const auth = useAuthContext()
    const {recoverBasketAfterAuth} = useBasketRecovery()
    const appOrigin = useAppOrigin()
    const passwordlessConfigCallback = getConfig().app.login?.passwordless?.callbackURI
    const callbackURL = isAbsoluteURL(passwordlessConfigCallback)
        ? passwordlessConfigCallback
        : `${appOrigin}${passwordlessConfigCallback}`
    const {isOpen: isOtpOpen, onOpen: onOtpOpen, onClose: onOtpClose} = useDisclosure()
    const otpSentRef = useRef(false)
    const handleUserRegistrationChange = async (e) => {
        const checked = e.target.checked
        setEnableUserRegistration(checked)
        // Treat opting into registration as opting to save for future
        if (onSavePreferenceChange) onSavePreferenceChange(checked)
        // Kick off OTP for guests when they opt in
        if (checked && isGuest && basket?.customerInfo?.email && !otpSentRef.current) {
            try {
                await authorizePasswordlessLogin.mutateAsync({
                    userid: basket.customerInfo.email,
                    callbackURI: `${callbackURL}?mode=otp_email`,
                    register_customer: true,
                    last_name: basket.customerInfo.email,
                    email: basket.customerInfo.email
                })
                otpSentRef.current = true
                onOtpOpen()
            } catch (_e) {
                // Silent failure; user can continue as guest
            }
        }
    }

    // Hide the form if the "Checkout as Guest" button was clicked
    if (isGuestCheckout) {
        return null
    }

    // Hide the form if the "Checkout as Guest" button was clicked
    if (isGuestCheckout) {
        return null
    }

    // Hide the form if the "Checkout as Guest" button was clicked
    if (isGuestCheckout) {
        return null
    }

    return (
        <>
            <Box
                border="1px solid"
                borderColor="gray.200"
                rounded="md"
                p={4}
                data-testid="sf-user-registration-content"
            >
                <Stack spacing={2}>
                    <Heading fontSize="lg" lineHeight="30px" tabIndex="0">
                        <FormattedMessage
                            defaultMessage="Save for Future Use"
                            id="checkout.title.user_registration"
                        />
                    </Heading>
                    <Checkbox
                        name="userRegistration"
                        isChecked={enableUserRegistration}
                        onChange={handleUserRegistrationChange}
                        isDisabled={isDisabled}
                        alignItems="flex-start"
                    >
                        <Stack spacing={1}>
                            <Text>
                                <FormattedMessage
                                    defaultMessage="Create an account for a faster checkout"
                                    id="checkout.label.user_registration"
                                />
                            </Text>
                            {enableUserRegistration && (
                                <Text fontSize="sm" color="gray.500">
                                    <FormattedMessage
                                        defaultMessage="When you place your order, we create an account for you and save your payment information and other details for future purchases. During your next checkout, confirm your account using the code we'll send to you."
                                        id="checkout.message.user_registration"
                                    />
                                </Text>
                            )}
                        </Stack>
                    </Checkbox>
                </Stack>
            </Box>

            {/* OTP modal lives with registration now */}
            <OtpAuth
                isOpen={isOtpOpen}
                onClose={onOtpClose}
                form={{
                    getValues: (name) =>
                        name === 'email' ? basket?.customerInfo?.email : undefined,
                    setValue: () => {}
                }}
                handleSendEmailOtp={async (email) => {
                    return authorizePasswordlessLogin.mutateAsync({
                        userid: email,
                        callbackURI: `${callbackURL}?mode=otp_email`,
                        register_customer: true,
                        last_name: email,
                        email
                    })
                }}
                handleOtpVerification={async (otpCode) => {
                    try {
                        await loginPasswordless.mutateAsync({
                            pwdlessLoginToken: otpCode,
                            register_customer: true
                        })
                        const newBasketId = await recoverBasketAfterAuth({
                            preLoginItems: basket?.productItems || [],
                            shipment: basket?.shipments?.[0] || null,
                            doMerge: true
                        })
                        if (onRegistered) {
                            await onRegistered(newBasketId)
                        }
                        onOtpClose()
                    } catch (_e) {
                        // Let OtpAuth surface errors via its own UI/toast
                    }
                    return {success: true}
                }}
            />
        </>
    )
}

UserRegistration.propTypes = {
    /** Whether user registration is enabled */
    enableUserRegistration: PropTypes.bool,
    /** Callback to set user registration state */
    setEnableUserRegistration: PropTypes.func,
    /** Whether the "Checkout as Guest" button was clicked */
    isGuestCheckout: PropTypes.bool,
    /** Disable the registration checkbox (e.g., until payment info is filled) */
    isDisabled: PropTypes.bool,
    /** Callback to set save-for-future preference */
    onSavePreferenceChange: PropTypes.func,
    onRegistered: PropTypes.func
}
