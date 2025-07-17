/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useEffect} from 'react'
import {watchOnlineStatus} from '../../../utils/utils'

/**
 * Custom hook for monitoring online/offline status
 * Provides real-time network connectivity status
 *
 * @returns {Object} Online status and utilities
 */
export const useAppOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        // Listen for online status changes.
        watchOnlineStatus((isOnline) => {
            setIsOnline(isOnline)
        })
    }, [])

    return {
        isOnline
    }
}
