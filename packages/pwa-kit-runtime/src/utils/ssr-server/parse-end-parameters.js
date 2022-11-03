/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const parseEndParameters = (params) => {
    // If data is specified in a call to end(), it is equivalent to
    // calling response.write(data, encoding) followed by
    // response.end(callback). We need the data to be sent before
    // we call _storeResponseInCache, and we want to call end()
    // after _storeResponseInCache is done. Therefore we have to
    // parse the arguments, which is a little complex since end()
    // may be called with a range of different patterns.
    const result = {}
    params?.forEach((value) => {
        // Any function parameter must be the callback
        if (typeof value === 'function') {
            result.callback = value
        } else {
            // If we haven't assigned anything to data yet,
            // this parameter must be the data.
            if (result.data === undefined) {
                result.data = value
            } else {
                result.encoding = value
            }
        }
    })
    return result
}
