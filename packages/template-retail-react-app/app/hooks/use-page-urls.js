/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'

// Utils
import {buildUrlSet} from '../utils/url'

// Hooks
import {useSearchParams} from './use-search-params'

/*
 * Generate a memoized list of page size urls. Chaning the page size will reset
 * the offset to zero to simplify things.
 */
export const usePageUrls = ({total = 0, limit}) => {
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const _limit = limit || searchParams.limit

    return useMemo(() => {
        const pageCount = Math.ceil(total / _limit)

        return buildUrlSet(
            `${location.pathname}${location.search}`,
            'offset',
            new Array(pageCount).fill(0).map((_, index) => index * _limit)
        )
    }, [location.pathname, location.search, _limit, total])
}
