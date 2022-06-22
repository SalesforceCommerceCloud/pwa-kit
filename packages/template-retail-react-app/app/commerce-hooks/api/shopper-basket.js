/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from 'pwa-kit-runtime/utils/ssr-config.client'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {ShopperBaskets} from 'commerce-sdk-isomorphic'

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

    // use slas hook
    const access_token = useShopper()

    const shopperBaskets = new ShopperBaskets({
        ...commerceConfig,
        headers: {authorization: `Bearer ${access_token}`}
    })

    return shopperBaskets
}
