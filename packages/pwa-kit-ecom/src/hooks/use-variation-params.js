/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'

/*
 * This hook will return only the params that are also product attributes for the
 * passed in product object.
 */
export const useVariationParams = (product = {}) => {
    const {variationAttributes = [], variationValues = {}} = product
    const variationParams = variationAttributes.map(({id}) => id)

    const {search} = useLocation()
    const params = new URLSearchParams(search)
    // Using all the variation attribute id from the array generated above, get
    // the value if there is one from the location search params and add it to the
    // accumulator.
    const filteredVariationParams = variationParams.reduce((acc, key) => {
        let value = params.get(`${key}`) || variationValues?.[key]
        return value ? {...acc, [key]: value} : acc
    }, {})

    return filteredVariationParams
}
