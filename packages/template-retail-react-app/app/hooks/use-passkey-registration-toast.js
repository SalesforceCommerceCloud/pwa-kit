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

export const usePasskeyRegistrationToast = ({onOpenModal}) => {
    const toast = useToast()
    const {formatMessage} = useIntl()

    const showToast = async () => {
        if (
            !window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable ||
            !window.PublicKeyCredential?.isConditionalMediationAvailable
        ) {
            return
        }

        const [platformAvailable, conditionalAvailable] = await Promise.all([
            window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
            window.PublicKeyCredential.isConditionalMediationAvailable()
        ])
        if (!platformAvailable || !conditionalAvailable) return

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
                            onOpenModal()
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

    return {showToast}
}
