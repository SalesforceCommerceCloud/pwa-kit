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
    Stack,
    Text,
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm} from 'react-hook-form'
import {FormattedMessage, useIntl} from 'react-intl'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context'
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
import {AuthHelpers, useAuthHelper, useShopperBasketsMutation, useCustomerType, useConfig, useCustomer, useCustomerId} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {API_ERROR_MESSAGE, USER_NOT_FOUND_ERROR, CREATE_ACCOUNT_FIRST_ERROR_MESSAGE, PASSWORDLESS_ERROR_MESSAGES, FEATURE_UNAVAILABLE_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'

const ContactInfo = ({isSocialEnabled = false, idps = [], isPasswordlessEnabled = false, isProcessingAddressLogic, setIsProcessingAddressLogic}) => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const appOrigin = useAppOrigin()
    const {data: customer} = useCurrentCustomer()
    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const {isRegistered} = useCustomerType()
    const config = useConfig()
    
    // Add manual customer fetching capability
    const customerId = useCustomerId()
    const manualCustomerQuery = useCustomer(
        {parameters: {customerId}}, 
        {enabled: false} // Disabled initially, we'll manually trigger
    )
    
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const logout = useAuthHelper(AuthHelpers.Logout)
    const updateCustomerForBasket = useShopperBasketsMutation('updateCustomerForBasket')
    const mergeBasket = useShopperBasketsMutation('mergeBasket')
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const loginPasswordless = useAuthHelper(AuthHelpers.LoginPasswordlessUser)
    const updateShippingAddressForShipment = useShopperBasketsMutation('updateShippingAddressForShipment')

    const {step, STEPS, goToStep, goToNextStep} = useCheckout()

    // Clean up processing state when leaving this step
    useEffect(() => {
        if (step !== STEPS.CONTACT_INFO) {
            setIsProcessingAddressLogic(false)
        }
    }, [step, STEPS.CONTACT_INFO, setIsProcessingAddressLogic])
    
    // Helper function to directly read customer type from localStorage
    // This bypasses React state staleness after login
    const getCustomerTypeFromStorage = () => {
        if (typeof window !== 'undefined') {
            const customerTypeKey = `customer_type_${config.siteId}`
            return localStorage.getItem(customerTypeKey)
        }
        return null
    }
    
    // Helper function to directly read customer ID from localStorage
    const getCustomerIdFromStorage = () => {
        if (typeof window !== 'undefined') {
            const customerIdKey = `customer_id_${config.siteId}`
            return localStorage.getItem(customerIdKey)
        }
        return null
    }
    
    // Helper function to extract basket ID from either structure
    const getBasketId = (basketData) => {
        // Handle individual basket structure: {basketId: "...", productItems: [...]}
        if (basketData?.basketId) {
            return basketData.basketId
        }
        // Handle baskets collection structure: {baskets: [{basketId: "..."}], total: 1}
        if (basketData?.baskets?.[0]?.basketId) {
            return basketData.baskets[0].basketId
        }
        return null
    }

    const form = useForm({
        defaultValues: {email: customer?.email || basket?.customerInfo?.email || '', password: '', otp: ''}
    })

    const fields = useLoginFields({form})
    const emailRef = useRef()

    const [error, setError] = useState()
    const [signOutConfirmDialogIsOpen, setSignOutConfirmDialogIsOpen] = useState(false)
    const [showOtpView, setShowOtpView] = useState(false)
    const passwordlessConfigCallback = getConfig().app.login?.passwordless?.callbackURI
    const callbackURL = isAbsoluteURL(passwordlessConfigCallback)
        ? passwordlessConfigCallback
        : `${appOrigin}${passwordlessConfigCallback}`
    
    // Modal controls for OtpAuth
    const {isOpen: isOtpModalOpen, onOpen: onOtpModalOpen, onClose: onOtpModalClose} = useDisclosure()

    // Helper function to validate email format
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Handle email field blur/focus events
    const handleEmailBlur = async(e) => {
        // Call original React Hook Form blur handler if it exists
        if (fields.email.onBlur) {
            fields.email.onBlur(e)
        }

        const email = form.getValues('email')
        const isValid = await form.trigger()
        // Manually trigger the browser native form validations
        if (isValid) {
            // Try to send OTP first, only open modal if successful
            await handleSendEmailOtp(email)
        } else {
            form.reportValidity()
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
    }

    // Handle sending OTP email
    const handleSendEmailOtp = async (email) => {
        form.clearErrors('global')
        try {
            await authorizePasswordlessLogin.mutateAsync({
                userid: email,
                callbackURI: `${callbackURL}?mode=otp_email`
            })
            // Only open modal and set OTP view if API call succeeds
            setShowOtpView(true)
            onOtpModalOpen()
        } catch (error) {
            setShowOtpView(false)
            // No need to close modal since it never opened
            
            // Handle specific error types
            console.error('Passwordless authorization failed:', error)
            
            // // Check if it's a 404 (user not found) or other specific errors
            // if (error.response?.status === 404) {
            //     // User not found - they should register or checkout as guest
            //     const message = formatMessage(CREATE_ACCOUNT_FIRST_ERROR_MESSAGE)
            //     setError(message)
            // } else {
            //     // Other errors - show appropriate message
            //     const message = PASSWORDLESS_ERROR_MESSAGES.some((msg) => msg.test(error.message))
            //         ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
            //         : formatMessage(API_ERROR_MESSAGE)
            //     setError(message)
            // }
        }
    }

    // Handle OTP modal close
    const handleOtpModalClose = () => {
        setShowOtpView(false)
        onOtpModalClose()
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
            
            // Close modal
            handleOtpModalClose()
            
            // Start processing address logic
            setIsProcessingAddressLogic(true)
            
            // Start the check process after a brief delay
            setTimeout(() => {
                checkCustomerAndProceed()
            }, 300)
            
            return {success: true}
        } catch (error) {
            console.error('OTP verification error:', error)
            const message = /invalid|expired/i.test(error.message)
                ? formatMessage({
                    defaultMessage: 'Invalid or expired code. Please try again.',
                    id: 'otp.error.invalid_code'
                  })
                : formatMessage(API_ERROR_MESSAGE)
            return {success: false, error: message}
        }
    }

    // After successful OTP login, check for addresses to determine next step
    const checkCustomerAndProceed = async (retryCount = 0) => {
        const maxRetries = 5
        const retryDelay = 800  // Increased to 800ms for more settling time
        
        console.log(`\n🔍 [Attempt ${retryCount + 1}/${maxRetries + 1}] State Check:`)
        
        // Comprehensive state debugging
        const debugState = {
            'basket exists': !!basket,
            'basket.basketId': basket?.basketId,
            'customerId (hook)': customerId,
            'customerId (storage)': getCustomerIdFromStorage(),
            'isRegistered (hook)': isRegistered,
            'customerType (storage)': getCustomerTypeFromStorage(),
            'basket.shipments[0]?.shippingAddress?.address1': basket?.shipments?.[0]?.shippingAddress?.address1,
            'mergeBasket.isLoading': mergeBasket.isLoading,
            'loginPasswordless.isLoading': loginPasswordless.isLoading
        }
        
        console.table(debugState)
        
        // Check if there's already a shipping address in the basket
        const basketHasShippingAddress = basket?.shipments?.[0]?.shippingAddress?.address1
        
        if (basketHasShippingAddress) {
            console.log('✅ Basket already has shipping address, skipping to shipping options')
            setIsProcessingAddressLogic(false)
            goToStep(STEPS.SHIPPING_OPTIONS)
            return
        }
        
        // Check if any critical mutations are still running
        if (mergeBasket.isLoading || loginPasswordless.isLoading) {
            if (retryCount < maxRetries) {
                console.log('⏳ Mutations still running, waiting...')
                setTimeout(() => {
                    checkCustomerAndProceed(retryCount + 1)
                }, retryDelay)
                return
            }
        }
        
        // Use direct localStorage check for most current customer type
        const customerTypeFromStorage = getCustomerTypeFromStorage()
        const isUserRegistered = customerTypeFromStorage === 'registered'
        const effectiveCustomerId = customerId || getCustomerIdFromStorage()
        
        // Check all required conditions
        const conditionsCheck = {
            'User is registered': isUserRegistered,
            'Customer ID available': !!effectiveCustomerId,
            'Basket exists': !!basket,
            'Basket has ID': !!basket?.basketId
        }
        
        console.log('📋 Conditions check:')
        console.table(conditionsCheck)
        
        const allConditionsMet = Object.values(conditionsCheck).every(Boolean)
        
        if (!allConditionsMet && retryCount < maxRetries) {
            console.log(`❌ Not all conditions met, retrying in ${retryDelay}ms...`)
            setTimeout(() => {
                checkCustomerAndProceed(retryCount + 1)
            }, retryDelay)
            return
        }
        
        if (isUserRegistered && effectiveCustomerId) {
            try {
                console.log('🔄 Fetching fresh customer data...')
                
                // Add timeout to customer fetch
                const fetchWithTimeout = Promise.race([
                    manualCustomerQuery.refetch(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Customer fetch timeout')), 5000)
                    )
                ])
                
                const freshCustomerResult = await fetchWithTimeout
                const freshCustomerData = freshCustomerResult.data
                
                if (!freshCustomerData) {
                    throw new Error('No customer data returned')
                }
                
                console.log('👤 Customer data received:', {
                    'customerId': freshCustomerData.customerId,
                    'addresses count': freshCustomerData.addresses?.length || 0,
                    'has preferred': freshCustomerData.addresses?.some(addr => addr.preferred) || false
                })
                
                const preferredAddress = freshCustomerData?.addresses?.find(addr => addr.preferred === true)
                
                if (preferredAddress) {
                    console.log('🏠 Found preferred address:', {
                        'addressId': preferredAddress.addressId,
                        'address1': preferredAddress.address1,
                        'city': preferredAddress.city,
                        'preferred': preferredAddress.preferred
                    })
                    
                    // Get basket ID with multiple fallback strategies
                    let basketIdToUse = null
                    
                    console.log('🧺 Determining basket ID...')
                    
                    // Strategy 1: Try refetching current basket
                    try {
                        console.log('  Strategy 1: Refetching basket...')
                        const currentBasketResult = await currentBasketQuery.refetch()
                        const refetchedBasketId = getBasketId(currentBasketResult.data)
                        if (refetchedBasketId) {
                            basketIdToUse = refetchedBasketId
                            console.log('  ✅ Got basket ID from refetch:', basketIdToUse)
                        }
                    } catch (refetchError) {
                        console.log('  ❌ Basket refetch failed:', refetchError.message)
                    }
                    
                    // Strategy 2: Use original basket
                    if (!basketIdToUse) {
                        console.log('  Strategy 2: Using original basket...')
                        basketIdToUse = getBasketId(basket)
                        if (basketIdToUse) {
                            console.log('  ✅ Got basket ID from original:', basketIdToUse)
                        }
                    }
                    
                    // Strategy 3: Direct localStorage check (if basket stores ID there)
                    if (!basketIdToUse && typeof window !== 'undefined') {
                        console.log('  Strategy 3: Checking localStorage...')
                        // Some implementations store basket ID in localStorage
                        const storedBasketId = localStorage.getItem(`basketId_${config.siteId}`)
                        if (storedBasketId) {
                            basketIdToUse = storedBasketId
                            console.log('  ✅ Got basket ID from localStorage:', basketIdToUse)
                        }
                    }
                    
                    if (!basketIdToUse) {
                        throw new Error('No basket ID available from any strategy')
                    }
                    
                    console.log('🎯 Applying preferred address to basket:', basketIdToUse)
                    
                    // Apply the preferred address
                    await updateShippingAddressForShipment.mutateAsync({
                        parameters: {
                            basketId: basketIdToUse,
                            shipmentId: 'me',
                            useAsBilling: false
                        },
                        body: {
                            address1: preferredAddress.address1,
                            city: preferredAddress.city,
                            countryCode: preferredAddress.countryCode,
                            firstName: preferredAddress.firstName,
                            lastName: preferredAddress.lastName,
                            phone: preferredAddress.phone,
                            postalCode: preferredAddress.postalCode,
                            stateCode: preferredAddress.stateCode
                        }
                    })
                    
                    console.log('🎉 SUCCESS! Preferred address applied. Advancing to shipping options...')
                    
                    // Clear processing state and skip to shipping options
                    setIsProcessingAddressLogic(false)
                    goToStep(STEPS.SHIPPING_OPTIONS)
                    return
                } else {
                    console.log('ℹ️ No preferred address found, proceeding to address selection')
                    setIsProcessingAddressLogic(false)
                    goToNextStep()
                    return
                }
            } catch (error) {
                console.error(`💥 Error on attempt ${retryCount + 1}:`, {
                    'error': error.message || error,
                    'stack': error.stack,
                    'effectiveCustomerId': effectiveCustomerId,
                    'basket': !!basket,
                    'basketId': basket?.basketId
                })
                
                // If we haven't exceeded max retries, try again
                if (retryCount < maxRetries) {
                    console.log(`🔄 Retrying in ${retryDelay}ms... (attempt ${retryCount + 2}/${maxRetries + 1})`)
                    setTimeout(() => {
                        checkCustomerAndProceed(retryCount + 1)
                    }, retryDelay)
                    return
                }
                
                console.log('💀 Max retries reached, falling back to normal address selection flow')
            }
        }
        
        // Fallback: Go to shipping address step
        console.log('⚠️ Fallback: Proceeding to shipping address selection')
        setIsProcessingAddressLogic(false)
        goToNextStep()
    }

    const submitForm = async (data) => {
        setError(null)
        try {
            if (!data.password) {
                await updateCustomerForBasket.mutateAsync({
                    parameters: {basketId: basket.basketId},
                    body: {email: data.email}
                })
            } else {
                await login.mutateAsync({username: data.email, password: data.password})

                const hasBasketItem = basket.productItems?.length > 0
                if (hasBasketItem) {
                    mergeBasket.mutate({
                        parameters: {
                            createDestinationBasket: true
                        }
                    })
                }
            }
            
            // Clear processing state and proceed to next step
            setIsProcessingAddressLogic(false)
            goToNextStep()
        } catch (error) {
            if (/Unauthorized/i.test(error.message)) {
                setError(
                    formatMessage({
                        defaultMessage: 'Incorrect username or password, please try again.',
                        id: 'contact_info.error.incorrect_username_or_password'
                    })
                )
            } else {
                setError(error.message)
            }
        }
    }

    return (
        <>
            <ToggleCard
                id="step-0"
                title={formatMessage({
                    defaultMessage: 'Contact',
                    id: 'checkout_contact_info.title.contact'
                })}
                editing={step === STEPS.CONTACT_INFO}
                isLoading={form.formState.isSubmitting || isProcessingAddressLogic}
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

                                <Stack spacing={5} position="relative">
                                    <Field 
                                        {...fields.email} 
                                        inputRef={emailRef}
                                        inputProps={{
                                            onBlur: handleEmailBlur,
                                            onFocus: handleEmailFocus,
                                            ...fields.email.inputProps
                                        }}
                                    />
                                </Stack>

                                <Stack spacing={3}>
                                    <LoginState
                                        form={form}
                                        isSocialEnabled={isSocialEnabled}
                                        idps={idps}
                                    />
                                    <Button type="submit">
                                        <FormattedMessage
                                            defaultMessage="Continue to Shipping Address"
                                            id="contact_info.button.continue_to_shipping_address"
                                        />
                                    </Button>
                                </Stack>
                            </Stack>

                            {/* OTP Auth Modal */}
                            <OtpAuth
                                isOpen={isOtpModalOpen} 
                                onClose={handleOtpModalClose}
                                form={form}
                                setShowOtpView={setShowOtpView}
                                handleSendEmailOtp={handleSendEmailOtp}
                                handleOtpVerification={handleOtpVerification}
                            />
                        </form>
                        
                    </Container>
                </ToggleCardEdit>

                {(customer?.email || form.getValues('email')) && (
                    <ToggleCardSummary>
                        {isProcessingAddressLogic ? (
                            <Stack spacing={2}>
                                <Text>{customer?.email || form.getValues('email')}</Text>
                                <Text color="blue.500" fontSize="sm" fontStyle="italic">
                                    <FormattedMessage
                                        defaultMessage="Checking for saved addresses..."
                                        id="contact_info.message.checking_addresses"
                                    />
                                </Text>
                            </Stack>
                        ) : (
                            <Text>{customer?.email || form.getValues('email')}</Text>
                        )}
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
    isPasswordlessEnabled: PropTypes.bool,
    idps: PropTypes.arrayOf(PropTypes.string),
    isProcessingAddressLogic: PropTypes.bool,
    setIsProcessingAddressLogic: PropTypes.func
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