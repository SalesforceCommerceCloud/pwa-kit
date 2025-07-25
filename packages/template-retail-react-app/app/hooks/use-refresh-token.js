/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import useAuthContext from '@salesforce/commerce-sdk-react/hooks/useAuthContext'

/**
 * Custom hook that fetches the refresh token from the CommerceApiProvider context.
 * Uses the auth instance from CommerceApiProvider to get the refresh token directly.
 *
 * @returns {string|null} The refresh token or null if not available
 */
const useRefreshToken = () => {
    const [refreshToken, setRefreshToken] = useState(null)
    const auth = useAuthContext()

    useEffect(() => {
        const fetchRefreshToken = async () => {
            try {
                // Wait for auth to be ready and get the token response
                const tokenResponse = await auth.ready()
                setRefreshToken(tokenResponse.refresh_token || null)
            } catch (error) {
                console.error('Failed to get refresh token:', error)
            }
        }
        
        fetchRefreshToken()
    }, [auth])

    return refreshToken
}

export default useRefreshToken
