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
 */
export const useVariationParams = (
    product = {},
    isProductPartOfSet = false,
    isProductPartOfBundle = false,
    urlParamPrefix = ''
) => {
    const {variationAttributes = [], variationValues = {}} = product

    const [allParams, productParams] = usePDPSearchParams(product.id)
    const params = isProductPartOfSet || isProductPartOfBundle ? productParams : allParams

    // Using all the variation attribute id from the array generated below, get
    // the value if there is one from the location search params and add it to the
    // accumulator.
    const variationParams = variationAttributes
        .map(({id}) => id)
        .reduce((acc, key) => {
            const paramKey = urlParamPrefix ? `${urlParamPrefix}${key}` : key
            let value = params.get(paramKey) || variationValues?.[key]
            return value ? {...acc, [key]: value} : acc
        }, {})

    return variationParams
}
