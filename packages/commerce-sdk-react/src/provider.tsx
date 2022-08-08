/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, ReactElement, useEffect} from 'react'
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
    helpers
} from 'commerce-sdk-isomorphic'
import {QueryClientProvider, QueryClient} from '@tanstack/react-query'
import {ApiClientConfigParams, ApiClients} from './hooks/types'
const queryClient = new QueryClient()

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

interface configType {
    proxy: string
    headers: {
        authorization?: string
    }
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
const localhost = 'http://localhost:3000'
// Input your token here to for the apiClients to work
// this is a temporary solution to implement hooks while waiting for slas hook
const token =
    'eyJ2ZXIiOiIxLjAiLCJraWQiOiI2ZWQ2M2RmZC1iOTQzLTQ1ZjctOWMzNC01MjEyMDkwZGNjNmQiLCJ0eXAiOiJqd3QiLCJjbHYiOiJKMi4zLjQiLCJhbGciOiJFUzI1NiJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjBhMWE0ODU0LWJjOTMtNGE4ZS1hYmNjLWRmNWNkMTExNmM0MCIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY1OTk4MTc0OSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86c2xhczo6dXBuOkd1ZXN0Ojp1aWRuOkd1ZXN0IFVzZXI6OmdjaWQ6YWJrZWNWd3JvMmxyb1J3S2sza1dZWXdyRkoiLCJleHAiOjE2NTk5ODM1NzksImlhdCI6MTY1OTk4MTc3OSwianRpIjoiQzJDNDg1NjIwMTg2MC0xODkwNjc4OTAzMTc5NTY4MzAwNDM0NTg2MTEifQ.GJAv3imasgB0Wd4dCdJW9FULg7xbPQMSAl_vLas7PtFmJOW4gUCR0SLXrcAzWhFjbBlzLxgMZ3vyxkI364Q4fw'
const CommerceApiProvider = (props: CommerceApiProviderProps): ReactElement => {
    const {children, clientId, organizationId, shortCode, siteId} = props

    const defaultConfig: configType = {
        proxy: `${localhost}${props.proxy}`,
        headers: {
            // mock a token to use
            authorization: `Bearer ${token}`
        },
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId
        },
        throwOnBadResponse: true
    }
    const [config, setConfig] = useState(defaultConfig)

    //NOTE: this logic is for temporary use to grab the access token
    // token handling session should be provided by SLAS hook which is still in implementation
    useEffect(() => {
        const origin = 'http://localhost:3000'
        // only for temporary use until slas hook is ready
        const setupToken = async (config: configType) => {
            if (typeof window !== 'undefined') {
                const shopperLogin = new ShopperLogin(config)

                const access_token = window.localStorage.getItem('token')
                const refresh_token = window.localStorage.getItem('refresh_token')
                console.log('access_token', access_token)
                console.log('refresh_token', refresh_token)
                if (access_token) {
                    // const data = new URLSearchParams()
                    // data.append('grant_type', 'refresh_token')
                    // data.append('refresh_token', refresh_token)
                    // data.append('client_id', clientId)
                    //
                    // const options = {
                    //     headers: {
                    //         'Content-Type': `application/x-www-form-urlencoded`
                    //     },
                    //     body: data
                    // }
                    // this code here is not important and will be deleted, do not need to care about typescript error
                    // @ts-ignore
                    // const res = await shopperLogin.getAccessToken(options)
                    // console.log('res', res)
                    // window.localStorage.setItem('token', res.access_token)
                    // window.localStorage.setItem('refresh_token', res.refresh_token)
                    return access_token
                } else {
                    console.log('shopperLogin>>>>>>>>>>>>>>>>>>>>>>>')
                    const {access_token, refresh_token, ...rest} = await helpers.loginGuestUser(
                        shopperLogin,
                        {redirectURI: `${origin}/callback`} // Callback URL must be configured in SLAS Admin
                    )
                    console.log('access_token', access_token)
                    setConfig({
                        ...config,
                        headers: {
                            authorization: `Bearer ${access_token}`
                        }
                    })
                    console.log('refresh_token', refresh_token)
                    console.log('...rest', rest)
                    window.localStorage.setItem('token', access_token)
                    window.localStorage.setItem('refresh_token', refresh_token)
                }
            }
        }
        setupToken(config)
    }, [])

    // // TODO: Initialize the api clients immediately, without waiting for an access token.
    // // See template-retail-react-app/app/commerce-api/index.js for inspiration
    // // especially how Proxy class can be used to wait for the access token and inject it to each request header.
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
    return (
        <QueryClientProvider client={queryClient}>
            <CommerceApiContext.Provider value={apiClients}>{children}</CommerceApiContext.Provider>
        </QueryClientProvider>
    )
}

export default CommerceApiProvider
