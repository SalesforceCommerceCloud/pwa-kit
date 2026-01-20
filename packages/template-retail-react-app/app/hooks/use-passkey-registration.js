/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'
import {
    Box,
    Button,
    CloseButton,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {usePasskeyRegistrationContext} from '@salesforce/retail-react-app/app/contexts/passkey-registration-provider'

/**
 * Custom hook to manage passkey registration prompt (toast and modal)
 * @returns {Object} Object containing showToast function and passkey modal state
 */
export const usePasskeyRegistration = () => {
    const toast = useToast()
    const {passkeyModal} = usePasskeyRegistrationContext()
    const {formatMessage} = useIntl()

    const showToast = () => {
        toast({
            position: 'top-right',
            duration: 9000,
            isClosable: true,
            render: ({onClose}) => (
                <Box
                    color="white"
                    p={4}
                    bg="green.500"
                    borderRadius="md"
                    boxShadow="lg"
                    maxWidth="400px"
                    position="relative"
                >
                    <CloseButton
                        position="absolute"
                        right={2}
                        top={2}
                        color="white"
                        onClick={onClose}
                        aria-label={formatMessage({
                            id: 'passkey_registration.toast.button.close.assistive_msg',
                            defaultMessage: 'Close toast'
                        })}
                    />
                    <Box mb={3} fontWeight="medium">
                        {formatMessage({
                            id: 'passkey_registration.toast.message',
                            defaultMessage: 'Create a passkey for a more secure and easier login'
                        })}
                    </Box>
                    <Button
                        size="sm"
                        colorScheme="whiteAlpha"
                        onClick={() => {
                            onClose()
                            passkeyModal.onOpen()
                        }}
                    >
                        {formatMessage({
                            id: 'passkey_registration.toast.button.create',
                            defaultMessage: 'Create Passkey'
                        })}
                    </Button>
                </Box>
            )
        })
    }

    return {
        showToast,
        passkeyModal
    }
}
