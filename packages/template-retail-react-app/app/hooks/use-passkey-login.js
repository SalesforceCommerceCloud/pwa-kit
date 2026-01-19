/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {decode as base64Decode, encode as base64Encode} from 'base64-arraybuffer'

/**
 * This hook provides commerce-react-sdk hooks to simplify the passkey login flow.
 */
export const usePasskeyLogin = () => {
    const startWebauthnAuthentication = useAuthHelper(AuthHelpers.StartWebauthnAuthentication)
    const finishWebauthnAuthentication = useAuthHelper(AuthHelpers.FinishWebauthnAuthentication)
    const startPasskeyLogin = async () => {
        const config = getConfig()

        // Check if passkey is enabled in config
        if (!config?.app?.login?.passkey?.enabled) {
            return
        }

        // Availability of window.PublicKeyCredential means WebAuthn is usable
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

        const startWebauthnAuthenticationResponse = await startWebauthnAuthentication.mutateAsync({})

        if (!startWebauthnAuthenticationResponse) {
            // TODO: display localized error message to user
            console.error('Error starting passkey authentication:', startWebauthnAuthenticationResponse)
            return
        }

        // const startWebauthnAuthenticationResponseData = {
        //     publicKey: {
        //         challenge: 'DZdUeRgEm5m1D8Fqp8pzZZesdHkf1Pqoe-MqCA8gVw8',
        //         timeout: 60000,
        //         rpId: 'localhost',
        //         extensions: {}
        //     }
        // }

        // Transform response for WebAuthn API to send to navigator.credentials.get()
        // https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/get
        const options = {
            publicKey: {
                challenge: base64urlToUint8Array(startWebauthnAuthenticationResponse.publicKey.challenge),
                timeout: startWebauthnAuthenticationResponse.publicKey.timeout,
                rpId: startWebauthnAuthenticationResponse.publicKey.rpId,
                allowCredentials: (startWebauthnAuthenticationResponse.publicKey.allowCredentials || []).map((credential) => ({
                    type: credential.type,
                    id: base64urlToUint8Array(credential.id),
                    transports: credential.transports
                })),
                mediation: 'conditional'
            }
        }

        const credential = await navigator.credentials.get(options)

        if (!credential) {
            // TODO: display localized error message to user
            console.error('No credential returned')
            return
        }

        // Encode credential before sending to SLAS
        const encodedCredential = {
            id: credential.id,
            rawId: uint8arrayToBase64url(new Uint8Array(credential.rawId)),
            type: credential.type,
            clientExtensionResults: credential.getClientExtensionResults(),
            response: {
                authenticatorData: uint8arrayToBase64url(
                    new Uint8Array(credential.response.authenticatorData)
                ),
                clientDataJSON: uint8arrayToBase64url(
                    new Uint8Array(credential.response.clientDataJSON)
                ),
                signature: uint8arrayToBase64url(new Uint8Array(credential.response.signature)),
                userHandle: uint8arrayToBase64url(new Uint8Array(credential.response.userHandle))
            }
        }

        const finishWebauthnAuthenticationResponse = await finishWebauthnAuthentication.mutateAsync(
            {
                credential: encodedCredential
            }
        )

        console.log('finishWebauthnAuthenticationResponse ->', finishWebauthnAuthenticationResponse)

        if (!finishWebauthnAuthenticationResponse) {
            // TODO: display localized error message to user
            console.error(
                'Error finishing passkey authentication:',
                finishWebauthnAuthenticationResponse
            )
            return
        }

        return
    }

    // Helper functions for base64url encoding/decoding
    const base64urlToUint8Array = (base64url) => {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
        return new Uint8Array(base64Decode(base64))
    }

    const uint8arrayToBase64url = (uint8array) => {
        const base64 = base64Encode(uint8array.buffer)
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

    return {startPasskeyLogin}
}
