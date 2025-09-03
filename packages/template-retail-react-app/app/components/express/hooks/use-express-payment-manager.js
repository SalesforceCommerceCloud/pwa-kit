/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useState} from 'react'
import {expressPaymentManager} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-manager'

/**
 * Hook to get the height to use for express payment boundary
 * @returns {number} - Current height in pixels
 */
export function useExpressPaymentHeight() {
    const [height, setHeight] = useState(0)

    useEffect(() => {
        // Set initial height
        setHeight(expressPaymentManager.getCurrentHeight())

        // Add listener for height changes
        const handleHeightChange = (newHeight) => {
            setHeight(newHeight)
        }
        expressPaymentManager.addHeightListener(handleHeightChange)

        // Cleanup listener on unmount
        return () => {
            expressPaymentManager.removeHeightListener(handleHeightChange)
        }
    }, [])

    return height
}

/**
 * Hook to initialize the ExpressPaymentManager
 * @param {string[]} paymentMethodIds - Array of payment method identifiers to track
 * @returns {object} - Manager instance and error state
 */
export function useExpressPaymentManager(paymentMethodIds) {
    const [error, setError] = useState(null)
    const [availableCount, setAvailableCount] = useState(expressPaymentManager.getNumberOfAvailablePaymentMethods())
    const [isDone, setIsDone] = useState(expressPaymentManager.isDone)

    useEffect(() => {
        try {
            if (Array.isArray(paymentMethodIds) && paymentMethodIds.length > 0) {
                expressPaymentManager.initialize(paymentMethodIds)
                setError(null)
            } else {
                const error = new Error('No payment method IDs provided or invalid array')
                setError(error)
            }
        } catch (err) {
            setError(err)
        }
    }, [paymentMethodIds])

    useEffect(() => {
        const handleDone = () => {
            setAvailableCount(expressPaymentManager.getNumberOfAvailablePaymentMethods())
            setIsDone(expressPaymentManager.isDone)
        }
        expressPaymentManager.addDoneListener(handleDone)
        return () => {
            expressPaymentManager.removeDoneListener(handleDone)
        }
    }, [])

    return {
        manager: expressPaymentManager,
        isDone,
        availableCount,
        error
    }
}
