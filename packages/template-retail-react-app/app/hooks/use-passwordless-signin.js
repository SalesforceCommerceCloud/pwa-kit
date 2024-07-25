/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useConfig from '@salesforce/commerce-sdk-react/hooks/useConfig'
import {
    redirectToAuthURL
} from '@salesforce/retail-react-app/app/utils/passwordless-utils'

// For testing purposes, hardcoding values here
const callback_uri = 'http://localhost:3000/pwdless-login-callback'
const clientId = 'd7bcbfdb-b9cb-443b-b61b-f39c570ea85d'
const clientSecret = 'vO9N7RFcxFxFsKWjcoRB05WKj2iSq_-oEGZRGJjA49g'

/**
 * A hook that provides passwordless auth functionality for the retail react app.
 */
export default function usePasswordlessSignIn() {
    const {proxy, organizationId, siteId} = useConfig()

    /**
     * Starts the passwordless login flow by calling the authorizePasswordlessCustomer SLAS endpoint
     *
     * @param {String} user_id the Identity Provider to use for login
     */
    const authorizeCustomer = async (user_id) => {

        redirectToAuthURL(
            proxy,
            callback_uri,
            siteId,
            'callback',
            user_id,
            organizationId,
            clientId,
            clientSecret
        )
    }

    return {
        authorizeCustomer
    }
}