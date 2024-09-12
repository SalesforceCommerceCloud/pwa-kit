/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'

// Constants
import {
    SHOPPER_CONTEXT_SEARCH_PARAMS,
    SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAMS,
    SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAMS,
    SHOPPER_CONTEXT_GEOLOCATION_SEARCH_PARAM_TO_API_FIELD_MAPPING,
    SHOPPER_CONTEXT_FIELD_TYPES
} from '@salesforce/retail-react-app/app/constants'

/*
 * This hook will return a shopper context object when search params pertinant
 * to shopper context are present.
 */
export const useShopperContextSearchParams = (
    customQualifersSearchParams = SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAMS,
    assignmentQualifiersSearchParams = SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAMS
) => {
    const {search} = useLocation()
    const searchParamsObj = new URLSearchParams(search)

    const shopperContext = getShopperContextFromSearchParams(
        searchParamsObj,
        SHOPPER_CONTEXT_SEARCH_PARAMS
    )
    const geoLocation = getShopperContextFromSearchParams(
        searchParamsObj,
        SHOPPER_CONTEXT_GEOLOCATION_SEARCH_PARAM_TO_API_FIELD_MAPPING
    )
    const customQualifiers = getShopperContextFromSearchParams(
        searchParamsObj,
        customQualifersSearchParams
    )
    const assignmentQualifiers = getShopperContextFromSearchParams(
        searchParamsObj,
        assignmentQualifiersSearchParams
    )

    return {
        ...shopperContext,
        ...(Object.keys(geoLocation).length && {geoLocation}),
        ...(Object.keys(customQualifiers).length && {customQualifiers}),
        ...(Object.keys(assignmentQualifiers).length && {assignmentQualifiers})
    }
}

// Iterate through the search parameters and apply the mapping with types
export const getShopperContextFromSearchParams = (searchParamsObj, paramToApiFieldMapping) => {
    const shopperContextObj = {}
    for (const [key, value] of searchParamsObj.entries()) {
        if (paramToApiFieldMapping[key]) {
            const {apiField, type} = paramToApiFieldMapping[key]

            if (
                type === SHOPPER_CONTEXT_FIELD_TYPES.INT ||
                type === SHOPPER_CONTEXT_FIELD_TYPES.DOUBLE
            ) {
                shopperContextObj[apiField] = Number(value)
            } else if (type === SHOPPER_CONTEXT_FIELD_TYPES.ARRAY) {
                shopperContextObj[apiField] = searchParamsObj.getAll(key)
            } else {
                // Default to string
                shopperContextObj[apiField] = value
            }
        }
    }
    return shopperContextObj
}
