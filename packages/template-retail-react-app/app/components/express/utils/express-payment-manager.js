/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Constants for button sizing
const BUTTON_HEIGHT = 40
const BUTTON_GAP = 8

// Message type for completion
const EXPRESS_PAYMENT_DONE = 'express.payment.done'

/**
 * Sends a message to the parent window
 * @param {string} type - The message type
 * @param {object} payload - The message payload
 */
function sendExpressMessage(type, payload) {
    console.log('[ExpressPaymentManager] Sending message to parent:', { type, payload })
    
    if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage({ type, payload }, '*')
    } else {
        console.warn('[ExpressPaymentManager] Cannot send message - window.parent not available')
    }
}

/**
 * Calculates the height needed for express payment buttons
 * @param {number} availableCount - Number of available payment methods
 * @returns {number} - Height in pixels
 */
function calculateExpressPaymentHeight(availableCount) {
    if (availableCount <= 0) return 0
    if (availableCount === 1) return BUTTON_HEIGHT
    
    // For multiple buttons: (button height * count) + (gap * (count - 1))
    return (BUTTON_HEIGHT * availableCount) + (BUTTON_GAP * (availableCount - 1))
}

/**
 * Manages express payment method availability and sends completion messages
 */
class ExpressPaymentManager {
    constructor() {
        console.log('[ExpressPaymentManager] Initializing new manager instance')
        
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
    }

    /**
     * Registers payment methods to track
     * @param {string[]} paymentMethods - Array of payment method identifiers
     */
    registerPaymentMethod(paymentMethod) {
        console.log('[ExpressPaymentManager] Registering payment method:', paymentMethod)
        
        if (!this.paymentMethods.has(paymentMethod)) {
            this.paymentMethods.set(paymentMethod, 'pending')
            this.totalAttempted++
            console.log('[ExpressPaymentManager] Payment method registered. Total attempted:', this.totalAttempted)
        } else {
            console.log('[ExpressPaymentManager] Payment method already registered:', paymentMethod)
        }
    }

    /**
     * Marks a payment method as available
     * @param {string} paymentMethod - Payment method identifier
     */
    setPaymentMethodAvailable(paymentMethod) {
        console.log('[ExpressPaymentManager] Setting payment method as available:', paymentMethod)
        
        const currentStatus = this.paymentMethods.get(paymentMethod)
        
        if (currentStatus === 'pending') {
            this.paymentMethods.set(paymentMethod, 'available')
            this.availableCount++
            console.log('[ExpressPaymentManager] Payment method marked as available. Available count:', this.availableCount)
        } else if (currentStatus === 'available') {
            console.log('[ExpressPaymentManager] Payment method already marked as available:', paymentMethod)
        } else {
            console.log('[ExpressPaymentManager] Payment method was unavailable, now available:', paymentMethod)
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
        console.log('[ExpressPaymentManager] Setting payment method as unavailable:', paymentMethod)
        
        const currentStatus = this.paymentMethods.get(paymentMethod)
        const wasAvailable = currentStatus === 'available'
        
        if (currentStatus === 'pending' || currentStatus === 'available') {
            this.paymentMethods.set(paymentMethod, 'unavailable')
            
            if (wasAvailable) {
                this.availableCount--
                console.log('[ExpressPaymentManager] Payment method was available, now unavailable. Available count:', this.availableCount)
            } else {
                console.log('[ExpressPaymentManager] Payment method marked as unavailable (was pending)')
            }
        } else {
            console.log('[ExpressPaymentManager] Payment method already marked as unavailable:', paymentMethod)
        }
        
        this.checkIfDone()
    }

    /**
     * Checks if all payment methods have reported their status
     */
    checkIfDone() {
        console.log('[ExpressPaymentManager] Checking if done...')
        console.log('[ExpressPaymentManager] Current state:', {
            totalAttempted: this.totalAttempted,
            availableCount: this.availableCount,
            isDone: this.isDone,
            paymentMethods: Object.fromEntries(this.paymentMethods)
        })
        
        if (this.isDone) {
            console.log('[ExpressPaymentManager] Already done, skipping check')
            return
        }
        
        // Check if all registered payment methods have reported their status
        const allReported = Array.from(this.paymentMethods.values()).every(status => 
            status === 'available' || status === 'unavailable'
        )
        
        if (allReported && this.totalAttempted > 0) {
            console.log('[ExpressPaymentManager] All payment methods have reported status. Sending completion message.')
            this.isDone = true
            this.sendDoneMessage()
        } else {
            console.log('[ExpressPaymentManager] Not all payment methods have reported status yet')
        }
    }

    /**
     * Sends the completion message to the parent window
     */
    sendDoneMessage() {
        console.log('[ExpressPaymentManager] Sending completion message...')
        
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
        
        console.log('[ExpressPaymentManager] Completion message payload:', payload)
        sendExpressMessage(EXPRESS_PAYMENT_DONE, payload)
    }

    /**
     * Initializes the manager with payment methods to track
     * @param {string[]} paymentMethods - Array of payment method identifiers
     */
    initialize(paymentMethods) {
        console.log('[ExpressPaymentManager] Initializing with payment methods:', paymentMethods)
        
        if (this.isInitialized) {
            console.log('[ExpressPaymentManager] Already initialized, skipping')
            return
        }
        
        if (!Array.isArray(paymentMethods)) {
            console.error('[ExpressPaymentManager] Invalid payment methods array:', paymentMethods)
            return
        }
        
        // Register each payment method
        paymentMethods.forEach(method => {
            this.registerPaymentMethod(method)
        })
        
        this.isInitialized = true
        console.log('[ExpressPaymentManager] Initialization complete. Total methods to track:', this.totalAttempted)
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