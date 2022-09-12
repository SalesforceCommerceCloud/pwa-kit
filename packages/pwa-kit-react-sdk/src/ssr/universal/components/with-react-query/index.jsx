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

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit App component. We cannot guarantee its functionality if used elsewhere.`
const STATE_KEY = '__REACT_QUERY__'

/**
 * This higher order component will configure your PWA-Kit application with React Query. Uses of
 * the `useQuery` hook will also work server-side.
 *
 * @param {*} Component
 * @returns
 */
export const withReactQuery = (Component) => {
    const wrappedComponentName = Component.displayName || Component.name

    // NOTE: Is this a reliable way to determine the component type (e.g. will this work in prodution
    // when code is minified?)
    if (!wrappedComponentName.includes('App')) {
        console.warn(USAGE_WARNING)
    }

    const queryClient = new QueryClient()

    // NOTE: The appState for the entire application will always be passed in as a prop. This
    // include this enhancers state (the retun value from the getData static). We'll use it during
    // rendering an hydration of the application.
    const WrappedComponent = ({...passThroughProps}) => {
        const state =
            typeof window === 'undefined' ? 
                (passThroughProps?.appState ? passThroughProps?.appState?.[STATE_KEY] : {}) : 
                window?.__PRELOADED_STATE__?.[STATE_KEY] || {}

        return (
            <QueryClientProvider client={queryClient}>
                <Hydrate state={state}>
                    <Component {...passThroughProps} />
                </Hydrate>
            </QueryClientProvider>
        )
    }

    /**
     * Returns an array of primises. The first is a promise that resolved to the query data, the subsequest
     * promises are those primises resolving in query data from child components that implement the
     * `getDataPromises` function.
     *
     * @param {Object} renderContext
     *
     * @return {Promise<Object[]>}
     */
     WrappedComponent.getData = (renderContext) => {
        // NOTE: This isn't ideal, but we need to reconstruct the appJSX because the value
        // passed in the context isn't enhanced with react query. Need to investigate this 
        // a little futher.
        const {req, res, error, App, getAppJSX, 
            appState,
            location,
            routerContext,
            routes} = renderContext
        
        const AppJSX = getAppJSX(req, res, error, {
            App,
            appState,
            location,
            routerContext,
            routes
        })

        return Promise.resolve()
            .then(() => ssrPrepass(AppJSX))
            .then(() => {
                const queryCache = queryClient.getQueryCache()
                const queries = queryCache.getAll()
                const promises = queries
                    .filter(({options}) => options.enabled !== false)
                    .map((query) => query.fetch().catch((error) => {
                        // NOTE: Our best attempt to create a logical return object without
                        // getting out of hand.
                        return {
                            error,
                            errorUpdatedAt: Date.now(),
                            errorUpdateCount: 1,
                            isError: true,
                            isLoadingError: true,
                            isRefetchError: false,
                            status: 'error'
                        }
                    }))

                return Promise.all(promises)
            })
            .then(() => (dehydrate(queryClient)))
    }

    // Note: I have the option of using "excludes" or defining the statics after hoisting. Not sure if
    // there is any other difference. Using the excludes is a little more explicit. 
    const excludes = {
        getRoutes: true,
        getData: true
    }

    hoistNonReactStatic(WrappedComponent, Component, excludes)

    WrappedComponent.displayName = `withReactQuery(${wrappedComponentName})`

    // Maybe this is better written as a function? Just to be consisten with the api.
    WrappedComponent.apiName = STATE_KEY

    return WrappedComponent
}

export default withReactQuery
