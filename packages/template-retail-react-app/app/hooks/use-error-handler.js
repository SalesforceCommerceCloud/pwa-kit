/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback} from 'react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

/**
 * Hook for consistent error handling
 * Centralizes error logging and user feedback
 * @returns {Function} Error handler function
 */
export const useErrorHandler = () => {
    const {showToast} = useToast()

    const handleError = useCallback(
        (message, error, options = {}) => {
            const {showUserMessage = true, logToConsole = true, throwError = false} = options

            if (logToConsole) {
                console.error(message, error)
            }

            if (showUserMessage) {
                showToast({
                    title: message,
                    status: 'error'
                })
            }

            if (throwError) {
                throw error
            }
        },
        [showToast]
    )

    return handleError
}
