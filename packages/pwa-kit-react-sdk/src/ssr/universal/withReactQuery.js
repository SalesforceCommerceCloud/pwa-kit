/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import hoistNonReactStatic from 'hoist-non-react-statics'
import {FetchStrategy} from './fetchStrategy'
import React from 'react'
import {dehydrate, Hydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import ssrPrepass from 'react-ssr-prepass'

const isServerSide = typeof window === 'undefined'
const STATE_KEY = '__reactQuery'

export const withReactQuery = (Wrapped) => {
    const wrappedComponentName = Wrapped.displayName || Wrapped.name

    class WithReactQuery extends FetchStrategy {
        constructor(props) {
            super(props)

            // Not crazy about this, but it's *super* important that
            // we avoid making queryClient global – it can't be shared
            // between requests.
            if (!isServerSide && !this.props.locals.__queryClient) {
                this.props.locals.__queryClient = new QueryClient()
            }
        }

        render() {
            return (
                <QueryClientProvider client={this.props.locals.__queryClient}>
                    <Hydrate state={isServerSide ? {} : window.__PRELOADED_STATE__?.[STATE_KEY]}>
                        <Wrapped {...this.props} />
                    </Hydrate>
                </QueryClientProvider>
            )
        }

        static async doInitAppState({res, appJSX}) {
            const queryClient = (res.locals.__queryClient = new QueryClient())

            await ssrPrepass(appJSX)

            const queryCache = queryClient.getQueryCache()
            const queries = queryCache.getAll().filter((q) => q.options.enabled !== false)
            await Promise.all(queries.map((q) => q.fetch()))

            return {[STATE_KEY]: dehydrate(queryClient)}
        }

        static getInitializers() {
            return [WithReactQuery.doInitAppState, ...(Wrapped.getInitializers?.() ?? [])]
        }
    }

    WithReactQuery.displayName = `withReactQuery(${wrappedComponentName})`

    const exclude = {doInitAppState: true, getInitializers: true, initAppState: true}
    hoistNonReactStatic(WithReactQuery, Wrapped, exclude)

    return WithReactQuery
}
