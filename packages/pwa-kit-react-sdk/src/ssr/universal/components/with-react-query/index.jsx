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

    const WrappedComponent = ({...passThroughProps}) => {
        const state =
            typeof window === 'undefined' ? {} : window?.__PRELOADED_STATE__?.[STATE_KEY] || {}

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
     * Returns an array of primises. The first is a promise that resolved to the query data, the subsequest
     * promises are those primises resolving in query data from child components that implement the
     * `getDataPromises` function.
     *
     * @param {Object} renderContext
     *
     * @return {Promise<Object[]>}
     */
    WrappedComponent.getDataPromises = (renderContext) => {
        const {AppJSX} = renderContext

        const dataPromise = Promise.resolve()
            .then(() => ssrPrepass(AppJSX)) // NOTE: ssrPrepass will be included in the vendor bundle. BAD
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
            .then(() => ({[STATE_KEY]: dehydrate(queryClient)}))

        return [
            dataPromise,
            ...(Component.getDataPromises ? Component.getDataPromises(renderContext) : [])
        ]
    }

    let _staticContext
    // Should be called immediately after wrapping a component with this HOC
    // @private
    WrappedComponent.initStaticContext = (value) => {
        _staticContext = value

        if (Component.initStaticContext) {
            Component.initStaticContext(value)
        }
    }

    WrappedComponent.displayName = `withReactQuery(${wrappedComponentName})`

    return WrappedComponent
}

export default withReactQuery
