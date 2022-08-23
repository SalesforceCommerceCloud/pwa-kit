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
import withLoadableResolver from '../with-loadable-resolver'

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit App component. We cannot guarantee its functionality if used elsewhere.`

/**
 * This higher order component will configure your PWA-Kit application with React Query. Uses of
 * the `useQuery` hook will also work server-side.
 * 
 * @param {*} Component 
 * @returns 
 */
const withReactQuery = (Component) => {
    Component = withLoadableResolver(Component)

    const wrappedComponentName = Component.displayName || Component.name

    // NOTE: Is this a reliable way to determine the component type (e.g. will this work in prodution
    // when code is minified?)
    if (!wrappedComponentName.includes('App')) {
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
    // NOTE: THIS MUST COME BEFORE WE DEFINE ANY NEW CLASS STATIC FUNCTIONS.
    hoistNonReactStatic(WrappedComponent, Component)

    /**
     *
     * @param {*} routes
     * @returns
     */
    WrappedComponent.enhanceRoutes = (routes = []) => {
        routes = Component.enhanceRoutes ? Component.enhanceRoutes(routes) : routes

        return routes
    }

    /**
     *
     * @param {*} args
     * @returns
     */
    WrappedComponent.fetchState = async (args) => {
        // NOTE: Do we really need to pass in the AppJSX as a whole for prepass? Can we get away with
        // creating a simplified AppJSX with the App and Page components.
        const {AppJSX} = args

        // NOTE: It would be nice to push this logic out of this function and put it in the render function,
        // something like resolving with an array of values.
        let wrappeeState
        if (Component.fetchState) {
            wrappeeState = await Component.fetchState(args)
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
                __REACT_QUERY_STATE__: dehydrate(queryClient),
                ...wrappeeState?.appState
            }
        } catch (e) {
            error = e
        }

        console.log('REACT QUERY: ', {
            appState,
            error
        })
        return {
            appState,
            error
        }
    }

    WrappedComponent.displayName = `withReactQuery(${wrappedComponentName})`

    return WrappedComponent
}

export default withReactQuery
