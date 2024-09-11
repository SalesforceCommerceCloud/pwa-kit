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
    SHOPPER_CONTEXT_ARRAY_FIELDS
} from '@salesforce/retail-react-app/app/constants'

/*
 * This hook will return a shopper context object when search params pertinant
 * to shopper context are present.
 */
export const useShopperContextSearchParams = (
    customQualifersSearchParams = SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAMS,
    assignmentQualifiersSearchParams = SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAMS,
    arraySearchParams = SHOPPER_CONTEXT_ARRAY_FIELDS
) => {
    const {search} = useLocation()
    const searchParamsObj = new URLSearchParams(search)
    // Parses the search param key and value into an object
    const getSearchParam = (key, isList = false) =>
        searchParamsObj.has(key)
            ? {[key]: isList ? searchParamsObj.getAll(key) : searchParamsObj.get(key)}
            : {}

    // Merges the shopper context search param key and values into a single object.
    const reduceParams = (keys) =>
        keys.reduce(
            (acc, key) => ({...acc, ...getSearchParam(key, arraySearchParams.includes(key))}),
            {}
        )

    const shopperContext = {
        ...(searchParamsObj.has(SHOPPER_CONTEXT_SEARCH_PARAMS.SOURCE_CODE) && {
            sourceCode: searchParamsObj.get(SHOPPER_CONTEXT_SEARCH_PARAMS.SOURCE_CODE)
        }),
        ...(searchParamsObj.has(SHOPPER_CONTEXT_SEARCH_PARAMS.EFFECTIVE_DATE_TIME) && {
            effectiveDateTime: searchParamsObj.get(
                SHOPPER_CONTEXT_SEARCH_PARAMS.EFFECTIVE_DATE_TIME
            )
        }),
        ...(searchParamsObj.has(SHOPPER_CONTEXT_SEARCH_PARAMS.CUSTOMER_GROUP_IDS) && {
            customerGroupIds: searchParamsObj.getAll(
                SHOPPER_CONTEXT_SEARCH_PARAMS.CUSTOMER_GROUP_IDS
            )
        })
    }
    const customQualifiers = reduceParams(Object.values(customQualifersSearchParams))
    const assignmentQualifiers = reduceParams(Object.values(assignmentQualifiersSearchParams))

    return {
        ...shopperContext,
        ...(Object.keys(customQualifiers).length && {customQualifiers}),
        ...(Object.keys(assignmentQualifiers).length && {assignmentQualifiers})
    }
}
