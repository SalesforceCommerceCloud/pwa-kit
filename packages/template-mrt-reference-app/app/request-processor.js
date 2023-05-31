/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {QueryParameters} from '@salesforce/pwa-kit-runtime/utils/ssr-request-processing'

const exclusions = ['removeme']

export const processRequest = ({path, querystring, parameters}) => {
    console.assert(parameters, 'Missing parameters')

    // Query string filtering

    // Build a first QueryParameters object from the given querystring
    const queryParameters = new QueryParameters(querystring)

    // Build a second QueryParameters from the first, with all
    // excluded parameters removed
    const filtered = QueryParameters.from(
        queryParameters.parameters.filter(
            // parameter.key is always lower-case
            (parameter) => !exclusions.includes(parameter.key)
        )
    )

    // Re-generate the querystring
    querystring = filtered.toString()

    return {
        path,
        querystring
    }
}
