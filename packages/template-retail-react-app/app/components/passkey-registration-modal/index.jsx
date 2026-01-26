/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* global PublicKeyCredential */

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
import {encode as base64Encode} from 'base64-arraybuffer'

// SDK
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react'

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

    const uint8arrayToBase64url = (input) => {
        const uint8array = new Uint8Array(input)
        const base64 = base64Encode(uint8array.buffer)
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

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
            setError(
                err.message ||
                    formatMessage({
                        id: 'passkey_registration.modal.error.authorize_failed',
                        defaultMessage: 'Failed to authorize passkey registration'
                    })
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpVerification = async (code) => {
        try {
            setIsLoading(true)

            // Step 1: Start WebAuthn registration with OTP code as pwd_action_token
            const startResponse = await startWebauthnUserRegistration.mutateAsync({
                user_id: customer.email,
                pwd_action_token: code,
                ...(passkeyNickname && {nick_name: passkeyNickname})
            })

            console.log('creationOptions', startResponse)
            const options = PublicKeyCredential.parseCreationOptionsFromJSON(startResponse)

            // Step 3: Create passkey credential using browser WebAuthn API
            // https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/create
            const credential = await navigator.credentials.create({
                publicKey: options
            })

            if (!credential) {
                throw new Error('Failed to create passkey credential')
            }

            // Step 4: Encode credential before sending to SLAS
            // https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/toJSON
            let encodedCredential
            try {
                encodedCredential = credential.toJSON()
            } catch (error) {
                // Fallback to manual encoding if toJSON() fails
                // Some passkey providers may not support the toJSON() method
                encodedCredential = {
                    id: credential.id,
                    rawId: uint8arrayToBase64url(credential.rawId),
                    type: credential.type,
                    clientExtensionResults: credential.getClientExtensionResults(),
                    response: {
                        attestationObject: uint8arrayToBase64url(
                            credential.response.attestationObject
                        ),
                        clientDataJSON: uint8arrayToBase64url(credential.response.clientDataJSON)
                    }
                }
            }

            // Step 5: Finish WebAuthn registration
            await finishWebauthnUserRegistration.mutateAsync({
                username: customer.email,
                credential: encodedCredential,
                pwd_action_token: code
            })

            // Close OTP modal on success
            setIsOtpAuthOpen(false)
            onClose()

            return {success: true}
        } catch (err) {
            const errorMessage =
                err.message ||
                formatMessage({
                    id: 'passkey_registration.modal.error.registration_failed',
                    defaultMessage: 'Failed to register passkey'
                })
            return {
                success: false,
                error: errorMessage
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
