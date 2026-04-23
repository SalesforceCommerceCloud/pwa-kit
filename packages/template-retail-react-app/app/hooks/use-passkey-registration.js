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
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Custom hook to manage passkey registration prompt (toast and modal)
 * @returns {Object} Object containing showToast and passkey modal state
 */
export const usePasskeyRegistration = () => {
    const toast = useToast()
    const {passkeyModal} = usePasskeyRegistrationContext()
    const {formatMessage} = useIntl()

    /**
     * Shows the passkey registration toast only if passkey is enabled and the browser
     * supports WebAuthn (platform authenticator and conditional mediation).
     * Returns a Promise that resolves when the check (and optional toast) is complete.
     * @returns {Promise<void>}
     */
    const showRegisterPasskeyToast = async () => {
        const config = getConfig()

        // Check if passkey is enabled in config
        if (!config?.app?.login?.passkey?.enabled) return

        // Check if the browser supports user verifying platform authenticator and conditional mediation
        // User verifying platform authenticator is a feature of the WebAuthn API that allows the browser to use a platform authenticator to verify the user's identity.
        // Conditional mediation is a feature of the WebAuthn API that allows passkeys to appear in the browser's standard autofill suggestions, alongside saved passwords. This allows users to sign in with a passkey using the standard username input field, rather than clicking a dedicated passkey login button.
        // https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/isUserVerifyingPlatformAuthenticatorAvailable_static
        // https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/isConditionalMediationAvailable_static
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
        showRegisterPasskeyToast,
        passkeyModal
    }
}
