/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
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
import {decode as base64Decode, encode as base64Encode} from 'base64-arraybuffer'

// WebAuthn configuration
const CLIENT_ID = 'd6ae9df8-e13f-48f4-a413-b9820d9a39bc'
const CLIENT_SECRET = '9MBWoGTfPmUsm9ityrAN'
const CHANNEL_ID = 'SiteGenesis'
const TENANT_ID = 'bldm_stg'

// Helper functions for base64url encoding/decoding
const base64urlToUint8Array = (base64url) => {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    return new Uint8Array(base64Decode(base64))
}

const uint8arrayToBase64url = (uint8array) => {
    const base64 = base64Encode(uint8array.buffer)
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

    const {getPasswordResetToken} = usePasswordReset()
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const passwordlessConfigCallback = getConfig().app.login?.passwordless?.callbackURI
    const callbackURL = isAbsoluteURL(passwordlessConfigCallback)
        ? passwordlessConfigCallback
        : `${appOrigin}${getEnvBasePath()}${passwordlessConfigCallback}`

    const {data: baskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId && !isServer, keepPreviousData: true}
    )
    const mergeBasket = useShopperBasketsMutation('mergeBasket')

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
        // Early return if conditional mediation is not available
        if (!window.PublicKeyCredential || !PublicKeyCredential.isConditionalMediationAvailable) {
            console.log('WebAuthN is not supported')
            return
        }

        // Check if conditional mediation is available
        const isCMA = await PublicKeyCredential.isConditionalMediationAvailable()
        if (!isCMA) {
            console.log('WebAuthN is not supported: Conditional mediation is not available')
            return
        }

        console.log('WebAuthN supported')
        try {
            // Step 1: Call /authenticate/start
            const startResponse = await fetch(
                `http://localhost:9020/api/v1/organizations/${TENANT_ID}/oauth2/webauthn/authenticate/start`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
                    },
                    body: new URLSearchParams({
                        client_id: CLIENT_ID,
                        channel_id: CHANNEL_ID,
                        ...(email && { user_id: email })
                    })
                }
            )

            if (!startResponse.ok) {
                throw new Error('WebAuthn /start failed')
            }

            const startData = await startResponse.json()
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
                    })),
                    signal: controller.signal,
                    // Request conditional mediation
                    mediation: 'conditional'
                }
            }

            // Step 3: Get the passkey credential
            console.log('WebAuthn calling navigator.credentials.get:', credentialRequestOptions)
            const credential = await navigator.credentials.get(credentialRequestOptions)
            
            if (!credential) {
                throw new Error('No credential returned')
            }

            // Step 4: Encode credential for /finish endpoint
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

            // Step 5: Call /authenticate/finish
            const finishRequest = {
                // email: email,
                client_id: CLIENT_ID,
                channel_id: CHANNEL_ID,
                credential: encodedCredential,
                ...(email && { user_id: email })
            }
            console.log('WebAuthn calling /authenticate/finish', finishRequest)
            const finishResponse = await fetch(
                `http://localhost:9020/api/v1/organizations/${TENANT_ID}/oauth2/webauthn/authenticate/finish`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(finishRequest)
                }
            )

            if (!finishResponse.ok) {
                throw new Error('WebAuthn authentication failed')
            }

            const finishData = await finishResponse.json()
            console.log('WebAuthn /authenticate/finish', finishData)
            
            // Close modal and navigate to account page
            onClose()
            // Should navigate to account page after login
            // navigate('/account')
            
            return true

        } catch (err) {
            // WebAuthn failed - will fall back to passwordless
            console.log('WebAuthn failed, falling back to passwordless:', err.message)
            return false
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
            // Prompt user to login with without username (discoverable credentials)
            handleWebAuthnLogin()
        }
    }, [isOpen])

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

        // Show a toast only for those registed users returning to the site.
        if (loggingIn) {
            // To simplify testing I trigger the register passkey flow from login
            // In reality this should be triggered only upon registration.
            setSessionJSONItem('newAccountCreated', true)
            // Execute action to be performed on successful login
            onLoginSuccess()
        }

        if (registering) {
            // Set flag for passkey toast on account page
            setSessionJSONItem('newAccountCreated', true)
            // Execute action to be performed on successful registration
            onRegistrationSuccess()
        }
    }, [isRegistered])

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
    const {passwordless = {}, social = {}, webauthn = {}} = getConfig().app.login || {}

    return {
        initialView,
        isOpen,
        onOpen,
        onClose,
        isPasswordlessEnabled: !!passwordless?.enabled,
        isSocialEnabled: !!social?.enabled,
        isWebAuthnEnabled: !!webauthn?.enabled,
        idps: social?.idps
    }
}
