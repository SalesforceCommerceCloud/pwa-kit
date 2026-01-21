/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {decode as base64Decode, encode as base64Encode} from 'base64-arraybuffer'
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
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Convert base64url string to Uint8Array
 * WebAuthn requires binary data, but API returns base64url strings
 */
const base64urlToUint8Array = (base64url) => {
    // Add padding and convert base64url to base64
    const padding = '===='.substring(0, (4 - (base64url.length % 4)) % 4)
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
    return new Uint8Array(base64Decode(base64))
}

/**
 * Convert Uint8Array to base64url string
 * Server expects base64url strings, not binary data
 */
const uint8arrayToBase64url = (bytes) => {
    const uint8array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
    return base64Encode(uint8array.buffer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Modal for registering a new passkey with a nickname
 */
const PasskeyRegistrationModal = ({isOpen, onClose}) => {
    const {formatMessage} = useIntl()
    const [passkeyNickname, setPasskeyNickname] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [step, setStep] = useState('register') // 'register' or 'verification'
    const [verificationCode, setVerificationCode] = useState('')
    const {data: customer} = useCurrentCustomer()
    
    const config = getConfig()
    const commerceAPI = config.app.commerceAPI
    const webauthnConfig = config.app.login.webauthn

    // Hardcoded values for local SLAS development
    // TODO: Move these to config or let them be pulled in automatically by Commerce SDK
    const CLIENT_ID = 'd6ae9df8-e13f-48f4-a413-b9820d9a39bc'
    const CLIENT_SECRET = '9MBWoGTfPmUsm9ityrAN'
    const TENANT_ID = 'bldm_stg'
    const CALLBACK_URI = 'http://localhost:9010/callback'
    const SITE_ID = 'SiteGenesis'

    const handleResendCode = async () => {
        await handleRegisterPasskey()
    }

    const handleRegisterPasskey = async () => {
        setIsLoading(true)
        setError(null)
        
        // THE API CALL TO /oauth2/webauthn/register/authorize SHOULD BE REPLACED BY A COMMERCE SDK CALL
        try {
            const params = new URLSearchParams({
                channel_id: SITE_ID,
                user_id: customer.email,
                mode: 'callback',
                client_id: CLIENT_ID,
                callback_uri: CALLBACK_URI
            })

            console.log('webauthn/register/authorize params:', params.toString())

            await fetch(
                `http://localhost:9020/api/v1/organizations/${TENANT_ID}/oauth2/webauthn/register/authorize`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
                    },
                    body: params.toString()
                }
            )
            
            console.log('Passkey registration initiated. Check SLAS for OTP')
            console.log('Passkey nickname:', passkeyNickname)
            
            // Move to verification step
            setStep('verification')
        } catch (err) {
            console.error('Error authorizing passkey registration:', err)
            setError(err.message || 'Failed to authorize passkey registration')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerificationCodeChange = (value) => {
        setVerificationCode(value)
        
        // Auto-submit when 8 digits are entered
        if (value.length === 8) {
            handleVerifyCode(value)
        }
    }

    const handleVerifyCode = async (code) => {
        setIsLoading(true)
        setError(null)
        
        try {
            const params = new URLSearchParams({
                channel_id: SITE_ID,
                client_id: CLIENT_ID,
                user_id: customer.email,
                pwd_action_token: code,
                display_name: customer?.email,
                nick_name: passkeyNickname
            })
            console.log('webauthn/register/start params:', params.toString())

            const response = await fetch(
                `http://localhost:9020/api/v1/organizations/${TENANT_ID}/oauth2/webauthn/register/start`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
                    },
                    body: params.toString()
                }
            )
            const data = await response.json()
            
            console.log('Registration started response:', data)
            
            // Transform base64url strings to Uint8Array for WebAuthn API
            // The response is already the publicKey object, so we wrap it
            const credentialCreateOptions = {
                publicKey: {
                    ...data,
                    challenge: base64urlToUint8Array(data.challenge),
                    user: {
                        ...data.user,
                        id: base64urlToUint8Array(data.user.id)
                    },
                    excludeCredentials: data.excludeCredentials?.map(credential => ({
                        ...credential,
                        id: base64urlToUint8Array(credential.id)
                    })) || []
                }
            }
            
            console.log('Transformed credential options:', credentialCreateOptions)
            
            // Create the passkey credential using WebAuthn API
            console.log('Calling navigator.credentials.create()...')
            const credential = await navigator.credentials.create(credentialCreateOptions)
            console.log('Credential created:', credential)
            
            // Transform credential - encode ArrayBuffers to base64url for JSON serialization
            const encodedCredential = {
                type: credential.type,
                id: credential.id,
                response: {
                    attestationObject: uint8arrayToBase64url(new Uint8Array(credential.response.attestationObject)),
                    clientDataJSON: uint8arrayToBase64url(new Uint8Array(credential.response.clientDataJSON)),
                    transports: credential.response.getTransports ? credential.response.getTransports() : []
                },
                clientExtensionResults: credential.getClientExtensionResults()
            }
            
            console.log('Encoded credential:', encodedCredential)
            
            // Call /finish endpoint to complete registration
            const finishRequest = {
                client_id: CLIENT_ID,
                username: customer.email,
                channel_id: SITE_ID,
                pwd_action_token: code,
                credentialNickName: passkeyNickname,
                credential: encodedCredential
            }
            
            console.log('Calling /finish endpoint...')
            const finishResponse = await fetch(
                `http://localhost:9020/api/v1/organizations/${TENANT_ID}/oauth2/webauthn/register/finish`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finishRequest)
                }
            )
            
            const finishData = await finishResponse.json()
            console.log('Finish response:', finishData)
            
            handleClose()
        } catch (err) {
            console.error('Error starting passkey registration:', err)
            setError(err.message || 'Failed to start passkey registration')
        } finally {
            setIsLoading(false)
        }
    }

    const resetState = () => {
        setStep('register')
        setPasskeyNickname('')
        setVerificationCode('')
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
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {step === 'register'
                        ? formatMessage({
                              defaultMessage: 'Create Passkey',
                              id: 'auth_modal.passkey.title'
                          })
                        : formatMessage({
                              defaultMessage: 'Verify Your Email',
                              id: 'auth_modal.passkey.verification.title'
                          })}
                </ModalHeader>
                <ModalCloseButton
                    aria-label={formatMessage({
                        id: 'auth_modal.passkey.button.close.assistive_msg',
                        defaultMessage: 'Close passkey form'
                    })}
                />
                <ModalBody pb={6}>
                    {error && (
                        <Alert status="error" mb={4}>
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    {step === 'register' ? (
                        <FormControl>
                            <FormLabel>
                                {formatMessage({
                                    defaultMessage: 'Passkey Nickname',
                                    id: 'auth_modal.passkey.label.nickname'
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
                                    id: 'auth_modal.passkey.button.register'
                                })}
                            </Button>
                        </FormControl>
                    ) : (
                        <FormControl>
                            <Text mb={4}>
                                {formatMessage(
                                    {
                                        defaultMessage:
                                            'We sent an 8-digit code to your email: {email}. Enter the code to confirm your identity and your account.',
                                        id: 'auth_modal.passkey.verification.message'
                                    },
                                    {email: customer?.email}
                                )}
                            </Text>
                            <FormLabel>
                                {formatMessage({
                                    defaultMessage: 'Verification Code',
                                    id: 'auth_modal.passkey.verification.label'
                                })}
                            </FormLabel>
                            <Input
                                value={verificationCode}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                                    handleVerificationCodeChange(value)
                                }}
                                placeholder="Enter 8-digit code"
                                maxLength={8}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                textAlign="center"
                                fontSize="2xl"
                                letterSpacing="widest"
                                isDisabled={isLoading}
                                mb={4}
                            />
                            <Button
                                variant="link"
                                onClick={handleResendCode}
                                isDisabled={isLoading}
                                width="full"
                            >
                                {formatMessage({
                                    defaultMessage: 'Resend Code',
                                    id: 'auth_modal.passkey.verification.resend'
                                })}
                            </Button>
                        </FormControl>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

PasskeyRegistrationModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
}

export default PasskeyRegistrationModal
