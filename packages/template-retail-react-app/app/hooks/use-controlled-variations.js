/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useEffect} from 'react'

/**
 * Custom hook for managing controlled variation state in modals.
 * Provides React state-based variation management (instead of URL parameters).
 *
 * Features:
 * - Manages variation selection state
 * - Auto-selects single-value variation attributes
 * - Provides callback for handling variation changes
 *
 * @param {Object} product - The product object with variationAttributes
 * @returns {Object} - { controlledVariationValues, handleVariationChange }
 */
export const useControlledVariations = (product) => {
    const [controlledVariationValues, setControlledVariationValues] = useState({})

    // Auto-select variation attributes with only one value
    useEffect(() => {
        if (!product?.variationAttributes) return

        const autoSelections = {}
        product.variationAttributes.forEach((attr) => {
            // Only auto-select if there's exactly one value and it's not already selected
            if (attr.values?.length === 1 && !controlledVariationValues[attr.id]) {
                autoSelections[attr.id] = attr.values[0].value
            }
        })

        if (Object.keys(autoSelections).length > 0) {
            setControlledVariationValues((prev) => ({
                ...prev,
                ...autoSelections
            }))
        }
    }, [product?.variationAttributes, controlledVariationValues])

    // Handle variation changes in controlled mode
    const handleVariationChange = (attributeId, value) => {
        setControlledVariationValues((prev) => ({
            ...prev,
            [attributeId]: value
        }))
    }

    return {
        controlledVariationValues,
        handleVariationChange
    }
}
