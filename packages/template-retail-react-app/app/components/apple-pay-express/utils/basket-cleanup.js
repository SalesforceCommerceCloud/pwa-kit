/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {deleteTemporaryBasket} from './temporary-basket'

/**
 * Utility function to clean up temporary baskets during Apple Pay failures or cancellations
 * This reduces code duplication across the Apple Pay component
 * @param {boolean} isPdpMode - Whether we're in PDP mode
 * @param {object} sharedBasketRef - Reference to the shared basket
 * @param {string} authToken - Authentication token
 * @param {object} site - Site configuration
 * @param {function} setTempBasket - Function to clear temporary basket state
 * @returns {Promise<void>}
 */
export const cleanupTemporaryBasket = async (isPdpMode, sharedBasketRef, authToken, site, setTempBasket) => {
    if (isPdpMode && sharedBasketRef?.basketId) {
        try {
            await deleteTemporaryBasket(sharedBasketRef.basketId, authToken, site)
            if (setTempBasket) {
                setTempBasket(null)
            }
            // Clear the shared reference
            sharedBasketRef = null
        } catch (cleanupError) {
            console.warn('Failed to cleanup temporary basket:', cleanupError)
        }
    }
}

/**
 * Wrapper function that returns a cleanup function bound to the current context
 * This makes it easier to use in error handlers and onError callbacks
 * @param {boolean} isPdpMode - Whether we're in PDP mode
 * @param {object} sharedBasketRef - Reference to the shared basket
 * @param {string} authToken - Authentication token
 * @param {object} site - Site configuration
 * @param {function} setTempBasket - Function to clear temporary basket state
 * @returns {function} Cleanup function
 */
export const createCleanupFunction = (isPdpMode, sharedBasketRef, authToken, site, setTempBasket) => {
    return () => cleanupTemporaryBasket(isPdpMode, sharedBasketRef, authToken, site, setTempBasket)
} 