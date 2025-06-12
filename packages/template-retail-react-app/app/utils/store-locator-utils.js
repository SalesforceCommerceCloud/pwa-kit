/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const getSelectedStoreData = (siteId) => {
    // Handle SSR and localStorage errors
    if (typeof window === 'undefined') {
        return null
    }

    try {
        const storeInfoKey = `store_${siteId}`
        const storeInfo = JSON.parse(window.localStorage.getItem(storeInfoKey) || 'null')
        return storeInfo
    } catch (error) {
        console.debug('Failed to access localStorage:', error)
        return null
    }
}
