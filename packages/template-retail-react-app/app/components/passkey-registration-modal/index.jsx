/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
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
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

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

    const handleRegisterPasskey = async () => {
        setIsLoading(true)
        setError(null)
        
        // THE API CALL TO /oauth2/webauthn/register/authorize SHOULD BE REPLACED BY A COMMERCE SDK CALL
        // Makes a request to the SLAS API on a local server
        try {
            const params = new URLSearchParams()
            params.append('channel_id', commerceAPI.parameters.siteId)
            params.append('user_id', customer.email)
            params.append('mode', 'callback')
            params.append('client_id', commerceAPI.parameters.clientId)
            params.append('callback_uri', webauthnConfig.callbackURI)
            
            console.log('Body', params.toString())

            const response = await fetch(
                `http://localhost:9020/api/v1/organizations/${commerceAPI.parameters.organizationId}/oauth2/webauthn/register/authorize`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${btoa(`${commerceAPI.parameters.clientId}:${process.env.CLIENT_SECRET || '9MBWoGTfPmUsm9ityrAN'}`)}`
                    },
                    body: params.toString()
                }
            )
            
            const data = await response.json()
            console.log('Passkey registration initiated:', data)
            console.log('Passkey nickname:', passkeyNickname)
            
            onClose()
            setPasskeyNickname('')
        } catch (err) {
            console.error('Error registering passkey:', err)
            setError(err.message || 'Failed to register passkey')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
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
