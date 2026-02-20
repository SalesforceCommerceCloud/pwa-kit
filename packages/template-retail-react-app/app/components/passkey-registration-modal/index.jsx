/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Components
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth'
import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Alert,
    AlertIcon
} from '@salesforce/retail-react-app/app/components/shared/ui'

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
 * Modal for registering a new passkey with a nickname
 */
const PasskeyRegistrationModal = ({isOpen, onClose}) => {
    const {data: customer} = useCurrentCustomer()
    const {formatMessage} = useIntl()
    const [passkeyNickname, setPasskeyNickname] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isOtpAuthOpen, setIsOtpAuthOpen] = useState(false)

    const form = useForm()

    const config = getConfig()
    const webauthnConfig = config.app.login.passkey
    const authorizeWebauthnRegistration = useAuthHelper(AuthHelpers.AuthorizeWebauthnRegistration)
    const startWebauthnUserRegistration = useAuthHelper(AuthHelpers.StartWebauthnUserRegistration)
    const finishWebauthnUserRegistration = useAuthHelper(AuthHelpers.FinishWebauthnUserRegistration)

    const handleRegisterPasskey = async () => {
        setIsLoading(true)
        setError(null)

        try {
            await authorizeWebauthnRegistration.mutateAsync({
                user_id: customer.email,
                mode: webauthnConfig.mode,
                ...(webauthnConfig.mode === 'callback' && {
                    callback_uri: webauthnConfig.callbackURI
                })
            })

            // Open OTP auth modal
            onClose()
            setIsOtpAuthOpen(true)
        } catch (err) {
            // Set error message for the passkey registration modal
            setError(formatMessage(API_ERROR_MESSAGE))
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpVerification = async (code) => {
        setIsLoading(true)
        setError(null)

        try {
            // Step 1: Start WebAuthn registration
            const response = await startWebauthnUserRegistration.mutateAsync({
                user_id: customer.email,
                pwd_action_token: code,
                ...(passkeyNickname && {nick_name: passkeyNickname})
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

            // Step 6: Close OTP modal and main modal on success
            setIsOtpAuthOpen(false)
            onClose()

            return {success: true}
        } catch (err) {
            console.error('Error registering passkey:', err)
            const message = /Unauthorized/i.test(err.message)
                ? formatMessage(INVALID_TOKEN_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)

            // Return error result for OTP component to display
            return {
                success: false,
                error: message
            }
        } finally {
            setIsLoading(false)
        }
    }

    const resetState = () => {
        setPasskeyNickname('')
        setError(null)
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            resetState()
        }
    }, [isOpen])

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {formatMessage({
                            defaultMessage: 'Create Passkey',
                            id: 'passkey_registration.modal.title'
                        })}
                    </ModalHeader>
                    <ModalCloseButton
                        aria-label={formatMessage({
                            id: 'passkey_registration.modal.button.close.assistive_msg',
                            defaultMessage: 'Close passkey form'
                        })}
                        data-testid="passkey-registration-modal-close-button"
                    />
                    <ModalBody pb={6}>
                        {error && (
                            <Alert status="error" mb={4}>
                                <AlertIcon />
                                {error}
                            </Alert>
                        )}

                        <FormControl>
                            <FormLabel>
                                {formatMessage({
                                    defaultMessage: 'Passkey Nickname (optional)',
                                    id: 'passkey_registration.modal.label.nickname'
                                })}
                            </FormLabel>
                            <Input
                                placeholder="e.g., 'iPhone', 'Personal Laptop'"
                                value={passkeyNickname}
                                onChange={(e) => setPasskeyNickname(e.target.value)}
                                mb={4}
                                isDisabled={isLoading}
                            />
                            <Button
                                width="full"
                                colorScheme="blue"
                                onClick={handleRegisterPasskey}
                                isLoading={isLoading}
                                loadingText="Registering..."
                            >
                                {formatMessage({
                                    defaultMessage: 'Register Passkey',
                                    id: 'passkey_registration.modal.button.register'
                                })}
                            </Button>
                        </FormControl>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <OtpAuth
                isOpen={isOtpAuthOpen}
                onClose={() => setIsOtpAuthOpen(false)}
                form={form}
                handleSendEmailOtp={handleRegisterPasskey}
                handleOtpVerification={handleOtpVerification}
                isPasskeyRegistration={true}
                hideCheckoutAsGuestButton={true}
            />
        </>
    )
}

PasskeyRegistrationModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
}

export default PasskeyRegistrationModal
