/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import hoistNonReactStatic from 'hoist-non-react-statics'
import {FetchStrategy} from '../fetch-strategy'
import React from 'react'
import {dehydrate, Hydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import ssrPrepass from 'react-ssr-prepass'

const isServerSide = typeof window === 'undefined'
const STATE_KEY = '__reactQuery'

export const withReactQuery = (Wrapped) => {
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name

    /**
     * @private
     */
    class WithReactQuery extends FetchStrategy {
        render() {
            this.props.locals.__queryClient = this.props.locals.__queryClient || new QueryClient()
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
                res.locals.__queryClient || new QueryClient())

            await ssrPrepass(appJSX)

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
