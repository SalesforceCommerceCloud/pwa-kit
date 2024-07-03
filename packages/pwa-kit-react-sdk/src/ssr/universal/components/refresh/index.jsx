/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import {useQueryClient} from '@tanstack/react-query'
import logger from '../../../../utils/logger-instance'

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
                logger.warn('Could not find `referrer` search param - redirecting to home page.', {
                    namespace: 'Refresh.useEffect'
                })
                referrer = '/'
            }
            history.replace(referrer)
        }
        refetchData()
    }, [])

    return <LoadingSpinner />
}
Refresh.displayName = 'Refresh'

const LoadingSpinner = () => {
    return (
        <>
            <style>
                {`
                .pwa-kit-loading-spinner-outer {
                    z-index: 1300;
                    position: absolute;
                    top: 0px;
                    left: 0px;
                    right: 0px;
                    bottom: 0px;
                    background: rgba(255, 255, 255, 0.80);
                }
                .pwa-kit-loading-spinner-wrapper {
                    display: inline-block;
                    border-color: currentColor;
                    border-style: solid;
                    border-radius: 99999px;
                    border-width: 4px;
                    border-bottom-color: #C9C9C9;
                    border-left-color: #C9C9C9;
                    -webkit-animation: animation-b7n1on 0.65s linear infinite;
                    animation: animation-b7n1on 0.65s linear infinite;
                    width: 3rem;
                    height: 3rem;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    margin-left: -1.5em;
                    margin-top: -1.5em;
                    color: #0176D3;
                }
                .pwa-kit-loading-spinner-inner {
                    border: 0px;
                    clip: rect(0, 0, 0, 0);
                    width: 1px;
                    height: 1px;
                    margin: -1px;
                    padding: 0px;
                    overflow: hidden;
                    white-space: nowrap;
                    position: absolute;
                }
                `}
            </style>

            <div className="pwa-kit-loading-spinner-outer" data-testid="loading-spinner">
                <div className="pwa-kit-loading-spinner-wrapper">
                    <span className="pwa-kit-loading-spinner-inner">Loading...</span>
                </div>
            </div>
        </>
    )
}

export default Refresh
