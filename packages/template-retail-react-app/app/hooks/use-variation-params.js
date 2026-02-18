/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {usePDPSearchParams} from '@salesforce/retail-react-app/app/hooks/use-pdp-search-params'

/*
 * This hook will return only the params that are also product attributes for the
 * passed in product object.
 * @param {Object} product - The product object
 * @param {boolean} isProductPartOfSet - Whether the product is part of a set
 * @param {boolean} isProductPartOfBundle - Whether the product is part of a bundle
 * @param {Object} controlledVariationValues - Optional controlled variation values (skips URL reading)
 */
export const useVariationParams = (
    product = {},
    isProductPartOfSet = false,
    isProductPartOfBundle = false,
    controlledVariationValues = null
) => {
    const {variationAttributes = [], variationValues = {}} = product

    // Always call hooks first (hooks must be called unconditionally)
    const [allParams, productParams] = usePDPSearchParams(product.id)
    const params = isProductPartOfSet || isProductPartOfBundle ? productParams : allParams

    // If controlled values are provided, use those instead of URL params
    if (controlledVariationValues !== null) {
        return variationAttributes
            .map(({id}) => id)
            .reduce((acc, key) => {
                let value = controlledVariationValues[key] || variationValues?.[key]
                return value ? {...acc, [key]: value} : acc
            }, {})
    }

    // Using all the variation attribute id from the array generated below, get
    // the value if there is one from the location search params and add it to the
    // accumulator.
    const variationParams = variationAttributes
        .map(({id}) => id)
        .reduce((acc, key) => {
            let value = params.get(`${key}`) || variationValues?.[key]
            return value ? {...acc, [key]: value} : acc
        }, {})

    return variationParams
}
