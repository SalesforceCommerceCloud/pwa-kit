/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement, useEffect, useState} from 'react'
import {
    ShopperBaskets,
    ShopperContexts,
    ShopperCustomers,
    ShopperLogin,
    ShopperOrders,
    ShopperProducts,
    ShopperPromotions,
    ShopperDiscoverySearch,
    ShopperGiftCertificates,
    ShopperSearch,
} from 'commerce-sdk-isomorphic'
import Auth from './auth'
import {ApiClientConfigParams, ApiClients} from './hooks/types'

export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string
    locale: string
    currency: string
    redirectURI: string
}

/**
 * @internal
 */
export const CommerceApiContext = React.createContext({} as ApiClients)

// TODO: re-use ApiClientConfigParams
interface ApiClientConfigs {
    proxy: string
    headers: Record<string, string>
    parameters: {
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }
    throwOnBadResponse: boolean
}

/**
 * Initialize a set of Commerce API clients and make it available to all of descendant components
 *
 * @param props
 * @returns Provider to wrap your app with
 */
const CommerceApiProvider = (props: CommerceApiProviderProps): ReactElement => {
    const {children, clientId, organizationId, shortCode, siteId, proxy, redirectURI} = props
    const token =
        'eyJ2ZXIiOiIxLjAiLCJraWQiOiI2ZWQ2M2RmZC1iOTQzLTQ1ZjctOWMzNC01MjEyMDkwZGNjNmQiLCJ0eXAiOiJqd3QiLCJjbHYiOiJKMi4zLjQiLCJhbGciOiJFUzI1NiJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjFjNDgwZjBhLTE4NTgtNDVmNS1iOTI5LTg3MDkwZDZjMjU0OSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY1OTIyMTUwMiwic3R5IjoiVXNlciIsImlzYiI6InVpZG86c2xhczo6dXBuOkd1ZXN0Ojp1aWRuOkd1ZXN0IFVzZXI6OmdjaWQ6YWZrdWtZbWNhS2tlZFJrckVabWJZWWx1d1oiLCJleHAiOjE2NTkyMjMzMzIsImlhdCI6MTY1OTIyMTUzMiwianRpIjoiQzJDNDg1NjIwMTg2MC0xODkwNjc4OTAzMTcxOTYyNTA2MDM2NTc1NDMifQ.AgKVzuyrJFg7FVuTWvQ7IWGx8I4BlFVJsYNo28Ynl8L-78g_v81xLFsTWJGLU-fnU5nA1ndlMFvViGLQSkmc6Q'

    const config = {
        proxy,
        headers: {},
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId,
        },
        throwOnBadResponse: true,
    }

    const createApiClients = (configs: ApiClientConfigs): ApiClients => {
        const apiClasses = {
            shopperBaskets: ShopperBaskets,
            shopperContexts: ShopperContexts,
            shopperCustomers: ShopperCustomers,
            shopperDiscoverySearch: ShopperDiscoverySearch,
            shopperGiftCertificates: ShopperGiftCertificates,
            shopperLogin: ShopperLogin,
            shopperOrders: ShopperOrders,
            shopperProducts: ShopperProducts,
            shopperPromotions: ShopperPromotions,
            shopperSearch: ShopperSearch,
        }
        const apiClients = {
            shopperBaskets: new ShopperBaskets(configs),
            shopperContexts: new ShopperContexts(configs),
            shopperCustomers: new ShopperCustomers(configs),
            shopperDiscoverySearch: new ShopperDiscoverySearch(configs),
            shopperGiftCertificates: new ShopperGiftCertificates(configs),
            shopperLogin: new ShopperLogin(configs),
            shopperOrders: new ShopperOrders(configs),
            shopperProducts: new ShopperProducts(configs),
            shopperPromotions: new ShopperPromotions(configs),
            shopperSearch: new ShopperSearch(configs),
        }

        // const withAuth =
        //     (func: Function) =>
        //     (...args: any[]) => {
        //         console.log('withAuth')
        //         return func(args)
        //     }

        // const a = Object.keys(apiClasses).reduce((acc, curr) => {
        //     return {
        //         ...acc,
        //         // @ts-ignore
        //         [curr]: new Proxy(new apiClasses[curr](configs), {
        //             get: function (target, property) {
        //                 console.log(target)
        //                 console.log(property)
        //                 if (typeof target[property] === 'function') {
        //                     return 1
        //                 }
        //                 return 1
        //             },
        //         }),
        //     }
        // }, {})

        return apiClients
    }

    const [apiClients] = useState<ApiClients>(createApiClients(config))

    useEffect(() => {
        const init = async () => {
            const auth = new Auth({
                clientId,
                organizationId,
                shortCode,
                siteId,
                proxy,
                redirectURI,
            })

            const {access_token} = await auth.init()
        }

        init()
    }, [])

    // TODO: wrap the children with:
    // - context for enabling useServerEffect hook
    // - context for sharing the auth object that would manage the tokens -> this will probably be for internal use only
    return <CommerceApiContext.Provider value={apiClients}>{children}</CommerceApiContext.Provider>
}

export default CommerceApiProvider
