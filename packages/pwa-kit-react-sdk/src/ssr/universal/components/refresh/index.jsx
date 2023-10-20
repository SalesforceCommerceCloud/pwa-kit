/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import {useQueryClient} from '@tanstack/react-query'
import LoadingSpinner from '../loading-spinner'

// For good UX, show loading spinner long enough for users to see
const LOADING_SPINNER_MIN_DURATION = 500

/**
 * A _private_ component to show loading spinner while refetching data on the client-side.
 * To trigger this refetch, we do soft navigation back to the referrer.
 * So this component is meant to be used as a route with `referrer` search param.
 *
 * @example
 * const navigate = useNavigation()
 * navigate(`/__refetch-data?referrer=${encodeURIComponent(urlOfCurrentPage)}`, 'replace')
 *
 * @private
 */
const Refresh = () => {
    const history = useHistory()
    const location = useLocation()

    let queryClient
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        queryClient = useQueryClient()
    } catch (err) {
        // `useQueryClient` throws an error if the project does not use react-query.
        // So in this case, leave `queryClient` as undefined. Continue to navigate to the referrer.
    }

    useEffect(() => {
        const refetchData = async () => {
            const showLoadingSpinner = new Promise((resolve) =>
                setTimeout(resolve, LOADING_SPINNER_MIN_DURATION)
            )
            const invalidateQueries = queryClient?.invalidateQueries()

            await Promise.all([showLoadingSpinner, invalidateQueries])

            // Soft navigate to the referrer
            let referrer = new URLSearchParams(location.search).get('referrer')
            if (!referrer) {
                console.warn('Could not find `referrer` search param - redirecting to home page.')
                referrer = '/'
            }
            history.replace(referrer)
        }
        refetchData()
    }, [])

    return <LoadingSpinner />
}
Refresh.displayName = 'Refresh'

export default Refresh