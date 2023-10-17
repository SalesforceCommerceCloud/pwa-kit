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
const LOADING_SPINNER_DURATION = 1000

const RefetchData = () => {
    const history = useHistory()
    const location = useLocation()

    let queryClient
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        queryClient = useQueryClient()
    } catch (err) {
        // Do nothing. Leave queryClient as undefined.
        // Continue to navigate to the referrer
    }

    useEffect(() => {
        if (queryClient) {
            queryClient.invalidateQueries()
        }

        const searchParams = new URLSearchParams(location.search)
        const referrer = searchParams.get('referrer')

        if (referrer) {
            // Soft navigate to the referrer
            setTimeout(() => history.replace(referrer), LOADING_SPINNER_DURATION)
        } else {
            console.error('Expecting to see `referrer` search param in the page url.')
        }
    }, [])

    return <LoadingSpinner />
}
RefetchData.displayName = 'RefetchData'

export default RefetchData
