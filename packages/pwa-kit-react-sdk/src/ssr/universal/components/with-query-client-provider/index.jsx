/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {dehydrate, Hydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import hoistNonReactStatic from 'hoist-non-react-statics'

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit AppConfig component. We cannot guarantee it's functionality if used elsewhere.`

/**
 * This higher order component will configure your PWA-Kit application with React Query. Uses of
 * the `useQuery` hook will also work server-side.
 */
const withQueryClientProvider = (Component) => {
    const wrappedComponentName = Component.displayName || Component.name

    if (wrappedComponentName !== 'AppConfig') {
        console.warn(USAGE_WARNING)
    }

    const queryClient = new QueryClient()
    const WrappedComponent = ({...passThroughProps}) => {
        const state =
            typeof window === 'undefined'
                ? {}
                : window?.__PRELOADED_STATE__?.__REACT_QUERY_STATE__ || {}

        return (
            <QueryClientProvider client={queryClient}>
                <Hydrate state={state}>
                    <Component {...passThroughProps} />
                </Hydrate>
            </QueryClientProvider>
        )
    }

    /**
     * Runs the `dehydrate` method on the HOCs query client object.
     *
     * @returns {Object} The query clients dehydrated state.
     */
    WrappedComponent.dehydrate = () => {
        return dehydrate(queryClient)
    }

    /**
     * Returns all the enabled fetch promises for the current
     * queryClient object.
     *
     * @returns {Promise<TData>[]} An array of promises that resole with the value
     * returned in the query fetch.
     */
    WrappedComponent.getAllQueryPromises = () => {
        const queryCache = queryClient.getQueryCache()
        const queries = queryCache.getAll()
        const queryPromises = queries
            .filter(({options}) => options.enabled !== false)
            .map((query) => query.fetch())

        return queryPromises
    }

    // Expose statics from the wrapped component on the HOC
    hoistNonReactStatic(WrappedComponent, Component)

    WrappedComponent.displayName = `WithQueryClientProvider(${wrappedComponentName})`

    return WrappedComponent
}

export default withQueryClientProvider
