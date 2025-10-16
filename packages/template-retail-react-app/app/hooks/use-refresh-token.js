/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
// import useCustomerType from '@salesforce/commerce-sdk-react/hooks/useCustomerType'

/**
 * Custom hook that fetches the refresh token from the CommerceApiProvider context.
 * Uses the auth instance from CommerceApiProvider to get the refresh token directly.
 *
 * @returns {string|null} The refresh token (synchronous value or ready value when available)
 */
const useRefreshToken = () => {
    const auth = useAuthContext()
    // WARNING: This is a temporary fix to get the refresh token when the customer type is available.
    // This is internal to the Commerce SDK React and if removed, the refresh token will not be available and might break this functionality.
    // This will be treated as a temporary bridge until a supported public method is available to us or when we can shift this in commerce sdk repo.
    const [refreshToken, setRefreshToken] = useState(null)

    // Handle async token retrieval only to get the refresh token when the auth is ready
    useEffect(() => {
        const getRefreshTokenWhenReady = () => auth.ready().then(({refresh_token}) => refresh_token)
        getRefreshTokenWhenReady()
            .then(setRefreshToken)
            .catch(() => setRefreshToken(null))
    }, [auth])

    return refreshToken
}

export default useRefreshToken
