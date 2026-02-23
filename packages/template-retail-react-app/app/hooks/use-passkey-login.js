/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useRef} from 'react'
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
    const abortControllerRef = useRef(null)

    /**
     * Aborts any pending passkey login request.
     * This is useful when the user logs in with a different method (e.g., password)
     * while a passkey prompt (e.g., 1Password) is still open.
     */
    const abortPasskeyLogin = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }

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
        // https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/isConditionalMediationAvailable_static
        const isCMA = await window.PublicKeyCredential.isConditionalMediationAvailable()
        if (!isCMA) {
            return
        }

        let startWebauthnAuthenticationResponse
        try {
            startWebauthnAuthenticationResponse = await startWebauthnAuthentication.mutateAsync({})
        } catch (error) {
            // 412 is returned when user attempts to authenticate within 1 minute of a previous attempt
            // We return early in this case to avoid showing an error to the user
            if (error.response?.status === 412) {
                return
            }
            throw error
        }

        // Transform response for WebAuthn API to send to navigator.credentials.get()
        // https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseRequestOptionsFromJSON_static
        const options = window.PublicKeyCredential.parseRequestOptionsFromJSON(
            startWebauthnAuthenticationResponse.publicKey
        )

        // Create an AbortController to allow cancelling the passkey prompt
        // This is needed when the user logs in with a different method while the passkey prompt is open
        abortControllerRef.current = new AbortController()

        // Get passkey credential from browser
        // https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/get
        let credential
        try {
            credential = await navigator.credentials.get({
                publicKey: options,
                mediation: 'conditional',
                signal: abortControllerRef.current.signal
            })
        } catch (error) {
            // NotAllowedError is thrown when the user cancels the passkey login
            // AbortError is thrown when the passkey login is aborted programmatically (e.g., user logged in with password)
            // We return early in these cases to avoid showing an error to the user
            if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
                return
            }
            console.error('Error getting passkey credential from browser:', error)
            throw error
        } finally {
            abortControllerRef.current = null
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

    return {loginWithPasskey, abortPasskeyLogin}
}
