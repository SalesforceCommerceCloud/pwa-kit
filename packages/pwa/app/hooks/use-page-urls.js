/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
export const usePageUrls = ({total = 0}) => {
    const location = useLocation()
    const {limit} = useSearchParams()

    return useMemo(() => {
        const pageCount = Math.ceil(total / limit)

        return buildUrlSet(
            `${location.pathname}${location.search}`,
            'offset',
            new Array(pageCount).fill(0).map((_, index) => index * limit)
        )
    }, [location.pathname, location.search, limit, total])
}
