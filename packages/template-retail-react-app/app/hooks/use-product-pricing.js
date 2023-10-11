/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import {getDisplayPrice} from '../utils/product-utils'

/**
 * @typedef {object} ProductPricing
 * @property {string} currency
 * @property {string} basePrice
 * @property {string} discountPrice
 */

/**
 * Gets the product pricing, allowing for extensibility using custom hooks
 * @param {object} product
 * @param {number} quantity
 * @return {ProductPricing}
 */
function useProductPricing(product, quantity = 1) {
    let qty = Number(quantity)
    if (qty < 1 || isNaN(qty) || !Number.isInteger(qty)) {
        qty = 1
    }
    return useMemo(() => {
        if (product) {
            const {basePrice, discountPrice} = getDisplayPrice(product)
            return {
                currency: product.currency,
                basePrice: basePrice !== null ? basePrice * qty : null,
                discountPrice: discountPrice !== null ? discountPrice * qty : null
            }
        } else {
            return {
                currency: null,
                basePrice: null,
                discountPrice: null
            }
        }
    }, [product])
}

export default useProductPricing
