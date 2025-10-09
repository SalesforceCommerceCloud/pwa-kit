/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef, useState} from 'react'
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
    useCustomerType
} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {isValidEmail} from '@salesforce/retail-react-app/app/utils/email-utils'

const ContactInfo = ({isSocialEnabled = false, idps = [], onRegisteredUserChoseGuest}) => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const appOrigin = useAppOrigin()
    const {data: customer} = useCurrentCustomer()
    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const {isRegistered} = useCustomerType()

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
    const [registeredUserChoseGuest, setRegisteredUserChoseGuest] = useState(false)
    const [emailError, setEmailError] = useState('')

    const passwordlessConfigCallback = getConfig().app.login?.passwordless?.callbackURI
    const callbackURL = isAbsoluteURL(passwordlessConfigCallback)
        ? passwordlessConfigCallback
        : `${appOrigin}${passwordlessConfigCallback}`

    // Modal controls for OtpAuth
    const {
        isOpen: isOtpModalOpen,
        onOpen: onOtpModalOpen,
        onClose: onOtpModalClose
    } = useDisclosure()

    // Handle email field blur - just validation, no automatic OTP
    const handleEmailBlur = (e) => {
        // Call original React Hook Form blur handler if it exists
        if (fields.email.onBlur) {
            fields.email.onBlur(e)
        }

        const email = form.getValues('email')

        // Clear previous email error
        setEmailError('')

        // Validate email format but don't trigger OTP automatically
        if (email && !isValidEmail(email)) {
            setEmailError('Please enter a valid email address.')
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

        // Clear email error when user focuses back on the field
        setEmailError('')
    }

    // Check if email is valid and show action buttons
    const isEmailValid = () => {
        const email = form.getValues('email')
        return email && isValidEmail(email) && !emailError
    }

    // Handle email submission - TRUE zero enumeration via server-side proxy
    const handleEmailSubmission = async (email) => {
        form.clearErrors('global')
        setEmailError('')

        try {
            // Use uniform OTP send proxy - always returns 200 regardless of registration status
            const response = await fetch(`${appOrigin}/api/uniform-otp-send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    callbackURI: `${callbackURL}?mode=otp_email`
                })
            })

            // Always gets 200 response - no way to distinguish registered vs guest users
            const result = await response.json()

            // Always show OTP modal - true zero enumeration achieved
            onOtpModalOpen()

        } catch (error) {
            // Even on network error, show OTP modal to maintain uniform behavior
            onOtpModalOpen()
        }
    }

    // Handle OTP modal close
    const handleOtpModalClose = () => {
        onOtpModalClose()
    }

    // Handle "Login with OTP" button click
    const handleLoginWithOtp = async () => {
        const email = form.getValues('email')
        
        // Validate email before proceeding
        if (!email) {
            setEmailError('Please enter your email address.')
            return
        }

        if (!isValidEmail(email)) {
            setEmailError('Please enter a valid email address.')
            return
        }

        // Clear any previous errors
        form.clearErrors('global')
        setEmailError('')

        // Trigger uniform OTP flow (same for registered and guest users)
        await handleEmailSubmission(email)
    }

    // Handle "Continue as Guest" button click
    const handleContinueAsGuest = async () => {
        const email = form.getValues('email')
        
        // Validate email before proceeding
        if (!email) {
            setEmailError('Please enter your email address.')
            return
        }

        if (!isValidEmail(email)) {
            setEmailError('Please enter a valid email address.')
            return
        }

        // Clear any previous errors
        form.clearErrors('global')
        setEmailError('')

        // Proceed directly as guest without OTP
        await proceedAsGuest(email)
    }

    // Handle OTP send/resend using uniform proxy (prevents enumeration)
    const handleSendEmailOtp = async (email) => {
        try {
            // Use uniform OTP send proxy - always returns 200 regardless of registration status
            const response = await fetch(`${appOrigin}/api/uniform-otp-send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email || form.getValues('email'),
                    callbackURI: `${callbackURL}?mode=otp_email`
                })
            })

            // Always gets 200 response - no way to distinguish registered vs guest users
            const result = await response.json()

            // Return success (even though we can't know if OTP was actually sent)
            return { success: true, message: result.message }

        } catch (error) {
            // Even on network error, return success to maintain uniform behavior
            return {
                success: true,
                message: "If your email is registered with us, you'll receive a verification code shortly."
            }
        }
    }


    // Helper function to proceed as guest
    const proceedAsGuest = async (email) => {
        try {
            // Update basket with guest email
            await updateCustomerForBasket.mutateAsync({
                parameters: {basketId: basket.basketId},
                body: {email: email}
            })

            // Set the flag that user is proceeding as guest
            setRegisteredUserChoseGuest(true)
            if (onRegisteredUserChoseGuest) {
                onRegisteredUserChoseGuest(true)
            }

            // Proceed to next step
            goToNextStep()
        } catch (error) {
            setError(error.message)
        }
    }

    // Handle checkout as guest from OTP modal
    const handleCheckoutAsGuest = async () => {
        const email = form.getValues('email')
        await proceedAsGuest(email)
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

    // Prevent default form submission - we use explicit buttons instead
    const submitForm = (e) => {
        e.preventDefault()
        // No automatic submission - user must choose "Login with OTP" or "Continue as Guest"
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
                                                ...fields.email.inputProps
                                            }}
                                        />
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
                                    
                                    {/* Two-button approach for better UX */}
                                    {isEmailValid() && step === STEPS.CONTACT_INFO && (
                                        <Stack spacing={3}>
                                            <Text fontSize="sm" color="gray.600" textAlign="center">
                                                <FormattedMessage
                                                    defaultMessage="Choose how you'd like to proceed:"
                                                    id="contact_info.text.choose_option"
                                                />
                                            </Text>
                                            
                                            <Button 
                                                colorScheme="blue" 
                                                onClick={handleLoginWithOtp}
                                                size="lg"
                                                width="full"
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Login with OTP"
                                                    id="contact_info.button.login_with_otp"
                                                />
                                            </Button>
                                            
                                            <Button 
                                                variant="outline" 
                                                onClick={handleContinueAsGuest}
                                                size="lg"
                                                width="full"
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Continue as Guest"
                                                    id="contact_info.button.continue_as_guest"
                                                />
                                            </Button>
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>

                            {/* OTP Auth Modal - Zero Enumeration Design */}
                            <OtpAuth
                                isOpen={isOtpModalOpen}
                                onClose={handleOtpModalClose}
                                form={form}
                                handleSendEmailOtp={handleSendEmailOtp}
                                handleOtpVerification={handleOtpVerification}
                                onCheckoutAsGuest={handleCheckoutAsGuest}
                                zeroEnumerationMode={true}
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
