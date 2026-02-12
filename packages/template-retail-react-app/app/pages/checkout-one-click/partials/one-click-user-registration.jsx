/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef, useState, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Box,
    Checkbox,
    Stack,
    Text,
    Heading,
    Badge,
    HStack,
    useDisclosure,
    Portal,
    Spinner,
    Center
} from '@salesforce/retail-react-app/app/components/shared/ui'
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCustomerType, useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {nanoid} from 'nanoid'

export default function UserRegistration({
    enableUserRegistration,
    setEnableUserRegistration,
    isGuestCheckout = false,
    isDisabled = false,
    onSavePreferenceChange,
    onRegistered,
    showNotice = false,
    onLoadingChange
}) {
    const {data: basket} = useCurrentBasket()
    const {contactPhone} = useCheckout()
    const {isGuest} = useCustomerType()
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const loginPasswordless = useAuthHelper(AuthHelpers.LoginPasswordlessUser)
    const {locale} = useMultiSite()
    const {formatMessage} = useIntl()
    const showToast = useToast()
    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateCustomer = useShopperCustomersMutation('updateCustomer')

    const {isOpen: isOtpOpen, onOpen: onOtpOpen, onClose: onOtpClose} = useDisclosure()
    const otpSentRef = useRef(false)
    const [registrationSucceeded, setRegistrationSucceeded] = useState(false)
    const [isLoadingOtp, setIsLoadingOtp] = useState(false)

    const showError = (message) => {
        showToast({
            title: message,
            status: 'error'
        })
    }

    const handleOtpClose = () => {
        otpSentRef.current = false
        onOtpClose()
    }

    const handleUserRegistrationChange = async (e) => {
        const checked = e.target.checked
        setEnableUserRegistration(checked)
        // Treat opting into registration as opting to save for future
        if (onSavePreferenceChange) onSavePreferenceChange(checked)
        // If user unchecks, allow OTP to be re-triggered upon re-check
        if (!checked) {
            otpSentRef.current = false
            setIsLoadingOtp(false)
            if (onLoadingChange) onLoadingChange(false)
        }
        // Kick off OTP for guests when they opt in
        if (checked && isGuest && basket?.customerInfo?.email && !otpSentRef.current) {
            setIsLoadingOtp(true)
            if (onLoadingChange) onLoadingChange(true)
            try {
                await authorizePasswordlessLogin.mutateAsync({
                    userid: basket.customerInfo.email,
                    mode: 'email',
                    locale: locale?.id,
                    register_customer: true,
                    last_name: basket.customerInfo.email,
                    email: basket.customerInfo.email
                })
                otpSentRef.current = true
                onOtpOpen()
            } catch (_e) {
                // Silent failure; user can continue as guest
                setIsLoadingOtp(false)
                if (onLoadingChange) onLoadingChange(false)
            }
        }
    }

    // Clear loading state when OTP modal opens
    useEffect(() => {
        if (isOtpOpen && isLoadingOtp) {
            setIsLoadingOtp(false)
            if (onLoadingChange) onLoadingChange(false)
        }
    }, [isOtpOpen, isLoadingOtp, onLoadingChange])

    const saveAddressesAndPhoneToProfile = async (customerId) => {
        if (!basket || !customerId) return
        const deliveryShipments =
            basket.shipments?.filter(
                (shipment) => !isPickupShipment(shipment) && shipment.shippingAddress
            ) || []
        try {
            if (deliveryShipments.length > 0) {
                for (let i = 0; i < deliveryShipments.length; i++) {
                    const shipment = deliveryShipments[i]
                    const shipping = shipment.shippingAddress
                    if (!shipping) continue

                    const {
                        address1,
                        address2,
                        city,
                        countryCode,
                        firstName,
                        lastName,
                        phone,
                        postalCode,
                        stateCode
                    } = shipping || {}

                    await createCustomerAddress.mutateAsync({
                        parameters: {customerId},
                        body: {
                            addressId: nanoid(),
                            preferred: i === 0,
                            address1,
                            address2,
                            city,
                            countryCode,
                            firstName,
                            lastName,
                            phone,
                            postalCode,
                            stateCode
                        }
                    })
                }
            }

            const phoneHome = basket.billingAddress?.phone || contactPhone
            if (phoneHome) {
                await updateCustomer.mutateAsync({
                    parameters: {customerId},
                    body: {phoneHome}
                })
            }
        } catch (_e) {
            showError(
                formatMessage({
                    id: 'checkout.error.cannot_save_address',
                    defaultMessage: 'Could not save shipping address.'
                })
            )
        }
    }

    const handleOtpVerification = async (otpCode) => {
        try {
            const token = await loginPasswordless.mutateAsync({
                pwdlessLoginToken: otpCode,
                register_customer: true
            })

            const customerId = token?.customer_id || token?.customerId
            if (customerId && basket) {
                await saveAddressesAndPhoneToProfile(customerId)
            }

            if (onRegistered) {
                await onRegistered(basket?.basketId)
            }
            handleOtpClose()
            setRegistrationSucceeded(true)
        } catch (_e) {
            // Let OtpAuth surface errors via its own UI/toast
        }
        return {success: true}
    }

    // Hide the form if the "Checkout as Guest" button was clicked
    if (isGuestCheckout) {
        return null
    }

    // After successful registration (local) or when parent instructs to show, render notice
    if (registrationSucceeded || showNotice) {
        return (
            <Box
                border="1px solid"
                borderColor="gray.200"
                rounded="md"
                p={4}
                data-testid="sf-account-creation-notification"
            >
                <HStack justify="space-between" align="start" mb={2}>
                    <Heading fontSize="lg" lineHeight="30px">
                        <FormattedMessage
                            defaultMessage="Account Created"
                            id="account_creation_notification.title"
                        />
                    </Heading>
                    <Badge
                        colorScheme="green"
                        fontSize="0.9em"
                        px={3}
                        py={1}
                        rounded="md"
                        aria-label="Verified"
                    >
                        <FormattedMessage
                            defaultMessage="Verified"
                            id="account_creation_notification.verified"
                        />
                    </Badge>
                </HStack>
                <Stack spacing={2}>
                    <Text color="gray.700">
                        <FormattedMessage
                            defaultMessage="We’ve created and verified your account using the information from your order. Next time you check out, just enter the code we send to log in — no password needed."
                            id="account_creation_notification.body"
                        />
                    </Text>
                </Stack>
            </Box>
        )
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
                            defaultMessage="Save Checkout Info for Future Use"
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
                                    defaultMessage="Create an account to check out faster"
                                    id="checkout.label.user_registration"
                                />
                            </Text>
                            {enableUserRegistration && (
                                <Text fontSize="sm" color="gray.500">
                                    <FormattedMessage
                                        defaultMessage="Your payment, address, and contact information will be saved in a new account. Use the emailed one-time password (OTP) to create your account. After creating your account, use the Forgot Password function to set a new password."
                                        id="checkout.message.user_registration"
                                    />
                                </Text>
                            )}
                        </Stack>
                    </Checkbox>
                </Stack>
            </Box>

            {/* Loading overlay when OTP is being initialized */}
            {isLoadingOtp && (
                <Portal>
                    <Box
                        position="fixed"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        bg="blackAlpha.600"
                        zIndex={9999}
                        data-testid="sf-otp-loading-overlay"
                    >
                        <Center h="100%">
                            <Spinner size="xl" color="white" thickness="4px" />
                        </Center>
                    </Box>
                </Portal>
            )}

            {/* OTP modal lives with registration now */}
            <OtpAuth
                isOpen={isOtpOpen}
                onClose={handleOtpClose}
                isGuestRegistration
                form={{
                    getValues: (name) =>
                        name === 'email' ? basket?.customerInfo?.email : undefined,
                    setValue: () => {}
                }}
                handleSendEmailOtp={async (email) => {
                    return authorizePasswordlessLogin.mutateAsync({
                        userid: email,
                        mode: 'email',
                        locale: locale?.id,
                        register_customer: true,
                        last_name: email,
                        email
                    })
                }}
                handleOtpVerification={handleOtpVerification}
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
    onRegistered: PropTypes.func,
    /** When true, forces the success notice to show (e.g., after component would normally unmount) */
    showNotice: PropTypes.bool,
    /** Callback when loading state changes (for disabling Place Order button) */
    onLoadingChange: PropTypes.func
}
