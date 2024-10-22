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
import {PERFORMANCE_MARKS} from '../../../../utils/performance'
import logger from '../../../../utils/logger-instance'

const STATE_KEY = '__reactQuery'
const passthrough = (input) => input

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
    const queryClientConfig = options.queryClientConfig
    const beforeHydrate = options.beforeHydrate || passthrough

    /**
     * @private
     */
    class WithReactQuery extends FetchStrategy {
        render() {
            let preloadedState = {}

            this.props.locals.__queryClient =
                this.props.locals.__queryClient || new QueryClient(queryClientConfig)

            if (!isServerSide) {
                try {
                    preloadedState = beforeHydrate(window.__PRELOADED_STATE__?.[STATE_KEY] || {})
                } catch (e) {
                    logger.error('Client `beforeHydrate` failed', {
                        namespace: 'with-react-query.render',
                        additionalProperties: {error: e}
                    })
                }
            }

            return (
                <QueryClientProvider client={this.props.locals.__queryClient}>
                    <Hydrate state={preloadedState}>
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

            res.__performanceTimer.mark(PERFORMANCE_MARKS.reactQueryPrerender, 'start')
            // Use `ssrPrepass` to collect all uses of `useQuery`.
            await ssrPrepass(appJSX)
            res.__performanceTimer.mark(PERFORMANCE_MARKS.reactQueryPrerender, 'end')
            const queryCache = queryClient.getQueryCache()
            const queries = queryCache.getAll().filter((q) => q.options.enabled !== false)
            await Promise.all(
                queries.map((q, i) => {
                    // always include the index to avoid duplicate entries
                    const displayName = q.meta?.displayName ? `${q.meta?.displayName}:${i}` : `${i}`
                    res.__performanceTimer.mark(
                        `${PERFORMANCE_MARKS.reactQueryUseQuery}::${displayName}`,
                        'start'
                    )
                    return q
                        .fetch()
                        .then((result) => {
                            res.__performanceTimer.mark(
                                `${PERFORMANCE_MARKS.reactQueryUseQuery}::${displayName}`,
                                'end',
                                {
                                    detail: q.queryHash
                                }
                            )
                            return result
                        })
                        .catch(() => {
                            // If there's an error in this fetch, react-query will log the error
                            // On our end, simply catch any error and move on to the next query
                        })
                })
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
