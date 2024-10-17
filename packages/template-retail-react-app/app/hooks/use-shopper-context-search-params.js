/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'

// Constants
import {
    SHOPPER_CONTEXT_SEARCH_PARAMS,
    SHOPPER_CONTEXT_FIELD_TYPES
} from '@salesforce/retail-react-app/app/constants'

/**
 * This hook will return a shopper context object when search params related
 * to shopper context are present.
 *
 * @returns {Object} A shopper context object that can be passed to the Shopper Context API
 */
export const useShopperContextSearchParams = () => {
    const {search} = useLocation()
    return useMemo(() => {
        const searchParamsObj = new URLSearchParams(search)
        const {
            geoLocation: geoLocationSearchParams,
            customQualifiers: customQualiferSearchParams,
            assignmentQualifiers: assignmentQualifierSearchParams,
            ...rootQualifierSearchParams
        } = SHOPPER_CONTEXT_SEARCH_PARAMS

        const rootQualifiers = getShopperContextFromSearchParams(
            searchParamsObj,
            rootQualifierSearchParams
        )
        const geoLocation = getShopperContextFromSearchParams(
            searchParamsObj,
            geoLocationSearchParams
        )
        const customQualifiers = getShopperContextFromSearchParams(
            searchParamsObj,
            customQualiferSearchParams
        )
        const assignmentQualifiers = getShopperContextFromSearchParams(
            searchParamsObj,
            assignmentQualifierSearchParams
        )

        return {
            ...rootQualifiers,
            ...(Object.keys(geoLocation).length && {geoLocation}),
            ...(Object.keys(customQualifiers).length && {customQualifiers}),
            ...(Object.keys(assignmentQualifiers).length && {assignmentQualifiers})
        }
    }, [search])
}

/**
 * Converts search parameters into a shopper context object based on a provided mapping.
 *
 * @private
 * @param {URLSearchParams} searchParamsObj - The search parameters object
 * @param {Object} searchParamToApiFieldMapping - An object mapping search parameter keys to API field names and types
 * @returns {Object} The shopper context object where keys are API field names and values are the converted search parameter values.
 */
export const getShopperContextFromSearchParams = (
    searchParamsObj,
    searchParamToApiFieldMapping
) => {
    const shopperContextObj = {}
    for (const [searchParamKey, searchParamValue] of searchParamsObj.entries()) {
        // Find the mapping entry where paramName matches the searchParamKey
        const mappingEntry = Object.entries(searchParamToApiFieldMapping).find(
            ([, entry]) => entry.paramName === searchParamKey
        )

        if (mappingEntry) {
            const [apiFieldName, {type}] = mappingEntry
            switch (type) {
                case SHOPPER_CONTEXT_FIELD_TYPES.INT:
                case SHOPPER_CONTEXT_FIELD_TYPES.DOUBLE:
                    shopperContextObj[apiFieldName] = Number(searchParamValue)
                    break
                case SHOPPER_CONTEXT_FIELD_TYPES.ARRAY:
                    shopperContextObj[apiFieldName] = searchParamsObj.getAll(searchParamKey)
                    break
                default:
                    // Default to string
                    shopperContextObj[apiFieldName] = searchParamValue
                    break
            }
        }
    }

    return shopperContextObj
}
