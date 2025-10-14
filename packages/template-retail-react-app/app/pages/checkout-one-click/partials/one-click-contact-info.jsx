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
    const [allowAccountRegistration, setAllowAccountRegistration] = useState(true) // Track if user should see registration option

    // Note: We don't automatically reset allowAccountRegistration here
    // because it would override the user's choice from the OTP modal.
    // The reset happens in the main checkout component when step === 0 (editing contact info)

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

    // Email validation is now handled in button click handlers

    // Handle email submission - Direct SLAS integration (uniform UI)
    const handleEmailSubmission = async (email) => {
        console.log('📨 handleEmailSubmission called with:', email) // Debug
        
        form.clearErrors('global')
        setEmailError('')

        try {
            console.log('🌐 Making SLAS authorizePasswordless call...') // Debug
            
            // Use direct SLAS call - this will succeed for registered users, fail for guests
            await authorizePasswordlessLogin.mutateAsync({
                userid: email,
                callbackURI: `${callbackURL}?mode=otp_email`
            })
            
            console.log('✅ SLAS call succeeded - registered user') // Debug

        } catch (error) {
            console.log('⚠️ SLAS call failed - likely guest user or other error:', error.message) // Debug
            // This is expected for guest users - don't treat as error
        }

        // ALWAYS show OTP modal regardless of SLAS success/failure
        // This creates uniform UI - no way to distinguish registered vs guest users
        console.log('🎯 Opening OTP modal (uniform behavior)...') // Debug
        onOtpModalOpen()
    }

    // Handle OTP modal close
    const handleOtpModalClose = () => {
        onOtpModalClose()
    }

    // Handle "Sign in" button click
    const handleSignIn = async () => {
        console.log('🔵 Sign in button clicked') // Debug
        
        const email = form.getValues('email')
        console.log('📧 Email value:', email) // Debug
        
        // Validate email before proceeding
        if (!email) {
            console.log('❌ No email provided') // Debug
            setEmailError('Please enter your email address.')
            // Focus email field for better UX
            if (emailRef.current) {
                emailRef.current.focus()
            }
            return
        }

        if (!isValidEmail(email)) {
            console.log('❌ Invalid email format') // Debug
            setEmailError('Please enter a valid email address.')
            // Focus email field for better UX
            if (emailRef.current) {
                emailRef.current.focus()
            }
            return
        }

        console.log('✅ Email validation passed, proceeding...') // Debug

        // Clear any previous errors
        form.clearErrors('global')
        setEmailError('')
        
        // Trigger uniform OTP flow (same for registered and guest users)
        try {
            console.log('🚀 Calling handleEmailSubmission...') // Debug
            await handleEmailSubmission(email)
        } catch (error) {
            console.log('💥 Error in handleEmailSubmission, opening modal as fallback') // Debug
            // Fallback: Always open modal even if API fails
            onOtpModalOpen()
        }
    }


    // Handle OTP send/resend using direct SLAS (uniform UI behavior)
    const handleSendEmailOtp = async (email) => {
        try {
            console.log('📤 Resending OTP via SLAS for:', email || form.getValues('email')) // Debug
            
            // Use direct SLAS call - will succeed for registered users, fail for guests
            await authorizePasswordlessLogin.mutateAsync({
                userid: email || form.getValues('email'),
                callbackURI: `${callbackURL}?mode=otp_email`
            })
            
            console.log('✅ OTP resend succeeded') // Debug
            return { success: true, message: "Code sent successfully" }

        } catch (error) {
            console.log('⚠️ OTP resend failed (expected for guests):', error.message) // Debug
            // Return success to maintain uniform behavior - guest users can't tell the difference
            return { 
                success: true, 
                message: "If your email is registered with us, you'll receive a verification code shortly." 
            }
        }
    }


    // Helper function to proceed as guest with explicit registration flag
    const proceedAsGuestWithRegistrationFlag = async (email, allowRegistration) => {
        try {
            // Update basket with guest email
            await updateCustomerForBasket.mutateAsync({
                parameters: {basketId: basket.basketId},
                body: {email: email}
            })

            // Set the flag that user is proceeding as guest
            setRegisteredUserChoseGuest(true)
            if (onRegisteredUserChoseGuest) {
                // Pass both guest status and registration allowance
                console.log('📞 Calling onRegisteredUserChoseGuest callback with:', {
                    isGuest: true,
                    allowAccountRegistration: allowRegistration
                }) // Debug
                onRegisteredUserChoseGuest(true, allowRegistration)
            }

            // Proceed to next step
            goToNextStep()
        } catch (error) {
            setError(error.message)
        }
    }

    // Helper function to proceed as guest (uses current state)
    const proceedAsGuest = async (email) => {
        await proceedAsGuestWithRegistrationFlag(email, allowAccountRegistration)
    }

    // Handle checkout as guest from OTP modal
    const handleCheckoutAsGuest = async () => {
        console.log('🚫 OTP Modal "Continue as Guest" clicked - user explicitly declined sign in, no registration option') // Debug
        
        const email = form.getValues('email')
        
        // Set flag to prevent account registration during checkout
        // User explicitly declined to sign in, so they don't want an account
        setAllowAccountRegistration(false)
        console.log('🚫 OTP Modal "Continue as Guest" - allowAccountRegistration set to FALSE') // Debug
        
        // Use the updated value directly instead of relying on state
        await proceedAsGuestWithRegistrationFlag(email, false)
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

    // Handle form submission - user proceeds as guest with registration option
    const submitForm = async (e) => {
        e.preventDefault()
        console.log('📝 Form submitted - proceeding as guest with registration option') // Debug
        
        const email = form.getValues('email')
        
        // Validate email before proceeding
        if (!email) {
            setEmailError('Please enter your email address.')
            if (emailRef.current) {
                emailRef.current.focus()
            }
            return
        }

        if (!isValidEmail(email)) {
            setEmailError('Please enter a valid email address.')
            if (emailRef.current) {
                emailRef.current.focus()
            }
            return
        }

        // Clear any previous errors
        form.clearErrors('global')
        setEmailError('')
        
        // User proceeds as guest with registration option (default behavior)
        try {
            await proceedAsGuestWithRegistrationFlag(email, true)
        } catch (error) {
            setError(error.message)
        }
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
                                    
                                    {/* Show action buttons */}
                                    {step === STEPS.CONTACT_INFO && (
                                        <Stack spacing={3}>
                                            <Button 
                                                type="submit"
                                                colorScheme="blue" 
                                                size="lg"
                                                width="full"
                                            >
                                                Continue
                                            </Button>
                                            
                                            <Button 
                                                type="button"
                                                variant="outline"
                                                onClick={handleSignIn}
                                                size="lg"
                                                width="full"
                                            >
                                                Sign in
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
