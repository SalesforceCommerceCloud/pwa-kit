/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Components
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth'

// Hooks
import {useForm} from 'react-hook-form'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

// Utils
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {arrayBufferToBase64Url} from '@salesforce/retail-react-app/app/utils/utils'

// SDK
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react'

// Constants
import {
    API_ERROR_MESSAGE,
    INVALID_TOKEN_ERROR_MESSAGE
} from '@salesforce/retail-react-app/app/constants'

/**
 * Modal for registering a new passkey
 */
const PasskeyRegistrationModal = ({isOpen, onClose}) => {
    const {data: customer} = useCurrentCustomer()
    const {formatMessage} = useIntl()

    const form = useForm()

    const config = getConfig()
    const webauthnConfig = config.app.login.passkey
    const authorizeWebauthnRegistration = useAuthHelper(AuthHelpers.AuthorizeWebauthnRegistration)
    const startWebauthnUserRegistration = useAuthHelper(AuthHelpers.StartWebauthnUserRegistration)
    const finishWebauthnUserRegistration = useAuthHelper(AuthHelpers.FinishWebauthnUserRegistration)

    const handleRegisterPasskey = async () => {
        try {
            await authorizeWebauthnRegistration.mutateAsync({
                user_id: customer.email,
                mode: webauthnConfig.mode,
                ...(webauthnConfig.mode === 'callback' && {
                    callback_uri: webauthnConfig.callbackURI
                })
            })
        } catch (err) {
            // TODO: Propogate error to OTP modal
            form.setError('global', {type: 'manual', message: formatMessage(API_ERROR_MESSAGE)})
        }
    }

    const handleOtpVerification = async (code) => {
        try {
            // Step 1: Start WebAuthn registration
            const response = await startWebauthnUserRegistration.mutateAsync({
                user_id: customer.email,
                pwd_action_token: code
            })

            // Step 2: Convert response to WebAuthn PublicKeyCredentialCreationOptions format
            const publicKey = window.PublicKeyCredential.parseCreationOptionsFromJSON(response)

            // Step 3: Call navigator.credentials.create()
            if (!navigator.credentials || !navigator.credentials.create) {
                throw new Error('WebAuthn API not available in this browser')
            }

            // navigator.credentials.create() will show a browser/system prompt
            // This may appear to hang if the user doesn't interact with the prompt
            const credential = await navigator.credentials.create({publicKey})

            if (!credential) {
                throw new Error('Failed to create credential: user cancelled or operation failed')
            }

            // Step 4: Convert credential to JSON format before sending to SLAS
            // https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/toJSON
            let credentialJson
            try {
                credentialJson = credential.toJSON()
            } catch (error) {
                // Fallback to manual encoding if toJSON() fails
                // Some passkey providers (e.g., 1Password) may not support the toJSON() method and return an error
                const clientExtensionResults = credential.getClientExtensionResults?.() || {}
                credentialJson = {
                    type: credential.type,
                    id: credential.id,
                    rawId: arrayBufferToBase64Url(credential.rawId),
                    response: {
                        attestationObject: arrayBufferToBase64Url(
                            credential.response.attestationObject
                        ),
                        clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON)
                    },
                    ...(Object.keys(clientExtensionResults).length > 0 && {clientExtensionResults})
                }
            }

            // Step 5: Finish WebAuthn registration
            await finishWebauthnUserRegistration.mutateAsync({
                username: customer.email,
                credential: credentialJson,
                pwd_action_token: code
            })

            // Step 6: Close on success
            onClose()

            return {success: true}
        } catch (err) {
            console.error('Error registering passkey:', err)
            const message = /401/.test(err.message)
                ? formatMessage(INVALID_TOKEN_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)

            // Return error result for OTP component to display
            return {
                success: false,
                error: message
            }
        }
    }

    // Trigger registration automatically when modal opens
    useEffect(() => {
        if (isOpen) {
            handleRegisterPasskey()
        }
    }, [isOpen])

    return (
        <OtpAuth
            isOpen={isOpen}
            onClose={onClose}
            form={form}
            handleSendEmailOtp={handleRegisterPasskey}
            handleOtpVerification={handleOtpVerification}
            isPasskeyRegistration={true}
            hideCheckoutAsGuestButton={true}
        />
    )
}

PasskeyRegistrationModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
}

export default PasskeyRegistrationModal
