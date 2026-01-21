/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext} from 'react'
import {ComparisonContext} from '@salesforce/retail-react-app/app/contexts'

/**
 * A convenience hook for using the ComparisonContext value.
 *
 * @returns {Object} The comparison context value containing:
 * - comparedProducts: Array of products being compared
 * - isDrawerOpen: Boolean indicating if comparison drawer is open
 * - addToComparison: Function to add a product to comparison
 * - removeFromComparison: Function to remove a product from comparison
 * - clearComparison: Function to clear all compared products
 * - isInComparison: Function to check if a product is in comparison
 * - toggleDrawer: Function to toggle comparison drawer
 * - closeDrawer: Function to close comparison drawer
 * - openDrawer: Function to open comparison drawer
 * - canCompare: Boolean indicating if more products can be added (max 4)
 * - hasProducts: Boolean indicating if there are products to compare
 * - count: Number of products currently being compared
 */
export const useComparison = () => {
    const context = useContext(ComparisonContext)
    
    if (!context) {
        throw new Error('useComparison must be used within a ComparisonProvider')
    }
    
    return context
}
