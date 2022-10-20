/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import ssrPrepass from 'react-ssr-prepass'
import {dehydrate, Hydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {FetchStrategy} from '../fetch-strategy'

const STATE_KEY = '__reactQuery'

// This is where we want to set the default query client configuration that are
// safe for execution on the server and client. If there are any other config
// option defaults that need to be set in the future, they should be set here.
const SAFE_QUERY_CLIENT_CONFIG = {
    defaultOptions: {
        queries: {
            retry: false
        },
        mutations: {
            retry: false
        }
    }
}

/**
 * A HoC for adding React Query support to your application.
 *
 * @param {React.ReactElement} Wrapped The component to be wrapped
 * @param {Object} options
 * @param {Object} options.queryClientConfig The react query client configuration object to be used. By
 * default the `retry` option will be set to false to ensure performant server rendering.
 *
 * @returns {React.ReactElement}
 */
export const withReactQuery = (Wrapped, options = {}) => {
    const isServerSide = typeof window === 'undefined'
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name
    const queryClientConfig = options.queryClientConfig || SAFE_QUERY_CLIENT_CONFIG

    /**
     * @private
     */
    class WithReactQuery extends FetchStrategy {
        render() {
            this.props.locals.__queryClient =
                this.props.locals.__queryClient || new QueryClient(queryClientConfig)

            return (
                <QueryClientProvider client={this.props.locals.__queryClient}>
                    <Hydrate state={isServerSide ? {} : window.__PRELOADED_STATE__?.[STATE_KEY]}>
                        <Wrapped {...this.props} />
                    </Hydrate>
                </QueryClientProvider>
            )
        }

        /**
         * @private
         */
        static async doInitAppState({res, appJSX}) {
            const queryClient = (res.locals.__queryClient =
                res.locals.__queryClient || new QueryClient(queryClientConfig))

            // Without the request object, our useServerContext hook would be able tell whether on prepass
            const withoutReq = React.cloneElement(appJSX, {
                req: undefined
            })
            await ssrPrepass(withoutReq)

            const queryCache = queryClient.getQueryCache()
            const queries = queryCache.getAll().filter((q) => q.options.enabled !== false)
            await Promise.all(
                queries.map((q) =>
                    // If there's an error in this fetch, react-query will log the error
                    q.fetch().catch(() => {
                        // On our end, simply catch any error and move on to the next query
                    })
                )
            )

            return {[STATE_KEY]: dehydrate(queryClient)}
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
