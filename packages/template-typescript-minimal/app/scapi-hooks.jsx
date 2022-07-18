/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {createServerEffectContext} from 'pwa-kit-react-sdk/ssr/universal/hooks/use-server-effect'

const CONTEXT_KEY = '__COMMERCE_SDK_REACT__'
// NOTE: This is the important part of the API, here we get a context with a hook that will
// use that context.
const {ServerEffectProvider, useServerEffect} = createServerEffectContext(CONTEXT_KEY)

const SCAPIContext = React.createContext()

export const SCAPIProvider = (props) => {
    // Only set the provider value on the client. On the server the context will already have
    // it's values set.
    const serverEffectProviderValues =
        typeof window === 'undefined'
            ? {}
            : {
                  value: window.__PRELOADED_STATE__[CONTEXT_KEY]
              }

    return (
        <SCAPIContext.Provider value={{}}>
            <ServerEffectProvider {...serverEffectProviderValues}>
                {props.children}
            </ServerEffectProvider>
        </SCAPIContext.Provider>
    )
}

SCAPIProvider.propTypes = {
    children: PropTypes.node
}

export const useProduct = (id, source) => {
    const {data, isLoading, error} = useServerEffect(async () => {
        await sleep(1000)

        return {
            id: 1,
            name: 'Polka Dot Pants'
        }
    }, source)

    return {
        isLoading,
        error,
        product: data
    }
}

export const useProducts = (ids, source) => {
    const {data, isLoading, error} = useServerEffect(async () => {
        await sleep(1000)

        return ids
            ? [
                  {
                      id: 1,
                      name: 'Polka Dot Pants'
                  },
                  {
                      id: 2,
                      name: 'Polka Dot Shorts'
                  },
                  {
                      id: 3,
                      name: 'Polka Dot Leggings'
                  }
              ]
            : []
    }, source)

    return {
        isLoading,
        error,
        products: data
    }
}

export const useProductSearch = (productSearchParams, source) => {
    const {data, isLoading, error} = useServerEffect(async () => {
        // Emulate netword delay
        await sleep(1000)

        return {
            q: 'cgid=blue',
            count: 3,
            total: 10,
            hits: [
                {
                    productId: 1,
                    productName: 'Polka Dot Pants'
                },
                {
                    productId: 2,
                    productName: 'Polka Dot Shorts'
                },
                {
                    productId: 3,
                    productName: 'Polka Dot Legging'
                }
            ]
        }
    }, source)

    return {
        isLoading,
        error,
        productSearchResult: data
    }
}
// PRIVATE
// const getValues = () => (effectsValues)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
