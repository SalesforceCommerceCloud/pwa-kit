/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import {useEffect, useState} from 'react'

/**
 * A hook that handles the IDP callback
 *
 * @param {Object} props
 * @param {{missingParameters: String}} props.labels
 *
 * @returns {{authenticationError: String}} - The authentication error
 */
const usePasswordlessSignInCallback = ({token, labels}) => {
    const [authenticationError, setAuthenticationError] = useState()
    const auth = useAuthContext()

    const handleButtonClick = () => {
        // If there is an error in the URL, we don't need to do anything else
        if (authenticationError) {
            return
        }

        // We need to make sure we have the usid and code in the URL
        if (!token) {
            setAuthenticationError(labels?.missingParameters)

            return
        }
        console.log('ellloooo')

        auth.loginPasswordlessUser({
            pwdless_login_token: token
        })
    }

    return {handleButtonClick, authenticationError}
}

export default usePasswordlessSignInCallback
