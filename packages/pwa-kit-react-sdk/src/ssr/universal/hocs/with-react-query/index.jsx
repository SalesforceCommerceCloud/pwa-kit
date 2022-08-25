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
import {compose} from '../../utils'
import {withErrorHandling} from '../../hocs'

const USAGE_WARNING = `This HOC can only be used on your PWA-Kit App component. We cannot guarantee its functionality if used elsewhere.`
const STATE_KEY = '__REACT_QUERY__'

/**
 * This higher order component will configure your PWA-Kit application with React Query. Uses of
 * the `useQuery` hook will also work server-side.
 * 
 * @param {*} Component 
 * @returns 
 */
const withReactQuery = (Component) => {
    Component = 
        compose(
            withLoadableResolver,
            withErrorHandling
        )(Component)

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
                : window?.__PRELOADED_STATE__?.[STATE_KEY] || {}

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
     * 
     * @param {*} renderContext
     * @returns
     */
    WrappedComponent.getDataPromises = (renderContext) => {
        const {AppJSX} = renderContext

        const dataPromise = 
            Promise.resolve()
                .then(() => ssrPrepass(AppJSX)) // NOTE: ssrPrepass will be included in the vendor bundle. BAD
                .then(() => {
                    const queryCache = queryClient.getQueryCache()
                    const queries = queryCache.getAll()
                    const promises = queries
                        .filter(({options}) => options.enabled !== false)
                        .map((query) => query.fetch())
                    
                    return Promise.all(promises)
                })
                .then(() => ({[STATE_KEY]: dehydrate(queryClient)}))
        
        let promises = [dataPromise]
        
        if (Component.getDataPromises) {
            promises = [...promises, ...Component.getDataPromises(args)]
        }

        return promises
    }

    WrappedComponent.displayName = `withReactQuery(${wrappedComponentName})`

    return WrappedComponent
}

export default withReactQuery
