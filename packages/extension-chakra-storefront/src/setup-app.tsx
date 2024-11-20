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

class ChakraStorefront extends ApplicationExtension<Config> {
    static id = `@salesforce/extension-chakra-storefront`

    extendApp<T>(App: React.ComponentType<T>): React.ComponentType<T> {
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
                path: '/',
                component: Pages.Home,
                exact: true
            },
            {
                path: '/login',
                component: Pages.Login,
                exact: true
            },
            {
                path: '/registration',
                component: Pages.Registration,
                exact: true
            },
            {
                path: '/reset-password',
                component: Pages.ResetPassword,
                exact: true
            },
            {
                path: '/account',
                component: Pages.Account
            },
            {
                path: '/checkout',
                component: Pages.Checkout,
                exact: true
            },
            {
                path: '/checkout/confirmation/:orderNo',
                component: Pages.CheckoutConfirmation
            },
            {
                path: '/callback',
                component: Pages.LoginRedirect,
                exact: true
            },
            {
                path: '/cart',
                component: Pages.Cart,
                exact: true
            },
            {
                path: '/product/:productId',
                component: Pages.ProductDetail
            },
            {
                path: '/search',
                component: Pages.ProductList
            },
            {
                path: '/category/:categoryId',
                component: Pages.ProductList
            },
            {
                path: '/account/wishlist',
                component: Pages.Wishlist
            }
        ].filter(({component}) => {
            return (config.pages || [])[component.displayName] !== false
        })

        return [...routes, ...extensionRoutes]
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
