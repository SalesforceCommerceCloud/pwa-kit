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
    const commerceApiConfig = config.app.commerceAPI
    const webauthnConfig = config.app.login.passkey
    const authorizeWebauthnRegistration = useAuthHelper(AuthHelpers.AuthorizeWebauthnRegistration)

    const handleRegisterPasskey = async () => {
        setIsLoading(true)
        setError(null)

        try {
            await authorizeWebauthnRegistration.mutateAsync({
                user_id: customer.email,
                mode: webauthnConfig.mode,
                channel_id: commerceApiConfig.parameters.siteId,
                ...(webauthnConfig.mode === 'callback' && {
                    callback_uri: webauthnConfig.callbackURI
                })
            })

            // Open OTP auth modal
            onClose()
            setIsOtpAuthOpen(true)
        } catch (err) {
            console.error('Error authorizing passkey registration:', err)
            setError(err.message || 'Failed to authorize passkey registration')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpVerification = async (code) => {
        // TODO: Implement OTP verification
        return {success: true}
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
                            id: 'auth_modal.passkey.title'
                        })}
                    </ModalHeader>
                    <ModalCloseButton
                        aria-label={formatMessage({
                            id: 'auth_modal.passkey.button.close.assistive_msg',
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
