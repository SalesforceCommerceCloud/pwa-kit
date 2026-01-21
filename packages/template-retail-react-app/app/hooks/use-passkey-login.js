/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {encode as base64Encode} from 'base64-arraybuffer'

/**
 * This hook provides commerce-react-sdk hooks to simplify the passkey login flow.
 */
export const usePasskeyLogin = () => {
    const startWebauthnAuthentication = useAuthHelper(AuthHelpers.StartWebauthnAuthentication)
    const finishWebauthnAuthentication = useAuthHelper(AuthHelpers.FinishWebauthnAuthentication)

    const uint8arrayToBase64url = (input) => {
        const uint8array = new Uint8Array(input)
        const base64 = base64Encode(uint8array.buffer)
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

    const loginWithPasskey = async () => {
        const config = getConfig()

        // Check if passkey is enabled in config
        if (!config?.app?.login?.passkey?.enabled) {
            return
        }

        // Availability of window.PublicKeyCredential means WebAuthn is supported in this browser
        if (!window.PublicKeyCredential || !PublicKeyCredential.isConditionalMediationAvailable) {
            return
        }

        // Check if conditional mediation is available. Conditional mediation is a feature of the WebAuthn API that allows passkeys to appear in the browser's standard autofill suggestions, alongside saved passwords. This allows users to sign in with a passkey using the standard username input field, rather than clicking a dedicated passkey login button.
        // https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/isConditionalMediationAvailable
        const isCMA = await PublicKeyCredential.isConditionalMediationAvailable()
        if (!isCMA) {
            return
        }

        const startWebauthnAuthenticationResponse = await startWebauthnAuthentication.mutateAsync(
            {}
        )

        // Transform response for WebAuthn API to send to navigator.credentials.get()
        // https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/get
        const options = PublicKeyCredential.parseRequestOptionsFromJSON(
            startWebauthnAuthenticationResponse.publicKey
        )

        const credential = await navigator.credentials.get({
            publicKey: options,
            mediation: 'conditional'
        })

        if (!credential) {
            throw new Error('Error getting passkey credential:', credential)
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
                rawId: uint8arrayToBase64url(credential.rawId),
                type: credential.type,
                clientExtensionResults: credential.getClientExtensionResults(),
                response: {
                    authenticatorData: uint8arrayToBase64url(credential.response.authenticatorData),
                    clientDataJSON: uint8arrayToBase64url(credential.response.clientDataJSON),
                    signature: uint8arrayToBase64url(credential.response.signature),
                    userHandle: uint8arrayToBase64url(credential.response.userHandle)
                }
            }
        }

        await finishWebauthnAuthentication.mutateAsync({
            credential: encodedCredential
        })
        return
    }

    return {loginWithPasskey}
}
