/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Hooks
import {useVariationParams} from '@salesforce/retail-react-app/app/hooks/use-variation-params'
import {STANDARD_PRODUCT_VARIATION_ATTRIBUTE} from '@salesforce/retail-react-app/app/constants'

/**
 * This hook returns the currently selected
 * variant or undefined. NOTE: All attributes must be selected before a variant
 * will be returned.
 *
 * @param {Object} product
 * @returns {Object} the currently selected `Variant` object.
 */
export const useVariant = (
    product = {},
    isProductPartOfSet = false,
    isProductPartOfBundle = false
) => {
    const {variants = []} = product
    const variationParams = useVariationParams(product, isProductPartOfSet, isProductPartOfBundle)

    // "item" products are standard or "simple" products that do not have
    // variants. Here we return as if it was product with a single variant.
    if (product.type?.item === true) {
        return {
            orderable: product?.inventory?.orderable,
            price: product?.price,
            productId: product?.id,
            variationValues: {[STANDARD_PRODUCT_VARIATION_ATTRIBUTE]: 'single'}
        }
    }

    // Get a filtered array of variants. The resulting array will only have variants
    // which have all the current variation params values set.
    const filteredVariants = variants.filter(({variationValues}) =>
        // A single liner that will return true if the current variation has all the
        // same attribute values as the passing in params.
        Object.keys(variationParams).every((key) => variationValues[key] === variationParams[key])
    )

    return filteredVariants.length === 1 ? filteredVariants[0] : undefined
}
