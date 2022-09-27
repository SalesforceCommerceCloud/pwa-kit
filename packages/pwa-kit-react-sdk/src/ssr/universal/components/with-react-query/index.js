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
import * as Warnings from '../../../../utils/warnings'

const STATE_KEY = '__reactQuery'
export const SERVER_RETRY_WARNING =
    'Use of the "retry" option may lead to degraded performance on the server.'

export const withReactQuery = (Wrapped, options = {}) => {
    const isServerSide = typeof window === 'undefined'
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name
    const queryClientConfig = options.queryClientConfig || {}
    const {retry: queriesRetry} = queryClientConfig?.defaultOptions?.queries || {}
    const {retry: mutationsRetry} = queryClientConfig?.defaultOptions?.mutations || {}

    if (
        isServerSide &&
        (queriesRetry === undefined ||
            !!queriesRetry ||
            mutationsRetry === undefined ||
            !!mutationsRetry)
    ) {
        Warnings.general(SERVER_RETRY_WARNING)
    }

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

            await ssrPrepass(appJSX)

            const queryCache = queryClient.getQueryCache()
            const queries = queryCache.getAll().filter((q) => q.options.enabled !== false)
            await Promise.all(queries.map((q) => q.fetch()))

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
