/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'

// Constants
import {
    SHOPPER_CONTEXT_SEARCH_PARAM_TO_API_FIELD_MAPPING,
    SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAM_TO_API_FIELD_MAPPING,
    SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAM_TO_API_FIELD_MAPPING,
    SHOPPER_CONTEXT_GEOLOCATION_SEARCH_PARAM_TO_API_FIELD_MAPPING,
    SHOPPER_CONTEXT_FIELD_TYPES
} from '@salesforce/retail-react-app/app/constants'

/**
 * This hook will return a shopper context object when search params related
 * to shopper context are present.
 *
 * @param {Object} customQualifersSearchParams - object containing the search param to API field mapping related to customQualifers
 * @param {Object} assignmentQualifiersSearchParams - object containing the search param to API field mapping related to assignmentQualifiers
 * @returns {Object} A shopper context object that can be passed to the Shopper Context API
 */
export const useShopperContextSearchParams = (
    customQualifersSearchParams = SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAM_TO_API_FIELD_MAPPING,
    assignmentQualifiersSearchParams = SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAM_TO_API_FIELD_MAPPING
) => {
    const {search} = useLocation()
    const searchParamsObj = new URLSearchParams(search)

    const shopperContext = getShopperContextFromSearchParams(
        searchParamsObj,
        SHOPPER_CONTEXT_SEARCH_PARAM_TO_API_FIELD_MAPPING
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

/**
 * Converts search parameters into a shopper context object based on a provided mapping.
 *
 * @param {URLSearchParams} searchParamsObj - The search parameters object
 * @param {Object} searchParamToApiFieldMapping - An object mapping search parameter keys to API field names and types
 * @returns {Object} The shopper context object where keys are API field names and values are the converted search parameter values.
 */
export const getShopperContextFromSearchParams = (
    searchParamsObj,
    searchParamToApiFieldMapping
) => {
    const shopperContextObj = {}
    for (const [key, value] of searchParamsObj.entries()) {
        if (searchParamToApiFieldMapping[key]) {
            const {apiField, type} = searchParamToApiFieldMapping[key]

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
