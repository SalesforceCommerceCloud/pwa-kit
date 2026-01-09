/*
 * Copyright (c) 2026, salesforce.com, inc.
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
                    {formatMessage({
                              defaultMessage: 'Create Passkey',
                              id: 'auth_modal.passkey.title'
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