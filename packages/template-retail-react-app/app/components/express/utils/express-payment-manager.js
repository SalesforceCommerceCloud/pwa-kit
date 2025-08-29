/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    EXPRESS_MESSAGES,
    EXPRESS_BUTTON_HEIGHT,
    EXPRESS_BUTTON_GAP
} from '@salesforce/retail-react-app/app/components/express/utils/constants'

/**
 * Sends a message to the parent window
 * @param {string} type - The message type
 * @param {object} payload - The message payload
 */
function sendExpressMessage(type, payload) {
    window.parent.postMessage(
        {
            type,
            payload
        },
        '*'
    )
}

/**
 * Calculates the height needed for express payment buttons
 * @param {number} availableCount - Number of available payment methods
 * @returns {number} - Height in pixels
 */
function calculateExpressPaymentHeight(availableCount) {
    if (availableCount <= 0) return 0
    if (availableCount === 1) return EXPRESS_BUTTON_HEIGHT

    // For multiple buttons:
    return EXPRESS_BUTTON_HEIGHT * availableCount + EXPRESS_BUTTON_GAP * (availableCount - 1)
}

/**
 * Manages express payment method availability and sends completion messages
 */
class ExpressPaymentManager {
    constructor() {
        // Map to track payment method status: 'pending' | 'available' | 'unavailable'
        this.paymentMethods = new Map()
        // Count of available payment methods
        this.availableCount = 0
        // Total number of payment methods we're tracking
        this.totalAttempted = 0
        // Whether the manager has been initialized with payment methods
        this.isInitialized = false
        // Whether we've already sent the completion message
        this.isDone = false
        // Height change listeners
        this.heightListeners = new Set()
        // 'Done' change listeners
        this.doneListeners = new Set()
    }

    /**
     * Adds a listener for height changes
     * @param {function} listener - Function to call when height changes
     */
    addHeightListener(listener) {
        this.heightListeners.add(listener)
    }

    /**
     * Removes a height change listener
     * @param {function} listener - Function to remove
     */
    removeHeightListener(listener) {
        this.heightListeners.delete(listener)
    }

    /**
     * Notifies all height listeners of a change
     */
    notifyHeightListeners() {
        const height = this.getCurrentHeight()
        this.heightListeners.forEach((listener) => {
            listener(height)
        })
    }

    /**
     * Adds a listener for 'done' changes
     * @param {function} listener - Function to call when state changes
     */
    addDoneListener(listener) {
        this.doneListeners.add(listener)
    }

    /**
     * Removes a 'done' change listener
     * @param {function} listener - Function to remove
     */
    removeDoneListener(listener) {
        this.doneListeners.delete(listener)
    }

    /**
     * Notifies all 'done' listeners of a change
     */
    notifyDoneListeners() {
        this.doneListeners.forEach((listener) => {
            listener()
        })
    }

    /**
     * Gets the current calculated height based on available payment methods
     * @returns {number} - Height in pixels
     */
    getCurrentHeight() {
        return calculateExpressPaymentHeight(this.availableCount)
    }

    /**
     * Gets the current count of available payment methods
     * @returns {number} - Count of available payment methods
     */
    getNumberOfAvailablePaymentMethods() {
        return this.availableCount
    }

    /**
     * Registers payment methods to track
     * @param {string[]} paymentMethods - Array of payment method identifiers
     */
    registerPaymentMethod(paymentMethod) {
        if (!this.paymentMethods.has(paymentMethod)) {
            this.paymentMethods.set(paymentMethod, 'pending')
            this.totalAttempted++
        }
    }

    /**
     * Marks a payment method as available
     * @param {string} paymentMethod - Payment method identifier
     */
    setPaymentMethodAvailable(paymentMethod) {
        const currentStatus = this.paymentMethods.get(paymentMethod)

        // currentStatus should always be pending here, but confirming
        if (currentStatus === 'pending') {
            this.paymentMethods.set(paymentMethod, 'available')
            this.availableCount++
        }
        this.checkIfDone()
    }

    /**
     * Marks a payment method as unavailable
     * @param {string} paymentMethod - Payment method identifier
     */
    setPaymentMethodUnavailable(paymentMethod) {
        const currentStatus = this.paymentMethods.get(paymentMethod)

        // currentStatus should always be pending here, but confirming
        if (currentStatus === 'pending') {
            this.paymentMethods.set(paymentMethod, 'unavailable')
        }
        this.checkIfDone()
    }

    /**
     * Checks if all payment methods have reported their status
     */
    checkIfDone() {
        if (this.isDone) {
            return
        }

        // Check if all registered payment methods have reported their status
        const allReported = Array.from(this.paymentMethods.values()).every(
            (status) => status === 'available' || status === 'unavailable'
        )

        if (allReported && this.totalAttempted > 0) {
            this.isDone = true
            this.notifyHeightListeners()
            this.notifyDoneListeners()
            this.sendDoneMessage()
        }
    }

    /**
     * Sends the completion message to the parent window
     */
    sendDoneMessage() {
        const height = calculateExpressPaymentHeight(this.availableCount)
        const availableMethods = Array.from(this.paymentMethods.entries())
            .filter(([, status]) => status === 'available')
            .map(([method]) => method)
        const unavailableMethods = Array.from(this.paymentMethods.entries())
            .filter(([, status]) => status === 'unavailable')
            .map(([method]) => method)
        const allMethods = Array.from(this.paymentMethods.keys())

        const payload = {
            height,
            availableCount: this.availableCount,
            totalAttempted: this.totalAttempted,
            availableMethods,
            unavailableMethods,
            allMethods
        }

        if (this.availableCount == 0) {
            sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_UNAVAILABLE, payload)
            return
        }

        sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_AVAILABLE, payload)
    }

    /**
     * Initializes the manager with payment methods to track
     * @param {string[]} paymentMethods - Array of payment method identifiers
     */
    initialize(paymentMethods) {
        if (this.isInitialized) {
            return
        }

        // Register each payment method
        paymentMethods.forEach((method) => {
            this.registerPaymentMethod(method)
        })

        this.isInitialized = true
    }

    /**
     * Gets the current state of the manager
     * @returns {object} - Current state
     */
    getState() {
        return {
            paymentMethods: Object.fromEntries(this.paymentMethods),
            availableCount: this.availableCount,
            totalAttempted: this.totalAttempted,
            isInitialized: this.isInitialized,
            isDone: this.isDone
        }
    }
}

// Export singleton instance
export const expressPaymentManager = new ExpressPaymentManager()

// Export utility functions for testing
export {sendExpressMessage, calculateExpressPaymentHeight, ExpressPaymentManager}
