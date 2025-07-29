/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'
import useCustomerType from '@salesforce/commerce-sdk-react/hooks/useCustomerType'

/**
 * Custom hook that fetches the refresh token from the CommerceApiProvider context.
 * Uses the auth instance from CommerceApiProvider to get the refresh token directly.
 *
 * @returns {string|null} The refresh token (synchronous value or ready value when available)
 */
const useRefreshToken = () => {
    const auth = useAuthContext()
    const {customerType} = useCustomerType()
    const refreshToken = customerType ? auth.get(`refresh_token_${customerType}`) : null
    const [readyToken, setReadyToken] = useState(null)

    // Handle async token retrieval only if no token in storage and customerType is available
    useEffect(() => {
        if (!refreshToken && customerType && auth && auth.ready) {
            const getRefreshTokenWhenReady = () =>
                auth.ready().then(({refresh_token}) => refresh_token || null)
            getRefreshTokenWhenReady()
                .then(setReadyToken)
                .catch((error) => {
                    console.error('Failed to get refresh token:', error)
                    setReadyToken(null)
                })
        }
    }, [auth, customerType, refreshToken])
    console.log('readyToken::::', refreshToken, readyToken);

    // Return refreshToken if available, otherwise return readyToken, ensuring we never return undefined
    return refreshToken || readyToken
}

export default useRefreshToken
