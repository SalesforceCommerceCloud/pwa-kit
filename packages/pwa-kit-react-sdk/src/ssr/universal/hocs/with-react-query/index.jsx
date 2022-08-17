/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {dehydrate, Hydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import hoistNonReactStatic from 'hoist-non-react-statics'
import ssrPrepass from 'react-ssr-prepass'

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit App component. We cannot guarantee it's functionality if used elsewhere.`


/**
 * This higher order component will configure your PWA-Kit application with React Query. Uses of
 * the `useQuery` hook will also work server-side.
 */
const withQueryClientAPI = (Component) => {
    console.log('withQueryClientAPI')
    const wrappedComponentName = Component.displayName || Component.name
    console.log(`Adding query API to: `, wrappedComponentName)
    if (wrappedComponentName !== 'App') {
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

    // Expose statics from the wrapped component on the HOC
    hoistNonReactStatic(WrappedComponent, Component)

    /**
     * 
     */
    WrappedComponent.initAppState = async (args) => {
        // NOTE: Do we really need to pass in the AppJSX as a whole for prepass? Can we get away with 
        // creating a simplified AppJSX with the App and Page components.
        const {AppJSX} = args

        // NOTE: IT would be nice to push this logic out of this function and put it in the render function,
        // something like resolving with an array of values.
        let wrappeeState
        if (Component.initAppState) {
            wrappeeState = await Component.initAppState(args)
        }

        let error
        let appState

        try {
            await ssrPrepass(AppJSX)

            const queryCache = queryClient.getQueryCache()
            const queries = queryCache.getAll()
            const promises = queries
                .filter(({options}) => options.enabled !== false)
                .map((query) => query.fetch())

            // NOTE: Does this return a value? Do we need dehydrate?
            await Promise.all(promises)
            appState = {
                __REACT_QUERY_STATE__:  dehydrate(queryClient),
                ...wrappeeState?.appState
            }
        } catch (e) {
            error = e
        }

        return {
            appState,
            error
        }
        
    }

    WrappedComponent.displayName = `WithQueryClientProvider(${wrappedComponentName})`

    return WrappedComponent
}

export default withQueryClientAPI
