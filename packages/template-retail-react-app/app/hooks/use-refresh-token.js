/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'

/**
 * Custom hook that fetches the refresh token from the auth context.
 *
 * @param {Object} auth - The auth context
 * @param {boolean} isRegistered - Whether the user is registered
 * @param {boolean} isGuest - Whether the user is a guest
 * @returns {string} The refresh token
 */
const useRefreshToken = (
    auth,
    isRegistered,
    isGuest
) => {
    const [refreshToken, setRefreshToken] = useState(null)
    useEffect(() => {
        const fetchRefreshToken = async () => {
            try {
                await auth.ready()
                
                if (isRegistered) {
                    setRefreshToken(auth.get('refresh_token_registered'))
                } else if (isGuest) {
                    setRefreshToken(auth.get('refresh_token_guest'))
                }
            } catch (error) {
                console.error('Failed to get refresh token:', error)
            }
        }
        
        fetchRefreshToken()
    }, [auth, isRegistered, isGuest])

    return refreshToken
}

export default useRefreshToken
