/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {dehydrate, Hydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import hoistNonReactStatic from 'hoist-non-react-statics'

/**
 * 
 *
 *
 */
const withQueryClientProvider = (Component) => {
    console.log('WRAPPING THE APP COMPONENT')
    const wrappedComponentName = Component.displayName || Component.name
    const queryClient = new QueryClient()
    const WrappedComponent = ({...passThroughProps}) => {
        const state = typeof window === 'undefined' ? {} : window?.__PRELOADED_STATE__?.__REACT_QUERY_STATE__ || {}

        return (
            <QueryClientProvider client={queryClient}>
                <Hydrate state={state}>
                    <Component {...passThroughProps}/>
                </Hydrate>
            </QueryClientProvider>
        )
    }

    WrappedComponent.propTypes = {}
    
    WrappedComponent.dehydrate = () => {
        return dehydrate(queryClient)
    }

    WrappedComponent.getQueryPromises = () => {
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
