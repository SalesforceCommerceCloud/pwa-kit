/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef, useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    Button,
    Container,
    InputGroup,
    InputRightElement,
    Spinner,
    Stack,
    Text,
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm} from 'react-hook-form'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    useCheckout,
    setCheckoutGuestChoiceInStorage
} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import useLoginFields from '@salesforce/retail-react-app/app/components/forms/useLoginFields'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import Field from '@salesforce/retail-react-app/app/components/field'
import LoginState from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-login-state'
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {
    AuthHelpers,
    useAuthHelper,
    useShopperBasketsV2Mutation as useShopperBasketsMutation,
    useCustomerType,
    useShopperCustomersMutation
} from '@salesforce/commerce-sdk-react'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {getAuthorizePasswordlessErrorMessage} from '@salesforce/retail-react-app/app/utils/auth-utils'
import {isValidEmail} from '@salesforce/retail-react-app/app/utils/email-utils'
import {formatPhoneNumber} from '@salesforce/retail-react-app/app/utils/phone-utils'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useLocation} from 'react-router-dom'
import {getPasswordlessCallbackUrl} from '@salesforce/retail-react-app/app/utils/auth-utils'

const ContactInfo = ({isSocialEnabled = false, idps = [], onRegisteredUserChoseGuest}) => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const location = useLocation()
    const {data: customer} = useCurrentCustomer()
    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const {isRegistered} = useCustomerType()
    const wasRegisteredAtMountRef = useRef(isRegistered)

    const logout = useAuthHelper(AuthHelpers.Logout)
    const updateCustomerForBasket = useShopperBasketsMutation('updateCustomerForBasket')
    const transferBasket = useShopperBasketsMutation('transferBasket')
    const updateCustomer = useShopperCustomersMutation('updateCustomer')
    const updateBillingAddressForBasket = useShopperBasketsMutation('updateBillingAddressForBasket')
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const loginPasswordless = useAuthHelper(AuthHelpers.LoginPasswordlessUser)
    const {locale} = useMultiSite()
    const passwordlessConfig = getConfig().app.login?.passwordless
    const callbackURL = getPasswordlessCallbackUrl(passwordlessConfig?.callbackURI)
    const redirectPath = location.pathname + location.search

    const {step, STEPS, goToStep, goToNextStep, setContactPhone} = useCheckout()

    // Determine if this order has delivery shipments
    const shipments = basket?.shipments || []
    const productItems = basket?.productItems || []
    const shipmentsWithItems = shipments.filter((s) =>
        productItems.some((i) => i.shipmentId === s.shipmentId)
    )
    const hasDeliveryShipments = shipmentsWithItems.some((s) => !isPickupShipment(s))

    const form = useForm({
        defaultValues: {
            email: customer?.email || basket?.customerInfo?.email || '',
            phone: customer?.phoneHome || basket?.billingAddress?.phone || '',
            password: '',
            otp: ''
        }
    })

    const fields = useLoginFields({form})
    const emailRef = useRef()
    // Single-flight guard for OTP authorization to avoid duplicate sends
    const otpSendPromiseRef = useRef(null)
    // Track the last email that was sent for passwordless login to avoid duplicate calls
    const lastEmailSentRef = useRef(null)

    const [error, setError] = useState()
    const [signOutConfirmDialogIsOpen, setSignOutConfirmDialogIsOpen] = useState(false)
    const [showContinueButton, setShowContinueButton] = useState(true)
    const [isCheckingEmail, setIsCheckingEmail] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isBlurChecking, setIsBlurChecking] = useState(false)
    const [registeredUserChoseGuest, setRegisteredUserChoseGuest] = useState(false)
    const [emailError, setEmailError] = useState('')

    // Auto-focus the email field when the component mounts
    useEffect(() => {
        // Small delay to ensure the field is fully rendered
        const timer = setTimeout(() => {
            if (emailRef.current) {
                emailRef.current.focus()
            }
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    // Use phone number from contact info in shipping step
    useEffect(() => {
        const subscription = form.watch((values, info) => {
            if (!info?.name || info.name === 'phone') {
                if (typeof setContactPhone === 'function') {
                    setContactPhone(values?.phone || '')
                }
            }
        })
        // Initialize immediately
        if (typeof setContactPhone === 'function') {
            setContactPhone(form.getValues('phone') || '')
        }
        return () => {
            if (subscription?.unsubscribe) subscription.unsubscribe()
        }
    }, [form, setContactPhone])

    // Modal controls for OtpAuth
    const {
        isOpen: isOtpModalOpen,
        onOpen: onOtpModalOpen,
        onClose: onOtpModalClose
    } = useDisclosure()
    // Only run post-auth recovery for OTP flows initiated from this Contact Info step
    const otpFromContactRef = useRef(false)

    // Handle email field blur/focus events
    const handleEmailBlur = async (e) => {
        // Call original React Hook Form blur handler if it exists
        if (fields.email.onBlur) {
            fields.email.onBlur(e)
        }

        const email = form.getValues('email') || e?.target?.value || ''

        // Clear previous email error
        setEmailError('')

        // Validate email format
        if (!email) {
            setEmailError(
                formatMessage({
                    defaultMessage: 'Please enter your email address.',
                    id: 'use_login_fields.error.required_email'
                })
            )
            return
        }

        if (!isValidEmail(email)) {
            setEmailError(
                formatMessage({
                    defaultMessage: 'Please enter a valid email address.',
                    id: 'use_login_fields.error.invalid_email'
                })
            )
            return
        }

        // Email is valid, proceed with OTP check
        // Use separate blur checking state to avoid disabling the button
        if (!isBlurChecking) {
            setIsBlurChecking(true)
            await handleSendEmailOtp(email)
            setIsBlurChecking(false)
        }
    }

    const handleEmailFocus = (e) => {
        // Call original React Hook Form focus handler if it exists
        if (fields.email.onFocus) {
            fields.email.onFocus(e)
        }

        // Close modal if user returns to email field
        if (isOtpModalOpen) {
            onOtpModalClose()
        }

        // Clear email checking state
        setIsCheckingEmail(false)

        // Clear email error when user focuses back on the field
        setEmailError('')
        // Also clear any top-level email error on focus
        setError('')
    }

    // Handle sending OTP email
    const handleSendEmailOtp = async (email, isResend = false) => {
        // Normalize email for comparison (trim and lowercase)
        const normalizedEmail = email?.trim().toLowerCase() || ''

        // Skip if email hasn't changed from the last one we sent (unless user requested)
        if (!isResend && lastEmailSentRef.current === normalizedEmail) {
            // Return cached result if we have one
            if (otpSendPromiseRef.current) {
                return otpSendPromiseRef.current
            }
            // If no cached result, return a default response
            return {isRegistered: false}
        }

        // Reuse in-flight request (single-flight) across blur and submit (but not for explicit resend)
        if (!isResend && otpSendPromiseRef.current) {
            return otpSendPromiseRef.current
        }

        form.clearErrors('global')
        setIsCheckingEmail(true)

        otpSendPromiseRef.current = (async () => {
            try {
                await authorizePasswordlessLogin.mutateAsync({
                    userid: email,
                    mode: passwordlessConfig?.mode,
                    locale: locale?.id,
                    ...(callbackURL && {callbackURI: `${callbackURL}?redirectUrl=${redirectPath}`})
                })
                // Only open modal if API call succeeds
                onOtpModalOpen()
                otpFromContactRef.current = true
                // Update the last email sent ref after successful call
                lastEmailSentRef.current = normalizedEmail
                return {isRegistered: true}
            } catch (error) {
                // 404 = email not registered (guest); treat as guest and continue
                const isGuestNotFound = String(error?.message || '').includes('404')
                if (isGuestNotFound && isValidEmail(email)) {
                    setError('')
                    setShowContinueButton(true)
                } else {
                    const message = formatMessage(
                        getAuthorizePasswordlessErrorMessage(error.message)
                    )
                    setError(message)
                    if (isValidEmail(email)) {
                        setShowContinueButton(true)
                    }
                }
                // Update the last email sent ref even on error to prevent retrying immediately
                lastEmailSentRef.current = normalizedEmail
                return {isRegistered: false}
            } finally {
                setIsCheckingEmail(false)
                otpSendPromiseRef.current = null
            }
        })()

        return otpSendPromiseRef.current
    }

    // Handle OTP modal close
    const handleOtpModalClose = () => {
        onOtpModalClose()
        // Show continue button when modal is closed/canceled
        setShowContinueButton(true)
        // Reset submitting state when modal is closed/canceled
        setIsSubmitting(false)
    }

    // Handle checkout as guest from OTP modal
    const handleCheckoutAsGuest = () => {
        setRegisteredUserChoseGuest(true)
        setCheckoutGuestChoiceInStorage(true)
        if (onRegisteredUserChoseGuest) {
            onRegisteredUserChoseGuest(true)
        }
    }

    // Handle OTP verification
    const handleOtpVerification = async (otpCode) => {
        try {
            // Prevent post-auth recovery effect from also attempting merge in this flow
            hasAttemptedRecoveryRef.current = true
            await loginPasswordless.mutateAsync({pwdlessLoginToken: otpCode})

            // Successful OTP verification - user is now logged in
            const hasBasketItem = basket.productItems?.length > 0
            let basketId
            if (hasBasketItem) {
                // Mirror legacy checkout flow header and await completion
                const merged = await transferBasket.mutateAsync({
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    parameters: {
                        merge: true
                    }
                })
                basketId = merged?.basketId || basket.basketId
                // Ensure we hydrate the latest basket after merge
                const refreshed = await currentBasketQuery.refetch()
                basketId = refreshed?.data?.basketId || basketId
            }

            // Update basket with email after successful OTP verification
            const email =
                form.getValues('email') || (emailRef.current && emailRef.current.value) || ''
            if (basketId && email) {
                try {
                    await updateCustomerForBasket.mutateAsync({
                        parameters: {basketId: basketId},
                        body: {email}
                    })
                } catch (error) {
                    setError(error.message)
                }
            }

            // Persist phone number to the newly registered customer's profile
            const phone = basket?.billingAddress?.phone || form.getValues('phone')
            if (phone && customer?.customerId) {
                try {
                    await updateCustomer.mutateAsync({
                        parameters: {customerId: customer.customerId},
                        body: {phoneHome: phone}
                    })
                } catch (_e) {
                    // ignore phone save failures
                }
            }

            // Reset guest checkout flag since user is now logged in
            setRegisteredUserChoseGuest(false)
            setCheckoutGuestChoiceInStorage(false)
            if (onRegisteredUserChoseGuest) {
                onRegisteredUserChoseGuest(false)
            }

            // Close modal
            handleOtpModalClose()

            goToNextStep()

            // Return success
            return {success: true}
        } catch (error) {
            // Handle 401 Unauthorized - invalid or expired OTP code
            const message =
                error.response?.status === 401
                    ? formatMessage({
                          defaultMessage:
                              'The code is invalid or expired. Click Resend Code and try again.',
                          id: 'otp.error.invalid_code'
                      })
                    : formatMessage(API_ERROR_MESSAGE)

            // Return error for OTP component to handle
            return {success: false, error: message}
        }
    }

    // Post-auth recovery: if user is already registered (after redirect-based auth),
    // attempt a one-time merge to carry over any guest items.
    const hasAttemptedRecoveryRef = useRef(false)
    useEffect(() => {
        const attemptRecovery = async () => {
            if (hasAttemptedRecoveryRef.current) return
            if (!isRegistered) return
            // Only when this page initiated OTP (returning shopper login)
            if (!otpFromContactRef.current) {
                hasAttemptedRecoveryRef.current = true
                return
            }
            // Skip if shopper was already registered when the component mounted
            if (wasRegisteredAtMountRef.current) {
                hasAttemptedRecoveryRef.current = true
                return
            }
            const hasBasketItem = basket?.productItems?.length > 0
            if (!hasBasketItem) {
                hasAttemptedRecoveryRef.current = true
                return
            }
            try {
                await transferBasket.mutateAsync({
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    parameters: {
                        merge: true
                    }
                })
                await currentBasketQuery.refetch()
            } catch (_e) {
                // no-op
            } finally {
                hasAttemptedRecoveryRef.current = true
            }
        }
        attemptRecovery()
    }, [isRegistered])

    // Custom form submit handler to prevent default form submission for registered users
    const handleFormSubmit = async (event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsSubmitting(true)

        // Get form data
        const formData = form.getValues()

        // Validate email before proceeding
        if (!formData.email) {
            setError(
                formatMessage({
                    defaultMessage: 'Please enter your email address.',
                    id: 'use_login_fields.error.required_email'
                })
            )
            setIsSubmitting(false) // Reset submitting state on validation error
            return
        }

        if (!isValidEmail(formData.email)) {
            setError(
                formatMessage({
                    defaultMessage: 'Please enter a valid email address.',
                    id: 'use_login_fields.error.invalid_email'
                })
            )
            setIsSubmitting(false) // Reset submitting state on validation error
            return
        }

        try {
            // Don't update basket yet - wait to see if user is registered
            // For registered users, we'll update basket after OTP verification
            // For guest users, we'll update basket and proceed to next step

            // Check if OTP modal is already open (from blur event)
            if (isOtpModalOpen) {
                return
            }

            // If modal is not open, we need to check if user is registered.
            // Use single-flight guard to avoid duplicate OTP sends when blur just fired.
            const result = await handleSendEmailOtp(formData.email)

            // Check if OTP modal is now open (after the API call)
            if (isOtpModalOpen) {
                // Hide continue button when OTP modal is open
                setShowContinueButton(false)
                return
            }

            if (!result.isRegistered || registeredUserChoseGuest) {
                // Guest shoppers must provide phone number before proceeding
                const phone = (formData.phone || '').trim()
                if (!phone) {
                    const phoneRequiredMsg = formatMessage({
                        defaultMessage: 'Please enter your phone number.',
                        id: 'use_address_fields.error.please_enter_phone_number'
                    })
                    try {
                        form.setError('phone', {type: 'required', message: phoneRequiredMsg})
                    } catch (_e) {
                        // ignore setError failures
                    }
                    setError(phoneRequiredMsg)
                    setIsSubmitting(false)
                    setIsCheckingEmail(false)
                    return
                }
                try {
                    // User is not registered (guest), update basket and proceed to next step
                    await updateCustomerForBasket.mutateAsync({
                        parameters: {basketId: basket.basketId},
                        body: {email: formData.email}
                    })

                    // Save phone number to basket billing address for guest shoppers
                    if (phone) {
                        const billingBody = {...basket?.billingAddress, phone}
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const {addressId, creationDate, lastModified, preferred, ...address} =
                            billingBody
                        await updateBillingAddressForBasket.mutateAsync({
                            parameters: {basketId: basket.basketId},
                            body: address
                        })
                    }

                    // Update basket and immediately advance to next step for smooth UX
                    goToNextStep()

                    // Reset both states immediately for guest users
                    setIsSubmitting(false)
                    setIsCheckingEmail(false)

                    return
                } catch (error) {
                    setError(
                        formatMessage({
                            defaultMessage: 'An error occurred. Please try again.',
                            id: 'contact_info.error.generic_try_again'
                        })
                    )
                    // Show continue button again if there's an error
                    setShowContinueButton(true)
                    setIsSubmitting(false)
                    setIsCheckingEmail(false)
                }
            }
            // If user is registered, OTP modal should be open, don't proceed to next step
        } catch (error) {
            setError(
                formatMessage({
                    defaultMessage: 'An error occurred. Please try again.',
                    id: 'contact_info.error.generic_try_again'
                })
            )
        } finally {
            // Only reset submitting state for registered users (when OTP modal is open)
            // Guest users will have already returned above
            if (isOtpModalOpen) {
                setIsSubmitting(false)
            }
        }
    }

    const customerEmail = customer?.email || form.getValues('email')
    const customerPhone = customer?.phoneHome || form.getValues('phone')

    return (
        <>
            <ToggleCard
                id="step-0"
                title={formatMessage({
                    defaultMessage: 'Contact Info',
                    id: 'checkout_contact_info.title.contact_info'
                })}
                editing={step === STEPS.CONTACT_INFO}
                onEdit={() => {
                    if (isRegistered) {
                        setSignOutConfirmDialogIsOpen(true)
                    } else {
                        goToStep(STEPS.CONTACT_INFO)
                    }
                }}
                editLabel={
                    isRegistered
                        ? formatMessage({
                              defaultMessage: 'Sign Out',
                              id: 'checkout_contact_info.action.sign_out'
                          })
                        : formatMessage({
                              defaultMessage: 'Change',
                              id: 'checkout_contact_info.action.change'
                          })
                }
            >
                <ToggleCardEdit>
                    <Container variant="form">
                        <form onSubmit={handleFormSubmit}>
                            <Stack spacing={6}>
                                {error && (
                                    <Alert status="error">
                                        <AlertIcon />
                                        {error}
                                    </Alert>
                                )}

                                <Stack spacing={5}>
                                    <InputGroup>
                                        <Field
                                            {...fields.email}
                                            error={null}
                                            inputRef={emailRef}
                                            inputProps={{
                                                onBlur: handleEmailBlur,
                                                onFocus: handleEmailFocus,
                                                paddingRight: isCheckingEmail
                                                    ? '2.5rem'
                                                    : undefined,
                                                ...fields.email.inputProps
                                            }}
                                        />
                                        {isCheckingEmail && (
                                            <InputRightElement
                                                height="100%"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                paddingTop="25px"
                                            >
                                                <Spinner
                                                    size="md"
                                                    color="blue.500"
                                                    borderWidth="2px"
                                                />
                                            </InputRightElement>
                                        )}
                                    </InputGroup>

                                    {emailError && (
                                        <Text fontSize="sm" color="red.500" mt={2}>
                                            {emailError}
                                        </Text>
                                    )}
                                    <Field
                                        name="phone"
                                        label={formatMessage({
                                            defaultMessage: 'Phone',
                                            id: 'use_address_fields.label.phone'
                                        })}
                                        type="tel"
                                        control={form.control}
                                        error={form.formState?.errors?.phone}
                                        rules={{
                                            required: formatMessage({
                                                defaultMessage: 'Please enter your phone number.',
                                                id: 'use_address_fields.error.please_enter_phone_number'
                                            })
                                        }}
                                        inputProps={({onChange}) => ({
                                            inputMode: 'numeric',
                                            onChange: (evt) => {
                                                const formatted = formatPhoneNumber(
                                                    evt.target.value
                                                )
                                                onChange(formatted)
                                                // Clear phone field error and top-level error as soon as user provides a value
                                                if (formatted && formatted.trim().length > 0) {
                                                    try {
                                                        form.clearErrors('phone')
                                                    } catch (_e) {
                                                        // ignore
                                                    }
                                                    setError('')
                                                }
                                            },
                                            disabled: isRegistered
                                        })}
                                    />
                                </Stack>

                                <Stack spacing={3}>
                                    <LoginState
                                        form={form}
                                        isSocialEnabled={isSocialEnabled}
                                        idps={idps}
                                    />
                                    {showContinueButton && step === STEPS.CONTACT_INFO && (
                                        <Button
                                            type="submit"
                                            isLoading={isSubmitting}
                                            disabled={isSubmitting}
                                        >
                                            {hasDeliveryShipments ? (
                                                <FormattedMessage
                                                    defaultMessage="Continue to Shipping Address"
                                                    id="contact_info.button.continue_to_shipping_address"
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="Continue to Payment"
                                                    id="contact_info.button.continue_to_payment"
                                                />
                                            )}
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>

                            {/* OTP Auth Modal */}
                            <OtpAuth
                                isOpen={isOtpModalOpen}
                                onClose={handleOtpModalClose}
                                form={form}
                                handleSendEmailOtp={handleSendEmailOtp}
                                handleOtpVerification={handleOtpVerification}
                                onCheckoutAsGuest={handleCheckoutAsGuest}
                            />
                        </form>
                    </Container>
                </ToggleCardEdit>

                {customerEmail ? (
                    <ToggleCardSummary>
                        <Stack spacing={1}>
                            <Text>{customerEmail}</Text>
                            {customerPhone && <Text>{customerPhone}</Text>}
                        </Stack>
                    </ToggleCardSummary>
                ) : null}
            </ToggleCard>

            {/* Sign Out Confirmation Dialog */}
            <SignOutConfirmationDialog
                isOpen={signOutConfirmDialogIsOpen}
                onClose={() => setSignOutConfirmDialogIsOpen(false)}
                onConfirm={async () => {
                    await logout.mutateAsync()
                    setSignOutConfirmDialogIsOpen(false)
                    navigate('/')
                }}
            />
        </>
    )
}

ContactInfo.propTypes = {
    isSocialEnabled: PropTypes.bool,
    idps: PropTypes.arrayOf(PropTypes.string),
    onRegisteredUserChoseGuest: PropTypes.func
}

const SignOutConfirmationDialog = ({isOpen, onConfirm, onClose}) => {
    const cancelRef = useRef()

    return (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        <FormattedMessage
                            defaultMessage="Sign Out"
                            id="signout_confirmation_dialog.heading.sign_out"
                        />
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <FormattedMessage
                            defaultMessage="Are you sure you want to sign out? You will need to sign back in to proceed
                        with your current order."
                            id="signout_confirmation_dialog.message.sure_to_sign_out"
                        />
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef} variant="outline" onClick={onClose}>
                            <FormattedMessage
                                defaultMessage="Cancel"
                                id="signout_confirmation_dialog.button.cancel"
                            />
                        </Button>
                        <Button colorScheme="red" onClick={onConfirm} ml={3}>
                            <FormattedMessage
                                defaultMessage="Sign Out"
                                id="signout_confirmation_dialog.button.sign_out"
                            />
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    )
}

SignOutConfirmationDialog.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func
}

export default ContactInfo
