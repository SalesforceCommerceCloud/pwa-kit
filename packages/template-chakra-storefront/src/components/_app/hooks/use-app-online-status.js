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
    const [isOnline, setIsOnline] = useState(() => {
        // Initialize with actual online status if available
        return typeof navigator !== 'undefined' && navigator.onLine !== undefined
            ? navigator.onLine
            : true
    })

    useEffect(() => {
        // Set initial status from navigator
        if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
            setIsOnline(navigator.onLine)
        }

        // Listen for online status changes.
        const unsubscribe = watchOnlineStatus((newIsOnline) => {
            setIsOnline(newIsOnline)
        })

        return unsubscribe
    }, [])

    return {
        isOnline
    }
}
