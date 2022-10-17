/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import ssrPrepass from 'react-ssr-prepass'
import {
    dehydrate,
    Hydrate,
    QueryClient,
    QueryClientProvider,
    useQueryClient
} from '@tanstack/react-query'
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

const isServerSide = typeof window === 'undefined'

/**
 * A HoC for adding React Query support to your application.
 *
 * @param {React.ReactElement} Wrapped The component to be wrapped
 * @returns {React.ReactElement}
 */
export const withReactQuery = (Wrapped) => {
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name

    // @TODO: allow user to configure react query
    const queryClientConfig = SAFE_QUERY_CLIENT_CONFIG

    /**
     * @private
     */
    class WithReactQuery extends FetchStrategy {
        render() {
            this.props.locals.__queryClient =
                this.props.locals.__queryClient || new QueryClient(queryClientConfig)

            const optionsForSSRAndHydration = {
                ...queryClientConfig.defaultOptions,
                queries: {
                    ...queryClientConfig.defaultOptions?.queries,
                    // Stop queries during hydration because they've run already on server side
                    ...(!isServerSide ? {refetchOnMount: false} : {}),
                    // On server side, make sure query with error does not attempt to fetch again on mount
                    // NOTE: `retryOnMount` and `retry` options are different. They seem to work independently.
                    ...(isServerSide ? {retryOnMount: false} : {})
                }
            }
            this.props.locals.__queryClient.setDefaultOptions(optionsForSSRAndHydration)

            return (
                <QueryClientProvider client={this.props.locals.__queryClient}>
                    <Hydrate state={isServerSide ? {} : window.__PRELOADED_STATE__?.[STATE_KEY]}>
                        <Wrapped {...this.props} />
                    </Hydrate>
                    <ResetDefaultOptionsAfterHydration
                        defaultOptions={queryClientConfig.defaultOptions}
                    />
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

const ResetDefaultOptionsAfterHydration = ({defaultOptions}) => {
    if (isServerSide) {
        return null
    }

    const queryClient = useQueryClient()
    useEffect(() => {
        queryClient.setDefaultOptions(defaultOptions)
    }, [])

    return null
}
