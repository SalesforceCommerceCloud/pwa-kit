/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAuthHelper, AuthHelpers, useUsid} from '@salesforce/commerce-sdk-react'
import {arrayBufferToBase64Url} from '@salesforce/retail-react-app/app/utils/utils'

/**
 * This hook provides commerce-react-sdk hooks to simplify the passkey login flow.
 */
export const usePasskeyLogin = () => {
    const startWebauthnAuthentication = useAuthHelper(AuthHelpers.StartWebauthnAuthentication)
    const finishWebauthnAuthentication = useAuthHelper(AuthHelpers.FinishWebauthnAuthentication)
    const {usid} = useUsid()

    const loginWithPasskey = async () => {
        const config = getConfig()

        // Check if passkey is enabled in config
        if (!config?.app?.login?.passkey?.enabled) {
            return
        }

        // Availability of window.PublicKeyCredential means WebAuthn is supported in this browser
        if (
            !window.PublicKeyCredential ||
            !window.PublicKeyCredential.isConditionalMediationAvailable
        ) {
            return
        }

        // Check if conditional mediation is available. Conditional mediation is a feature of the WebAuthn API that allows passkeys to appear in the browser's standard autofill suggestions, alongside saved passwords. This allows users to sign in with a passkey using the standard username input field, rather than clicking a dedicated passkey login button.
        // https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/isConditionalMediationAvailable
        const isCMA = await window.PublicKeyCredential.isConditionalMediationAvailable()
        if (!isCMA) {
            return
        }

        const startWebauthnAuthenticationResponse = await startWebauthnAuthentication.mutateAsync(
            {}
        )

        // Transform response for WebAuthn API to send to navigator.credentials.get()
        // https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseRequestOptionsFromJSON_static
        const options = window.PublicKeyCredential.parseRequestOptionsFromJSON(
            startWebauthnAuthenticationResponse.publicKey
        )

        // Get passkey credential from browser
        // https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/get
        let credential
        try {
            credential = await navigator.credentials.get({
                publicKey: options,
                mediation: 'conditional'
            })
        } catch (error) {
            // NotAllowedError is thrown when the user cancels the passkey login
            // We return early in this case to avoid showing an error to the user
            if (error.name == 'NotAllowedError') {
                return
            }
            throw error
        }

        // Encode credential before sending to SLAS
        // https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/toJSON
        let encodedCredential
        try {
            encodedCredential = credential.toJSON()
        } catch (error) {
            // Fallback to manual encoding if toJSON() fails.
            // Some passkey providers (e.g., 1Password) may not support the toJSON() method and return an error.
            // In this case, we manually encode the credential.
            encodedCredential = {
                id: credential.id,
                rawId: arrayBufferToBase64Url(credential.rawId),
                type: credential.type,
                clientExtensionResults: credential.getClientExtensionResults(),
                response: {
                    authenticatorData: arrayBufferToBase64Url(
                        credential.response.authenticatorData
                    ),
                    clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
                    signature: arrayBufferToBase64Url(credential.response.signature),
                    userHandle: arrayBufferToBase64Url(credential.response.userHandle)
                }
            }
        }

        await finishWebauthnAuthentication.mutateAsync({
            credential: encodedCredential,
            usid
        })
        return
    }

    return {loginWithPasskey}
}
