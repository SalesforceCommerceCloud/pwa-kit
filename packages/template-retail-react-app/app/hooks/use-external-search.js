/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks/use-search-params'
import {searchUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'

/**
 * routing external search queries to the appropriate product page. It leverages the existing search
 * - Detects external search URLs (e.g., yoursite.com/?q=search-term)
 * - Redirects to the existing search page using searchUrlBuilder
 */
const useExternalSearch = () => {
    const history = useHistory()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        if (typeof window === 'undefined'){
            return
        }

        if (location?.pathname?.startsWith('/search')) {
            return
        }

        // Get the search query from URL parameters - 
        // we need to pre-process out filler words like location hints etc
        const rawQuery = searchParams?.q ?? searchParams?.search ?? searchParams?.query;
        const query = (typeof rawQuery === 'string' ? rawQuery : '').trim();

        if (!query) {
            return;
        }

        // Validate we have history API
        if (!history || !history.push) {
            return
        }

        const searchUrl = searchUrlBuilder(query)

        try {
            history.push(searchUrl)
        } catch (error) {
            console.warn(error)
        }

    }, [location?.pathname, searchParams?.q, searchParams?.search, searchParams?.query, history])
}

export default useExternalSearch
