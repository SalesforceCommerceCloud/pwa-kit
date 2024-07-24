/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import useConfig from '@salesforce/commerce-sdk-react/hooks/useConfig'
import {
    createCodeVerifier,
    generateCodeChallenge,
    redirectToAuthURL
} from '@salesforce/retail-react-app/app/utils/idp-utils'

// For testing purposes, hardcoding values here
const SLAS_CALLBACK_ENDPOINT = '/idp-callback'
const clientId = '526281af-15ee-4339-8a12-1e18b959c02d'

/**
 * A hook that provides IDP auth functionality for the retail react app.
 */
export default function useGoogleSignIn() {
    const {siteId, proxy, organizationId} = useConfig()

    /**
     * Starts the IDP login flow by redirecting the user to the IDP login page (Google, Facebook...)
     *
     * @param {String} idp the Identity Provider to use for login
     */
    const loginRedirect = async (idp) => {
        if (!idp) {
            throw new Error('No IDP provided')
        }

        const codeVerifier = createCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)

        localStorage.setItem('codeVerifier', codeVerifier)
        console.log('this is the code challenge', codeChallenge)

        redirectToAuthURL(
            proxy,
            idp,
            codeChallenge,
            `http://localhost:3000${SLAS_CALLBACK_ENDPOINT}`,
            clientId,
            siteId,
            organizationId
        )
    }

    return {
        loginRedirect
    }
}