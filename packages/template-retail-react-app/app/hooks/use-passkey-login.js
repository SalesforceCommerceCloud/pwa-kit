/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'

/**
 * This hook provides commerce-react-sdk hooks to simplify the passkey login flow.
 */
export const usePasskeyLogin = () => {
    const startWebauthnAuthentication = useAuthHelper(AuthHelpers.StartWebauthnAuthentication)
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

        // Check if conditional mediation is available. Conditional mediation is a feature
        // that allows the browser to prompt the user for a password only if the user has
        // not already authenticated with the same device in the current session.
        const isCMA = await window.PublicKeyCredential.isConditionalMediationAvailable()
        if (!isCMA) {
            return
        }

        try {
            const startResponse = await startWebauthnAuthentication.mutateAsync({})
            console.log('startResponse ->', startResponse)
            return startResponse
        } catch (error) {
            console.error('Error starting passkey authentication:', error)
        }
    }

    return {startPasskeyLogin}
}
