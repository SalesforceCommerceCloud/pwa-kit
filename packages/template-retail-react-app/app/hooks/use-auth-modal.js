/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {defineMessage, useIntl} from 'react-intl'
import {useForm} from 'react-hook-form'
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    useDisclosure,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    AuthHelpers,
    useAuthHelper,
    useCustomer,
    useCustomerId,
    useCustomerType,
    useCustomerBaskets,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import LoginForm from '@salesforce/retail-react-app/app/components/login'
import ResetPasswordForm from '@salesforce/retail-react-app/app/components/reset-password'
import RegisterForm from '@salesforce/retail-react-app/app/components/register'
import PasswordlessEmailConfirmation from '@salesforce/retail-react-app/app/components/email-confirmation/index'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {
    API_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE,
    PASSWORDLESS_ERROR_MESSAGES
} from '@salesforce/retail-react-app/app/constants'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {usePrevious} from '@salesforce/retail-react-app/app/hooks/use-previous'
import {usePasswordReset} from '@salesforce/retail-react-app/app/hooks/use-password-reset'
import {isServer, setSessionJSONItem} from '@salesforce/retail-react-app/app/utils/utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getEnvBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {usePasskeyRegistration} from '@salesforce/retail-react-app/app/hooks/use-passkey-registration'

// WebAuthn configuration - these should come from config
// Hardcoded values removed - will use config values below

