/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import ssrPrepass from 'react-ssr-prepass'
import {dehydrate, hydrate, Hydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {FetchStrategy} from '../fetch-strategy'

const STATE_KEY = '__reactQuery'

/**
 * A HoC for adding React Query support to your application.
 *
 * @param {React.ReactElement} Wrapped The component to be wrapped
 * @param {Object} options
 * @param {Object} options.queryClientConfig The react query client configuration object to be used.
 *
 * @returns {React.ReactElement}
 */
export const withReactQuery = (Wrapped, options = {}) => {
    const isServerSide = typeof window === 'undefined'
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name
    const {queryClientConfig, dehydratedState} = options

    // DEVELOPER NOTE: Is this going to be an issue making the client scoped outside 
    // of the class?
    const __queryClient = new QueryClient(queryClientConfig)

    /**
     * @private
     */
    class WithReactQuery extends FetchStrategy {

        render() {
            return (
                <QueryClientProvider client={__queryClient}>
                    <Hydrate state={isServerSide ? {} : window.__PRELOADED_STATE__?.[STATE_KEY]}>
                        <Wrapped {...this.props} />
                    </Hydrate>
                </QueryClientProvider>
            )
        }

        /**
         * @private
         */
        static async doInitAppState({req, appJSX}) {
            // NOTE FOR SELF: This function only runs on the server, it does not run on the client/browser,
            // so hydration is handled in the render function and we don't require this additional hydration.
            let resolvedDehydratedState = {}

            // DEVELOPER NOTE: We only need to do this when the `dehydratedState` is a function. So that 
            // logic for that conditional check needs to be added. This is just some hacky code.
            if (dehydratedState && !dehydratedState.__hasBeenResolved) {
                // This context will be sent to the function so we can do condition work based on the pathname.
                const context = {
                    location: {
                        pathname: req.originalUrl.split('?')[0]
                    }
                }
                resolvedDehydratedState = await options.dehydratedState(context)
                options.dehydratedState.__hasBeenResolved = true
            }

            const queryClient = __queryClient

            // NOTE: This is where we are pre-populating the client cache.
            hydrate(queryClient, resolvedDehydratedState)
            
            // Use `ssrPrepass` to collect all uses of `useQuery`.
            await ssrPrepass(appJSX)

            const queryCache = queryClient.getQueryCache()
            
            const queries = queryCache.getAll().filter((q) => q.options.enabled !== false)
            await Promise.all(
                queries.map((q) => {
                    // NOTE: dehydratedState queries do not have queryFn definitions at this point, so don't try
                    // to refetch. 
                    // NOTE: We might want to take a look at using a pattern of prefetching data.
                    if (!q.options.queryFn) {
                        return Promise.resolve()
                    }
                    // If there's an error in this fetch, react-query will log the error
                    return q.fetch().catch(() => {
                        // On our end, simply catch any error and move on to the next query
                    })
                })
            )
            
            return {
                [STATE_KEY]: dehydrate(queryClient, {
                    // QUESTION: It looks like more queries are getting dehydtrated that I thought when doing this. Why
                    // are there basket queries in loading state? That might be something we need to fix.
                    shouldDehydrateQuery: ({state}) => ['success', 'error'].includes(state.status)
                })
            }
        }

        /**
         * @private
         */
        static getInitializers() {
            return [WithReactQuery.doInitAppState, ...(Wrapped.getInitializers?.() ?? [])]
        }

        /**
         * @private
         */
        static getHOCsInUse() {
            return [withReactQuery, ...(Wrapped.getHOCsInUse?.() ?? [])]
        }
    }

    WithReactQuery.displayName = `withReactQuery(${wrappedComponentName})`

    const exclude = {
        doInitAppState: true,
        getInitializers: true,
        initAppState: true,
        getHOCsInUse: true
    }
    hoistNonReactStatic(WithReactQuery, Wrapped, exclude)

    return WithReactQuery
}
