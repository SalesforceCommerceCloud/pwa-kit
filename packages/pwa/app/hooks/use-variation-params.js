/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