// Helper functions for base64url encoding/decoding using native browser APIs
const base64urlToUint8Array = (base64url) => {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

const uint8arrayToBase64url = (uint8array) => {
    let binary = ''
    for (let i = 0; i < uint8array.byteLength; i++) {
        binary += String.fromCharCode(uint8array[i])
    }
    const base64 = btoa(binary)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export const LOGIN_VIEW = 'login'
export const REGISTER_VIEW = 'register'
export const PASSWORD_VIEW = 'password'
export const EMAIL_VIEW = 'email'

const LOGIN_ERROR = defineMessage({
    defaultMessage: "Something's not right with your email or password. Try again.",
    id: 'auth_modal.error.incorrect_email_or_password'
})

export const AuthModal = ({
    initialView = LOGIN_VIEW,
    initialEmail = '',
    onLoginSuccess = noop,
    onRegistrationSuccess = noop,
    isOpen,
    onOpen,
    onClose,
    isPasswordlessEnabled = false,
    isSocialEnabled = false,
    isWebAuthnEnabled = false,
    idps = [],
    ...props
}) => {
    const {formatMessage} = useIntl()
    const customerId = useCustomerId()
    const {isRegistered, customerType} = useCustomerType()
    const prevAuthType = usePrevious(customerType)

    const customer = useCustomer(
        {parameters: {customerId}},
        {enabled: !!customerId && isRegistered}
    )

    const navigate = useNavigation()
    const [currentView, setCurrentView] = useState(initialView)
    const form = useForm()
    const toast = useToast()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const register = useAuthHelper(AuthHelpers.Register)
    const appOrigin = useAppOrigin()
    const config = getConfig()
    
    // Track if a WebAuthn request is in progress to prevent "A request is already pending" error
    const webAuthnInProgress = useRef(false)
    // AbortController to cancel pending WebAuthn requests
    const webAuthnAbortController = useRef(null)

    const {getPasswordResetToken} = usePasswordReset()
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const startWebauthnAuth = useAuthHelper(AuthHelpers.StartWebauthnAuthentication)
    const finishWebauthnAuth = useAuthHelper(AuthHelpers.FinishWebauthnAuthentication)
    const passwordlessConfigCallback = config.app.login?.passwordless?.callbackURI
    const callbackURL = isAbsoluteURL(passwordlessConfigCallback)
        ? passwordlessConfigCallback
        : `${appOrigin}${getEnvBasePath()}${passwordlessConfigCallback}`

    const {data: baskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId && !isServer, keepPreviousData: true}
    )
    const mergeBasket = useShopperBasketsMutation('mergeBasket')

    const {showToast} = usePasskeyRegistration()

    const handlePasswordlessLogin = async (email) => {
        try {
            const redirectPath = window.location.pathname + (window.location.search || '')
            await authorizePasswordlessLogin.mutateAsync({
                userid: email,
                callbackURI: `${callbackURL}?redirectUrl=${redirectPath}`
            })
            setCurrentView(EMAIL_VIEW)
        } catch (error) {
            const message = PASSWORDLESS_ERROR_MESSAGES.some((msg) => msg.test(error.message))
                ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    const handleWebAuthnLogin = async (email = '') => {
        // Abort any existing pending WebAuthn request
        if (webAuthnAbortController.current) {
            console.log('Aborting previous WebAuthn request')
            webAuthnAbortController.current.abort()
            webAuthnAbortController.current = null
        }

        // Early return if conditional mediation is not available
        if (!window.PublicKeyCredential || !PublicKeyCredential.isConditionalMediationAvailable) {
            console.log('WebAuthN is not supported')
            return false
        }

        // Check if conditional mediation is available
        const isCMA = await PublicKeyCredential.isConditionalMediationAvailable()
        if (!isCMA) {
            console.log('WebAuthN is not supported: Conditional mediation is not available')
            return false
        }

        console.log('WebAuthN supported')
        webAuthnInProgress.current = true
        
        // Create a new AbortController for this request
        webAuthnAbortController.current = new AbortController()
        
        try {
            // Step 1: Start WebAuthn authentication using commerce-sdk-react
            const startData = await startWebauthnAuth.mutateAsync({
                ...(email && { user_id: email })
            })
            
            console.log('WebAuthn /start', startData)
            
            // Step 2: Transform response for WebAuthn API
            const credentialRequestOptions = {
                publicKey: {
                    challenge: base64urlToUint8Array(startData.publicKey.challenge),
                    timeout: startData.publicKey.timeout || 60000,
                    rpId: startData.publicKey.rpId,
                    allowCredentials: (startData.publicKey.allowCredentials || []).map(credential => ({
                        type: credential.type || 'public-key',
                        id: base64urlToUint8Array(credential.id),
                        transports: credential.transports
                    }))
                }
            }

            // Step 3: Get the passkey credential
            // Use 'conditional' for discoverable credentials (autofill in input field)
            // Use 'optional' for non-discoverable (shows browser modal dialog)
            const mediationMode = email ? 'optional' : 'conditional'
            console.log(`WebAuthn calling navigator.credentials.get with mediation: ${mediationMode}`, credentialRequestOptions)
            const credential = await navigator.credentials.get({
                ...credentialRequestOptions,
                mediation: mediationMode,
                signal: webAuthnAbortController.current.signal
            })
            
            if (!credential) {
                throw new Error('No credential returned')
            }

            // Step 4: Encode credential for finish endpoint
            const encodedCredential = {
                id: credential.id,
                rawId: uint8arrayToBase64url(new Uint8Array(credential.rawId)),
                type: credential.type,
                clientExtensionResults: credential.getClientExtensionResults(),
                response: {
                    authenticatorData: uint8arrayToBase64url(
                        new Uint8Array(credential.response.authenticatorData)
                    ),
                    clientDataJSON: uint8arrayToBase64url(
                        new Uint8Array(credential.response.clientDataJSON)
                    ),
                    signature: uint8arrayToBase64url(
                        new Uint8Array(credential.response.signature)
                    ),
                    userHandle: credential.response.userHandle
                        ? uint8arrayToBase64url(new Uint8Array(credential.response.userHandle))
                        : null
                }
            }

            // Step 5: Finish WebAuthn authentication using commerce-sdk-react
            const finishRequest = {
                credential: encodedCredential,
                ...(email && { user_id: email })
            }
            console.log('WebAuthn calling /authenticate/finish', finishRequest)
            const finishData = await finishWebauthnAuth.mutateAsync(finishRequest)
            
            console.log('WebAuthn /authenticate/finish', finishData)
            
            // Close modal - the auth success will be handled by useEffect
            onClose()
            
            return true

        } catch (err) {
            // Check if this was an intentional abort
            if (err.name === 'AbortError') {
                console.log('WebAuthn request was aborted')
                return false
            }
            
            // For non-discoverable credentials (with email), fall back to passwordless
            if (email) {
                console.log('WebAuthn failed, falling back to passwordless:', err.message)
                return false
            }
            
            // For discoverable credentials, just log the error and don't fall back
            // The user can still manually enter email/password if needed
            console.log('WebAuthn conditional mediation error:', err.message)
            return false
        } finally {
            // Reset the flag and clear the controller reference
            webAuthnInProgress.current = false
            webAuthnAbortController.current = null
        }
    }

    const submitForm = async (data, isPasswordless = false) => {
        form.clearErrors()

        const onLoginSuccess = () => {
            navigate('/account')
        }

        return {
            login: async (data) => {
                if (isPasswordless) {
                    const email = data.email
                    // Try WebAuthn first if enabled
                    if (isWebAuthnEnabled) {
                        console.log('WebAuthn enabled, trying to login with WebAuthn')
                        // Prompt user to login with username (non-discoverable credentials)
                        const webAuthnSuccess = await handleWebAuthnLogin(email)
                        if (webAuthnSuccess) {
                            return // WebAuthn succeeded, we're done
                        }
                        // WebAuthn failed, fall through to passwordless
                    }
                    await handlePasswordlessLogin(email)
                    return
                }

                try {
                    await login.mutateAsync({
                        username: data.email,
                        password: data.password
                    })
                    const hasBasketItem = baskets?.baskets?.[0]?.productItems?.length > 0
                    // we only want to merge basket when the user is logged in as a recurring user
                    // only recurring users trigger the login mutation, new user triggers register mutation
                    // this logic needs to stay in this block because this is the only place that tells if a user is a recurring user
                    // if you change logic here, also change it in login page
                    const shouldMergeBasket = hasBasketItem && prevAuthType === 'guest'
                    if (shouldMergeBasket) {
                        mergeBasket.mutate({
                            headers: {
                                // This is not required since the request has no body
                                // but CommerceAPI throws a '419 - Unsupported Media Type' error if this header is removed.
                                'Content-Type': 'application/json'
                            },
                            parameters: {
                                createDestinationBasket: true
                            }
                        })
                    }
                } catch (error) {
                    const message = /Unauthorized/i.test(error.message)
                        ? formatMessage(LOGIN_ERROR)
                        : formatMessage(API_ERROR_MESSAGE)
                    form.setError('global', {type: 'manual', message})
                }
            },
            register: async (data) => {
                try {
                    const body = {
                        customer: {
                            firstName: data.firstName,
                            lastName: data.lastName,
                            email: data.email,
                            login: data.email
                        },
                        password: data.password
                    }

                    await register.mutateAsync(body)
                    onLoginSuccess()
                } catch (error) {
                    form.setError('global', {
                        type: 'manual',
                        message: formatMessage(API_ERROR_MESSAGE)
                    })
                }
            },
            password: async (data) => {
                try {
                    await getPasswordResetToken(data.email)
                } catch (e) {
                    const message =
                        e.response?.status === 400
                            ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                            : formatMessage(API_ERROR_MESSAGE)
                    form.setError('global', {type: 'manual', message})
                }
            },
            email: async () => {
                const email = form.getValues().email || initialEmail
                await handlePasswordlessLogin(email)
            }
        }[currentView](data)
    }

    // Reset form and local state when opening the modal
    useEffect(() => {
        if (isOpen) {
            setCurrentView(initialView)
            form.reset()
            // Prompt user to login without username (discoverable credentials)
            handleWebAuthnLogin()
        } else {
            // Abort any pending WebAuthn request when modal closes
            if (webAuthnAbortController.current) {
                console.log('Modal closed, aborting WebAuthn request')
                webAuthnAbortController.current.abort()
                webAuthnAbortController.current = null
            }
            webAuthnInProgress.current = false
        }
    }, [isOpen])

    // Cleanup: abort pending WebAuthn request on component unmount
    useEffect(() => {
        return () => {
            if (webAuthnAbortController.current) {
                console.log('Component unmounting, aborting WebAuthn request')
                webAuthnAbortController.current.abort()
            }
        }
    }, [])

    // Auto-focus the first field in each form view
    useEffect(() => {
        const initialField = {
            [LOGIN_VIEW]: 'email',
            [REGISTER_VIEW]: 'firstName',
            [PASSWORD_VIEW]: 'email'
        }[currentView]
        const fieldsRef = form.control?.fieldsRef?.current
        fieldsRef?.[initialField]?.ref.focus()
    }, [form.control?.fieldsRef?.current])

    useEffect(() => {
        // we don't want to reset the form on email view
        // because we want to pass the email to PasswordlessEmailConfirmation
        if (currentView !== EMAIL_VIEW) {
            form.reset()
        }
    }, [currentView])

    useEffect(() => {
        // Lets determine if the user has either logged in, or registed.
        const loggingIn = currentView === LOGIN_VIEW
        const registering = currentView === REGISTER_VIEW
        const isNowRegistered = isOpen && isRegistered && (loggingIn || registering)
        // If the customer changed, but it's not because they logged in or registered. Do nothing.
        if (!isNowRegistered) {
            return
        }

        // We are done with the modal.
        onClose()

        if (config?.app?.login?.passkey?.enabled) {
            // Show passkey registration modal only if Webauthn feature flag is enabled and compatible with the browser
            if (
                window.PublicKeyCredential &&
                window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
                window.PublicKeyCredential.isConditionalMediationAvailable
            ) {
                Promise.all([
                    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),

                    window.PublicKeyCredential.isConditionalMediationAvailable()
                ]).then((results) => {
                    if (results.every((r) => r === true)) {
                        showToast()
                    }
                })
            }
        }

        // Show a toast only for those registed users returning to the site.
        // Only show toast when customer data is available (user is logged in and data is loaded)
        if (loggingIn && customer.data) {
            toast({
                variant: 'subtle',
                title: `${formatMessage(
                    {
                        defaultMessage: 'Welcome {name},',
                        id: 'auth_modal.info.welcome_user'
                    },
                    {
                        name: customer.data?.firstName || ''
                    }
                )}`,
                description: `${formatMessage({
                    defaultMessage: "You're now signed in.",
                    id: 'auth_modal.description.now_signed_in'
                })}`,
                status: 'success',
                position: 'top-right',
                isClosable: true
            })

            // Execute action to be performed on successful login
            onLoginSuccess()
        }

        if (registering) {
            // Set flag for passkey toast on account page
            setSessionJSONItem('newAccountCreated', true)
            // Execute action to be performed on successful registration
            onRegistrationSuccess()
        }
    }, [isRegistered, customer.data])

    const onBackToSignInClick = () =>
        initialView === PASSWORD_VIEW ? onClose() : setCurrentView(LOGIN_VIEW)

    return (
        <>
            <Modal
                size="sm"
                closeOnOverlayClick={false}
                data-testid="sf-auth-modal"
                isOpen={isOpen}
                onOpen={onOpen}
                onClose={onClose}
                {...props}
            >
            <ModalOverlay />
            <ModalContent>
                <ModalCloseButton
                    aria-label={formatMessage({
                        id: 'auth_modal.button.close.assistive_msg',
                        defaultMessage: 'Close login form'
                    })}
                />
                <ModalBody pb={8} bg="white" paddingBottom={14} marginTop={14}>
                    {!form.formState.isSubmitSuccessful && currentView === LOGIN_VIEW && (
                        <LoginForm
                            form={form}
                            submitForm={(data) => {
                                const shouldUsePasswordless =
                                    isPasswordlessEnabled && !data.password
                                return submitForm(data, shouldUsePasswordless)
                            }}
                            clickCreateAccount={() => setCurrentView(REGISTER_VIEW)}
                            //TODO: potentially remove this prop in the next major release since
                            // we don't need to use this props anymore
                            handlePasswordlessLoginClick={noop}
                            handleForgotPasswordClick={() => setCurrentView(PASSWORD_VIEW)}
                            isPasswordlessEnabled={isPasswordlessEnabled}
                            isSocialEnabled={isSocialEnabled}
                            idps={idps}
                            setLoginType={noop}
                        />
                    )}
                    {!form.formState.isSubmitSuccessful && currentView === REGISTER_VIEW && (
                        <RegisterForm
                            form={form}
                            submitForm={submitForm}
                            clickSignIn={onBackToSignInClick}
                        />
                    )}
                    {currentView === PASSWORD_VIEW && (
                        <ResetPasswordForm
                            form={form}
                            submitForm={submitForm}
                            clickSignIn={onBackToSignInClick}
                        />
                    )}
                    {currentView === EMAIL_VIEW && (
                        <PasswordlessEmailConfirmation
                            form={form}
                            submitForm={submitForm}
                            email={form.getValues().email || initialEmail}
                        />
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
        </>
    )
}

AuthModal.propTypes = {
    initialView: PropTypes.oneOf([LOGIN_VIEW, REGISTER_VIEW, PASSWORD_VIEW, EMAIL_VIEW]),
    initialEmail: PropTypes.string,
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onLoginSuccess: PropTypes.func,
    onRegistrationSuccess: PropTypes.func,
    isPasswordlessEnabled: PropTypes.bool,
    isSocialEnabled: PropTypes.bool,
    isWebAuthnEnabled: PropTypes.bool,
    idps: PropTypes.arrayOf(PropTypes.string)
}

/**
 *
 * @param {('register'|'login'|'password'|'email')} initialView - the initial view for the modal
 * @returns {Object} - Object props to be spread on to the AuthModal component
 */
export const useAuthModal = (initialView = LOGIN_VIEW) => {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const {passwordless = {}, social = {}, passkey = {}} = getConfig().app.login || {}

    return {
        initialView,
        isOpen,
        onOpen,
        onClose,
        isPasswordlessEnabled: !!passwordless?.enabled,
        isSocialEnabled: !!social?.enabled,
        isWebAuthnEnabled: !!passkey?.enabled,
        idps: social?.idps
    }
}
