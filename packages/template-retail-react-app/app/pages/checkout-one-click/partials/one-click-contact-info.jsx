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
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
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
    useShopperBasketsMutation,
    useCustomerType,
    useConfig
} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'

const ContactInfo = ({isSocialEnabled = false, idps = [], onRegisteredUserChoseGuest}) => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const appOrigin = useAppOrigin()
    const {data: customer} = useCurrentCustomer()
    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const {isRegistered} = useCustomerType()
    const config = useConfig()

    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const logout = useAuthHelper(AuthHelpers.Logout)
    const updateCustomerForBasket = useShopperBasketsMutation('updateCustomerForBasket')
    const mergeBasket = useShopperBasketsMutation('mergeBasket')
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const loginPasswordless = useAuthHelper(AuthHelpers.LoginPasswordlessUser)

    const {step, STEPS, goToStep, goToNextStep} = useCheckout()

    const form = useForm({
        defaultValues: {
            email: customer?.email || basket?.customerInfo?.email || '',
            password: '',
            otp: ''
        }
    })

    const fields = useLoginFields({form})
    const emailRef = useRef()

    const [error, setError] = useState()
    const [signOutConfirmDialogIsOpen, setSignOutConfirmDialogIsOpen] = useState(false)
    const [showContinueButton, setShowContinueButton] = useState(true)
    const [isCheckingEmail, setIsCheckingEmail] = useState(false)
    const [registeredUserChoseGuest, setRegisteredUserChoseGuest] = useState(false)
    const [emailError, setEmailError] = useState('')

    const passwordlessConfigCallback = getConfig().app.login?.passwordless?.callbackURI
    const callbackURL = isAbsoluteURL(passwordlessConfigCallback)
        ? passwordlessConfigCallback
        : `${appOrigin}${passwordlessConfigCallback}`

    // Reset guest checkout flag when user registration status changes
    useEffect(() => {
        if (isRegistered) {
            setRegisteredUserChoseGuest(false)
            if (onRegisteredUserChoseGuest) {
                onRegisteredUserChoseGuest(false)
            }
        }
    }, [isRegistered, onRegisteredUserChoseGuest])

    // Modal controls for OtpAuth
    const {
        isOpen: isOtpModalOpen,
        onOpen: onOtpModalOpen,
        onClose: onOtpModalClose
    } = useDisclosure()

    // Helper function to validate email format
    const isValidEmail = (email) => {
        const emailRegex =
            /^[\p{L}\p{N}._!#$%&'*+/=?^`{|}~-]+@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u

        return emailRegex.test(email)
    }

    // Handle email field blur/focus events
    const handleEmailBlur = async (e) => {
        // Call original React Hook Form blur handler if it exists
        if (fields.email.onBlur) {
            fields.email.onBlur(e)
        }

        const email = form.getValues('email')

        // Clear previous email error
        setEmailError('')

        // Validate email format
        if (!email) {
            setEmailError('Please enter your email address.')
            return
        }

        if (!isValidEmail(email)) {
            setEmailError('Please enter a valid email address.')
            return
        }

        // Email is valid, proceed with OTP check
        await handleSendEmailOtp(email)
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
    }

    // Handle sending OTP email
    const handleSendEmailOtp = async (email) => {
        form.clearErrors('global')
        setIsCheckingEmail(true)
        try {
            await authorizePasswordlessLogin.mutateAsync({
                userid: email,
                callbackURI: `${callbackURL}?mode=otp_email`
            })
            // Only open modal if API call succeeds
            onOtpModalOpen()
        } catch (error) {
            // Keep continue button visible if email is valid (for unregistered users)
            if (isValidEmail(email)) {
                setShowContinueButton(true)
            }
        } finally {
            setIsCheckingEmail(false)
        }
    }

    // Handle OTP modal close
    const handleOtpModalClose = () => {
        onOtpModalClose()
    }

    // Handle checkout as guest from OTP modal
    const handleCheckoutAsGuest = async () => {
        try {
            const email = form.getValues('email')
            // Update basket with guest email
            await updateCustomerForBasket.mutateAsync({
                parameters: {basketId: basket.basketId},
                body: {email: email}
            })

            // Set the flag that "Checkout as Guest" was clicked
            setRegisteredUserChoseGuest(true)
            if (onRegisteredUserChoseGuest) {
                onRegisteredUserChoseGuest(true)
            }

            // Proceed to next step (shipping address)
            goToNextStep()
        } catch (error) {
            setError(error.message)
        }
    }

    // Handle OTP verification
    const handleOtpVerification = async (otpCode) => {
        try {
            await loginPasswordless.mutateAsync({pwdlessLoginToken: otpCode})

            // Successful OTP verification - user is now logged in
            const hasBasketItem = basket.productItems?.length > 0
            if (hasBasketItem) {
                mergeBasket.mutate({
                    parameters: {
                        createDestinationBasket: true
                    }
                })
            }

            // Reset guest checkout flag since user is now logged in
            setRegisteredUserChoseGuest(false)
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
                          defaultMessage: 'Invalid or expired code. Please try again.',
                          id: 'otp.error.invalid_code'
                      })
                    : formatMessage(API_ERROR_MESSAGE)

            // Return error for OTP component to handle
            return {success: false, error: message}
        }
    }

    const submitForm = async (data) => {
        setError(null)
        // Validate email before proceeding
        if (!data.email) {
            setError('Please enter your email address.')
            return
        }

        if (!isValidEmail(data.email)) {
            setError('Please enter a valid email address.')
            return
        }

        await updateCustomerForBasket.mutateAsync({
            parameters: {basketId: basket.basketId},
            body: {email: data.email}
        })

        // Reset guest checkout flag since user is proceeding normally
        setRegisteredUserChoseGuest(false)
        if (onRegisteredUserChoseGuest) {
            onRegisteredUserChoseGuest(false)
        }

        setShowContinueButton(false)
        goToNextStep()
    }

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
                              defaultMessage: 'Edit',
                              id: 'checkout_contact_info.action.edit'
                          })
                }
            >
                <ToggleCardEdit>
                    <Container variant="form">
                        <form onSubmit={form.handleSubmit(submitForm)}>
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
                                </Stack>

                                <Stack spacing={3}>
                                    <LoginState
                                        form={form}
                                        isSocialEnabled={isSocialEnabled}
                                        idps={idps}
                                    />
                                    {showContinueButton && step === STEPS.CONTACT_INFO && (
                                        <Button type="submit">
                                            <FormattedMessage
                                                defaultMessage="Continue to Shipping Address"
                                                id="contact_info.button.continue_to_shipping_address"
                                            />
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

                {(customer?.email || form.getValues('email')) && (
                    <ToggleCardSummary>
                        <Text>{customer?.email || form.getValues('email')}</Text>
                    </ToggleCardSummary>
                )}
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
