/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import {useEffect, useState} from 'react'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks/use-search-params'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'

const SLAS_CALLBACK_ENDPOINT = '/idp-callback'

/**
 * A hook that handles the IDP callback
 *
 * @param {Object} props
 * @param {{missingParameters: String}} props.labels
 *
 * @returns {{authenticationError: String}} - The authentication error
 */
const useGoogleSignInCallback = ({labels}) => {
    const [params] = useSearchParams()
    const [authenticationError, setAuthenticationError] = useState(params.error_description)
    const auth = useAuthContext()

    useEffect(() => {
        // If there is an error in the URL, we don't need to do anything else
        if (authenticationError) {
            return
        }

        // We need to make sure we have the usid and code in the URL
        if (!params.usid || !params.code) {
            setAuthenticationError(labels?.missingParameters)

            return
        }

        auth.loginIDPUser({
            usid: params.usid,
            code: params.code,
            redirectURI: `http://localhost:3000${SLAS_CALLBACK_ENDPOINT}`
        })
    }, [])

    return {authenticationError}
}

export default useGoogleSignInCallback