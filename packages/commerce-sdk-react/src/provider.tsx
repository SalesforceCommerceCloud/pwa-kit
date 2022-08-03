/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
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
    ShopperSearch
} from 'commerce-sdk-isomorphic'

import {ApiClientConfigParams, ApiClients} from './hooks/types'

export interface CommerceApiProviderProps extends ApiClientConfigParams {
    children: React.ReactNode
    proxy: string
    locale: string
    currency: string
}

/**
 * @internal
 */
export const CommerceApiContext = React.createContext({} as ApiClients)

/**
 * Initialize a set of Commerce API clients and make it available to all of descendant components
 *
 * @param props
 * @returns Provider to wrap your app with
 */
const CommerceApiProvider = (props: CommerceApiProviderProps): ReactElement => {
    const {children, clientId, organizationId, shortCode, siteId, proxy} = props

    const config = {
        proxy,
        headers: {
            authorization:
                'Bearer eyJ2ZXIiOiIxLjAiLCJraWQiOiI2ZWQ2M2RmZC1iOTQzLTQ1ZjctOWMzNC01MjEyMDkwZGNjNmQiLCJ0eXAiOiJqd3QiLCJjbHYiOiJKMi4zLjQiLCJhbGciOiJFUzI1NiJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjVmYjM1OWY4LTc2NzUtNDM2Ni05ZGE1LTM4MWU1MDRlYjlkYSIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY1OTUwNjg5OCwic3R5IjoiVXNlciIsImlzYiI6InVpZG86c2xhczo6dXBuOkd1ZXN0Ojp1aWRuOkd1ZXN0IFVzZXI6OmdjaWQ6YWJsdXhHa1hzM3hIRVJsWHcxbHFZWWtYdzAiLCJleHAiOjE2NTk1MDg3MjgsImlhdCI6MTY1OTUwNjkyOCwianRpIjoiQzJDNDg1NjIwMTg2MC0xODkwNjc4OTAzNjE0MzY3NTIwNTY1NjYxMiJ9.jJ5s6_Cj5sqADMLiVMB9akPqpoYRJRim9AhWbmOlGfoyt5P3QTieSOWzuEQsQPNAx3VBUia-aFi0aOU8pcXvOQ'
        },
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId
        },
        throwOnBadResponse: true
    }

    // TODO: Initialize the api clients immediately, without waiting for an access token.
    // See template-retail-react-app/app/commerce-api/index.js for inspiration
    // especially how Proxy class can be used to wait for the access token and inject it to each request header.
    const apiClients: ApiClients = {
        shopperBaskets: new ShopperBaskets(config),
        shopperContexts: new ShopperContexts(config),
        shopperCustomers: new ShopperCustomers(config),
        shopperDiscoverySearch: new ShopperDiscoverySearch(config),
        shopperGiftCertificates: new ShopperGiftCertificates(config),
        shopperLogin: new ShopperLogin(config),
        shopperOrders: new ShopperOrders(config),
        shopperProducts: new ShopperProducts(config),
        shopperPromotions: new ShopperPromotions(config),
        shopperSearch: new ShopperSearch(config)
    }

    // TODO: wrap the children with:
    // - context for enabling useServerEffect hook
    // - context for sharing the auth object that would manage the tokens -> this will probably be for internal use only
    return <CommerceApiContext.Provider value={apiClients}>{children}</CommerceApiContext.Provider>
}

export default CommerceApiProvider
