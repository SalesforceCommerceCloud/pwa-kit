/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'

// Constants
import {DEFAULT_LIMIT_VALUES} from '../constants'

// Utils
import {buildUrlSet} from '../utils/url'

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
