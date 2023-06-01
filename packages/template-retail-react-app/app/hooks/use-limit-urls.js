/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'

// Constants
import {DEFAULT_LIMIT_VALUES} from '@salesforce/retail-react-app/app/constants'

// Utils
import {buildUrlSet} from '@salesforce/retail-react-app/app/utils/url'

/*
 * Generate a memoized list of page size urls. Chaning the page size will reset
 * the offset to zero to simplify things.
 */
export const useLimitUrls = () => {
    const location = useLocation()

    return useMemo(
        () =>
            buildUrlSet(`${location.pathname}${location.search}`, 'limit', DEFAULT_LIMIT_VALUES, {
                offset: 0
            }),
        [location.search, location.pathname]
    )
}
