/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'

// Constants
import {
    SHOPPER_CONTEXT_SEARCH_PARAMS,
    SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAMS,
    SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAMS
} from '@salesforce/retail-react-app/app/constants'

/*
 * This hook will return all the location search params pertinant
 * to shopper context.
 */
export const useShopperContextSearchParams = (
    arraySearchParams = [SHOPPER_CONTEXT_SEARCH_PARAMS.CUSTOMER_GROUP_IDS]
) => {
    const {search} = useLocation()
    const searchParamsObj = new URLSearchParams(search)

    const getSearchParam = (key, isList = false) =>
        searchParamsObj.has(key)
            ? {[key]: isList ? searchParamsObj.getAll(key) : searchParamsObj.get(key)}
            : {}
    const reduceParams = (keys) =>
        keys.reduce(
            (acc, key) => ({...acc, ...getSearchParam(key, arraySearchParams.includes(key))}),
            {}
        )

    const customQualifiers = reduceParams(
        Object.values(SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAMS)
    )
    const assignmentQualifiers = reduceParams(
        Object.values(SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAMS)
    )
    const shopperContextObj = reduceParams(Object.values(SHOPPER_CONTEXT_SEARCH_PARAMS))

    return {
        ...shopperContextObj,
        ...(Object.keys(customQualifiers).length && {customQualifiers}),
        ...(Object.keys(assignmentQualifiers).length && {assignmentQualifiers})
    }
}
