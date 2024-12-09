/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'
import {RouteProps} from 'react-router-dom'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/react'
import {applyHOCs} from '@salesforce/pwa-kit-extension-sdk/react/utils'

// Local Imports
import {Config} from './types'
import {configureRoutes} from './utils/routes-utils'
import {withChakraUI} from './components/with-chakra-ui'
import {withCommerceSdkReact} from './components/with-commerce-sdk-react'
import {withCurrency} from './components/with-currency'
import {withLayout} from './components/with-layout'
import {withMultiSite} from './components/with-multi-site'
import {withReactIntl} from './components/with-react-intl'
import {withStorefrontPreview} from './components/with-storefront-preview'

// Pages
import * as Pages from './pages'

import extensionMeta from '../extension-meta.json'

class ChakraStorefront extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id

    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        // NOTE: The order of these HOCs is important!
        const requiredHOCs = [
            withLayout,
            withChakraUI,
            withCurrency,
            withReactIntl,
            withMultiSite,
            withStorefrontPreview,
            withCommerceSdkReact
        ]

        return applyHOCs(App, requiredHOCs)
    }

    extendRoutes(routes: RouteProps[]): RouteProps[] {
        const config = this.getConfig()

        const extensionRoutes = [
            {
                path: config.pages.Home,
                component: Pages.Home,
                exact: true
            },
            {
                path: config.pages.Login,
                component: Pages.Login,
                exact: true
            },
            {
                path: config.pages.Registration,
                component: Pages.Registration,
                exact: true
            },
            {
                path: config.pages.ResetPassword,
                component: Pages.ResetPassword,
                exact: true
            },
            {
                path: config.pages.Account,
                component: Pages.Account
            },
            {
                path: config.pages.Checkout,
                component: Pages.Checkout,
                exact: true
            },
            {
                path: config.pages.CheckoutConfirmation,
                component: Pages.CheckoutConfirmation
            },
            {
                path: config.pages.LoginRedirect,
                component: Pages.LoginRedirect,
                exact: true
            },
            {
                path: config.pages.Cart,
                component: Pages.Cart,
                exact: true
            },
            {
                path: config.pages.ProductDetail,
                component: Pages.ProductDetail
            },
            {
                path: config.pages.ProductList,
                component: Pages.ProductList
            }
        ].filter((route) => route.path !== false)

        return [...routes, ...(extensionRoutes as RouteProps[])]
    }

    // Called before the route with all the routes
    beforeRouteMatch(allRoutes: RouteProps[]): RouteProps[] {
        const config = this.getConfig()

        return configureRoutes(allRoutes, config, {
            ignoredRoutes: ['/callback']
        })
    }
}

export default ChakraStorefront
