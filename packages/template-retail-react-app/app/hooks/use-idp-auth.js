/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {ShopperLoginMutations, useShopperLoginMutation} from '@salesforce/commerce-sdk-react'
import useConfig from '@salesforce/commerce-sdk-react/hooks/useConfig'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import {
    createCodeVerifier,
    generateCodeChallenge,
    redirectToAuthURL
} from '@salesforce/retail-react-app/app/utils/idp-utils'

const SLAS_CALLBACK_ENDPOINT = '/idp-callback'

/**
 * A hook that provides IDP auth functionality for the retail react app.
 */
export default function useIDPAuth() {
    const {clientId, organizationId, siteId, proxy} = useConfig()
    const mutations = ShopperLoginMutations
    const getAccessToken = useShopperLoginMutation(ShopperLoginMutations.GetAccessToken)
    const auth = useAuthContext()

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

        redirectToAuthURL(
            proxy,
            idp,
            codeChallenge,
            `${getAppOrigin()}${SLAS_CALLBACK_ENDPOINT}`,
            clientId,
            siteId,
            organizationId
        )
    }

    /**
     * Process response from IDP grabbing the usid and code from the URL
     *
     * @param {String} usid The user ID
     * @param {String} code The code returned from the IDP
     */
    const processIdpResult = async (usid, code) => {
        const tokenBody = {
            grant_type: 'authorization_code_pkce',
            code,
            usid,
            code_verifier: localStorage.getItem('codeVerifier'),
            client_id: clientId,
            channel_id: siteId,
            redirect_uri: `${getAppOrigin()}${SLAS_CALLBACK_ENDPOINT}`
        }

        const tokenResponse = await getAccessToken.mutateAsync({body: tokenBody})

        // We don't need the code verifier anymore
        localStorage.removeItem('codeVerifier')

        /**
         * This is a private method from the auth context, but it works, and simplifies the process. Otherwise, we need
         * to set all the values manually in the local storage.It also takes care of refreshing the current customer.
         *
         * See https://github.com/SalesforceCommerceCloud/pwa-kit/blob/3.0.0/packages/commerce-sdk-react/src/auth/index.ts#L302
         */
        auth.handleTokenResponse(tokenResponse)
    }

    return {
        loginRedirect,
        processIdpResult
    }
}
