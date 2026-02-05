/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef, useState} from 'react'

/**
 * Generic hook for auto-selecting and applying saved customer data during checkout
 * @param {Object} config Configuration object
 * @param {number} config.currentStep - Current checkout step
 * @param {number} config.targetStep - Step this auto-selection should run on
 * @param {boolean} config.isCustomerRegistered - Whether customer is registered
 * @param {Array} config.items - List of items to select from (addresses, payments, etc.)
 * @param {Function} config.getPreferredItem - Function to find preferred item from list
 * @param {Function} config.shouldSkip - Optional function returning boolean if auto-select should be skipped
 * @param {Function} config.isAlreadyApplied - Function checking if item is already applied
 * @param {Function} config.applyItem - Async function to apply the selected item
 * @param {Function} config.onSuccess - Optional callback after successful application
 * @param {Function} config.onError - Optional callback after error
 * @param {boolean} config.enabled - Whether auto-selection is enabled (default: true)
 * @returns {Object} { isLoading, hasExecuted, reset }
 */
export const useCheckoutAutoSelect = ({
    currentStep,
    targetStep,
    isCustomerRegistered,
    items = [],
    getPreferredItem,
    shouldSkip = () => false,
    isAlreadyApplied = () => false,
    applyItem,
    onSuccess,
    onError,
    enabled = true
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const hasExecutedRef = useRef(false)

    const reset = () => {
        hasExecutedRef.current = false
        setIsLoading(false)
    }

    useEffect(() => {
        const autoSelect = async () => {
            // Early returns for conditions that prevent auto-selection
            if (!enabled) return
            if (currentStep !== targetStep) return
            if (hasExecutedRef.current) return
            if (isLoading) return
            if (!isCustomerRegistered) return
            if (!items || items.length === 0) return
            if (shouldSkip()) return
            if (isAlreadyApplied()) return

            // Find the preferred item
            const preferredItem = getPreferredItem(items)
            if (!preferredItem) return

            // Mark as executed before starting to prevent race conditions
            hasExecutedRef.current = true
            setIsLoading(true)

            try {
                // Apply the item
                await applyItem(preferredItem)

                // Call success callback if provided
                if (onSuccess) {
                    await onSuccess(preferredItem)
                }
            } catch (error) {
                // Reset on error to allow manual selection
                hasExecutedRef.current = false

                // Call error callback if provided
                if (onError) {
                    onError(error)
                }
            } finally {
                setIsLoading(false)
            }
        }

        autoSelect()
    }, [currentStep, targetStep, isCustomerRegistered, items, isLoading, enabled])

    return {
        isLoading,
        hasExecuted: hasExecutedRef.current,
        reset
    }
}
