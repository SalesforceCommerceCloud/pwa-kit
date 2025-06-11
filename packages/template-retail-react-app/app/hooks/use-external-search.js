/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useMemo} from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks/use-search-params'
import {searchUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'

/**
 * Routing when external search parameters are present in the URL to the appropriate search results
 */
const useExternalSearch = () => {
    const history = useHistory()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    const hasExternalSearchParams = useMemo(() => {
        if (typeof window === 'undefined') return false
        const urlParams = new URLSearchParams(location.search)
        return urlParams.has('q') || urlParams.has('search') || urlParams.has('query')
    }, [location.search])

    useEffect(() => {
        if (!hasExternalSearchParams) {
            return
        }

        if (typeof window === 'undefined'){
            return
        }

        // need to pre-process out filler words like location hints, and handle multi-word searches
        const rawQuery = searchParams?.q ?? searchParams?.search ?? searchParams?.query;
        const query = (typeof rawQuery === 'string' ? rawQuery : '').trim();

        if (!query) {
            return;
        }

        if (location?.pathname?.startsWith('/search')) {
            return
        }

        if (!history || !history.push) {
            return
        }

        const searchUrl = searchUrlBuilder(query)

        try {
            history.push(searchUrl)
        } catch (error) {
            console.warn(error)
        }

    }, [hasExternalSearchParams, location?.pathname, searchParams?.q, searchParams?.search, searchParams?.query, history])
}

export default useExternalSearch
