/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {ShopperBaskets, ShopperCustomers, ShopperProducts} from 'commerce-sdk-isomorphic'

const getCommerceApiConfig = () => {
    const {app} = getConfig()
    const commerceConfig = {
        ...app.commerceAPI,
        proxy: `${getAppOrigin()}${app.commerceAPI.proxyPath}`,
        einsteinConfig: app.einsteinAPI
    }

    return commerceConfig
}

export const basketShopperAPI = () => {
    const commerceConfig = getCommerceApiConfig()
    // set up api here

    let shopperBaskets

    // use slas hook
    // const access_token = useShopper()
    // TODO: this is not how real implementation works
    // It is expected we can call slas hook and get the access_token or refresh token
    if (typeof window !== 'undefined') {
        const access_token = window.localStorage.getItem('token')
        if (access_token) {
            shopperBaskets = new ShopperBaskets({
                ...commerceConfig,
                headers: {authorization: access_token}
            })
        }
    }

    return shopperBaskets
}

export const shopperCustomersAPI = () => {
    const commerceConfig = getCommerceApiConfig()
    let shopperCustomers
    // TODO: this is not how real implementation works
    // It is expected we can call slas hook and get the access_token or refresh token
    if (typeof window !== 'undefined') {
        const access_token = window.localStorage.getItem('token')
        if (access_token) {
            shopperCustomers = new ShopperCustomers({
                ...commerceConfig,
                headers: {authorization: access_token}
            })
        }
    }

    return shopperCustomers
}

export const shopperProductsAPI = () => {
    const commerceConfig = getCommerceApiConfig()
    let shopperProducts
    // TODO: this is not how real implementation works
    // It is expected we can call slas hook and get the access_token or refresh token
    if (typeof window !== 'undefined') {
        const access_token = window.localStorage.getItem('token')
        if (access_token) {
            shopperProducts = new ShopperProducts({
                ...commerceConfig,
                headers: {authorization: access_token}
            })
        }
    }

    return shopperProducts
}
