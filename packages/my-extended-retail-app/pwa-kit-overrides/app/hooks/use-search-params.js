/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'
import queryString from 'query-string'

// Constants
import {DEFAULT_SEARCH_PARAMS} from '@salesforce/retail-react-app/app/constants'

const PARSE_OPTIONS = {
    parseBooleans: true,
    parseNumbers: true
}

/*
 * This hook will return all the location search params pertinant
 * to the product list page.
 */
export const useSearchParams = (searchParams = DEFAULT_SEARCH_PARAMS, parseRefine = true) => {
    const {search} = useLocation()

    // Encode the search query, including preset values.
    const searchParamsObject = {
        ...searchParams,
        ...parse(search.substring(1), parseRefine)
    }

    return [searchParamsObject, {stringify, parse}]
}

/**
 * Encode's the provided search parameters object, paying special attention to ensure
 * that the child `refine` object is alway encoded correctly.
 *
 * @param {Object} searchParamsObj
 * @returns
 */
export const stringify = (searchParamsObj) => {
    let searchParamsObjCopy = {...searchParamsObj}

    // Remove our copy of the original refinement value so it's not stringified.
    delete searchParamsObjCopy._refine

    // "stringify" the nested refinements
    searchParamsObjCopy.refine = Object.keys(searchParamsObjCopy.refine).map((key) =>
        queryString.stringify(
            {[key]: searchParamsObjCopy.refine[key]},
            {
                arrayFormat: 'separator',
                arrayFormatSeparator: '|',
                encode: false
            }
        )
    )

    // "stringify" the entire object
    searchParamsObjCopy = queryString.stringify(searchParamsObjCopy)
    return searchParamsObjCopy
}

/**
 * Decode's the provided query string representation of a search parameter object, paying
 * special attention to also decode the 'refine' object.
 *
 * @param {Object} searchParamsStr
 * @param {Boolean} parseRefine - opt out of parsing the inner refine object.
 * @returns
 */
export const parse = (searchParamsStr, parseRefine = true) => {
    const params = queryString.parse(searchParamsStr, PARSE_OPTIONS)

    // Ensure the refinments is an array (make it easier to manipulate).
    params.refine = Array.isArray(params.refine) ? params.refine : [params.refine].filter(Boolean)

    // Parse the nested refinement entries.
    if (parseRefine) {
        params._refine = params.refine
        params.refine = params.refine.reduce((acc, curr) => {
            return {
                ...acc,
                ...queryString.parse(curr, {
                    ...PARSE_OPTIONS,
                    parseNumbers: false,
                    arrayFormat: 'separator',
                    arrayFormatSeparator: '|'
                })
            }
        }, {})
    }

    return params
}
