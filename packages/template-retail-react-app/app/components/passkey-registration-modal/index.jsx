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
    AlertIcon,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Hooks
import {useForm} from 'react-hook-form'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

// Utils
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// SDK
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react'

// Helper functions for base64url encoding/decoding
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
    for (let i = 0; i < uint8array.length; i++) {
        binary += String.fromCharCode(uint8array[i])
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Modal for registering a new passkey with a nickname
 */
const PasskeyRegistrationModal = ({isOpen, onClose}) => {
    const {data: customer, isLoading: isCustomerLoading} = useCurrentCustomer()
    const {formatMessage} = useIntl()
    const toast = useToast()
    const [passkeyNickname, setPasskeyNickname] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isOtpAuthOpen, setIsOtpAuthOpen] = useState(false)

    // Debug: Log customer data
    console.log('PasskeyRegistrationModal - Customer data:', customer)
    console.log('PasskeyRegistrationModal - Customer email:', customer?.email)

    const form = useForm()

    const config = getConfig()
    const webauthnConfig = config?.app?.login?.passkey || {}
    const authorizeWebauthnRegistration = useAuthHelper(AuthHelpers.AuthorizeWebauthnRegistration)
    const startWebauthnUserRegistration = useAuthHelper(AuthHelpers.StartWebauthnUserRegistration)
    const finishWebauthnUserRegistration = useAuthHelper(AuthHelpers.FinishWebauthnUserRegistration)

    const handleRegisterPasskey = async () => {
        setIsLoading(true)
        setError(null)

        try {
            if (!customer?.email) {
                throw new Error('Customer email is required for passkey registration')
            }

            const mode = webauthnConfig?.mode || 'callback'
            
            await authorizeWebauthnRegistration.mutateAsync({
                user_id: customer.email,
                mode: mode,
                ...(mode === 'callback' && webauthnConfig?.callbackURI && {
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
            console.log('Starting WebAuthn registration with OTP:', code)
            
            // Step 1: Start WebAuthn registration with OTP
            const startData = await startWebauthnUserRegistration.mutateAsync({
                pwd_action_token: code,
                user_id: customer.email,
                ...(passkeyNickname && {nick_name: passkeyNickname}),
                ...(customer.firstName && customer.lastName && {
                    display_name: `${customer.firstName} ${customer.lastName}`
                })
            })
            
            console.log('WebAuthn registration start response:', startData)
            
            // The response might be directly the publicKey options or nested under publicKey
            const pkOptions = startData.publicKey || startData
            
            if (!pkOptions.challenge) {
                console.error('Invalid response structure:', startData)
                throw new Error('Invalid response from registration start endpoint: missing challenge')
            }
            
            // Step 2: Transform response for WebAuthn API
            const publicKeyOptions = {
                challenge: base64urlToUint8Array(pkOptions.challenge),
                rp: pkOptions.rp,
                user: {
                    id: base64urlToUint8Array(pkOptions.user.id),
                    name: pkOptions.user.name,
                    displayName: pkOptions.user.displayName
                },
                pubKeyCredParams: pkOptions.pubKeyCredParams,
                timeout: pkOptions.timeout || 60000,
                attestation: pkOptions.attestation || 'none',
                authenticatorSelection: pkOptions.authenticatorSelection || {}
            }
            
            // Step 3: Create the passkey credential
            console.log('Calling navigator.credentials.create:', publicKeyOptions)
            const credential = await navigator.credentials.create({
                publicKey: publicKeyOptions
            })
            
            if (!credential) {
                throw new Error('No credential created')
            }
            
            console.log('Credential created:', credential)
            
            // Step 4: Encode credential for finish endpoint
            const encodedCredential = {
                id: credential.id,
                rawId: uint8arrayToBase64url(new Uint8Array(credential.rawId)),
                type: credential.type,
                clientExtensionResults: credential.getClientExtensionResults(),
                response: {
                    clientDataJSON: uint8arrayToBase64url(
                        new Uint8Array(credential.response.clientDataJSON)
                    ),
                    attestationObject: uint8arrayToBase64url(
                        new Uint8Array(credential.response.attestationObject)
                    )
                }
            }
            
            // Step 5: Finish WebAuthn registration
            console.log('Finishing WebAuthn registration with credential')
            await finishWebauthnUserRegistration.mutateAsync({
                username: customer.email,
                credential: encodedCredential,
                pwd_action_token: code
            })
            
            console.log('Passkey registration completed successfully!')
            
            // Show success message
            toast({
                title: formatMessage({
                    id: 'passkey_registration.success.title',
                    defaultMessage: 'Passkey Created'
                }),
                description: formatMessage({
                    id: 'passkey_registration.success.description',
                    defaultMessage: 'Your passkey has been registered successfully!'
                }),
                status: 'success',
                duration: 5000,
                isClosable: true
            })
            
            // Close OTP modal on success
            setIsOtpAuthOpen(false)
            
            return {success: true}
        } catch (err) {
            console.error('WebAuthn registration failed:', err)
            const errorMessage = err.message ||
                formatMessage({
                    id: 'passkey_registration.modal.error.registration_failed',
                    defaultMessage: 'Failed to register passkey'
                })
            
            // Show error toast
            toast({
                title: formatMessage({
                    id: 'passkey_registration.error.title',
                    defaultMessage: 'Registration Failed'
                }),
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true
            })
            
            setError(errorMessage)
            setIsOtpAuthOpen(false)
            
            return {success: false, error: err.message}
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

                        {isCustomerLoading && (
                            <Alert status="info" mb={4}>
                                <AlertIcon />
                                Loading customer data...
                            </Alert>
                        )}

                        {!isCustomerLoading && !customer?.email && (
                            <Alert status="warning" mb={4}>
                                <AlertIcon />
                                Please log in to register a passkey. Customer email: {customer?.email || 'undefined'}
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
                                isLoading={isLoading || isCustomerLoading}
                                isDisabled={!customer?.email || isCustomerLoading}
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
