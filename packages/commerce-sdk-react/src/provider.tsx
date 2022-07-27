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
const token = ''
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
    return <CommerceApiContext.Provider value={apiClients}>{children}</CommerceApiContext.Provider>
}

export default CommerceApiProvider
