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
import {
    BeforeRouteMatchParams,
    GetRoutesParams
} from '@salesforce/pwa-kit-extension-sdk/types'

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
import extensionMeta from '../extension-meta.json'

// Pages
import * as Pages from './pages'

// Components
import Breadcrumb from './components/breadcrumb'

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

    getRoutes(params: GetRoutesParams): RouteProps[] {
        const config = this.getConfig()

        const extensionRoutes = [
            {
                path: config.pages.Home && config.pages.Home.path,
                component: Pages.Home,
                exact: true
            },
            {
                path: '/breadcrumb-test',
                component: () => {
                    const fullCategoryPath = [
                        {
                            id: 'root',
                            name: 'Home'
                        },
                        {
                            id: 'womens',
                            name: "Women's"
                        },
                        {
                            id: 'clothing',
                            name: 'Clothing'
                        },
                        {
                            id: 'dresses',
                            name: 'Dresses'
                        }
                    ]

                    const shortPath = [
                        {
                            id: 'root',
                            name: 'Home'
                        },
                        {
                            id: 'mens',
                            name: "Men's"
                        }
                    ]

                    const singleItem = [
                        {
                            id: 'root',
                            name: 'Home'
                        }
                    ]

                    return (
                        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
                            <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Breadcrumb Component Examples</h1>
                            
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Full Category Path</h2>
                                <Breadcrumb categories={fullCategoryPath} />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Short Path</h2>
                                <Breadcrumb categories={shortPath} />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Single Item</h2>
                                <Breadcrumb categories={singleItem} />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Empty State</h2>
                                <Breadcrumb categories={[]} />
                            </div>
                        </div>
                    )
                },
                exact: true
            }
            // {
            //     path: [
            //         config.pages.Login && config.pages.Login.path,
            //         config.login.passwordless.enabled && config.login.passwordless.landingPath
            //     ].filter(Boolean),
            //     component: Pages.Login,
            //     exact: true
            // },
            // {
            //     path: config.pages.Registration && config.pages.Registration.path,
            //     component: Pages.Registration,
            //     exact: true
            // },
            // {
            //     path: [
            //         config.pages.ResetPassword && config.pages.ResetPassword.path,
            //         config.login.resetPassword && config.login.resetPassword.landingPath
            //     ].filter(Boolean),
            //     component: Pages.ResetPassword,
            //     exact: true
            // },
            // {
            //     path: config.pages.Account && config.pages.Account.path,
            //     component: Pages.Account
            // },
            // {
            //     path: config.pages.Checkout && config.pages.Checkout.path,
            //     component: Pages.Checkout,
            //     exact: true
            // },
            // {
            //     path: config.pages.CheckoutConfirmation && config.pages.CheckoutConfirmation.path,
            //     component: Pages.CheckoutConfirmation
            // },
            // {
            //     path: config.pages.LoginRedirect && config.pages.LoginRedirect.path,
            //     component: Pages.LoginRedirect,
            //     exact: true
            // },
            // {
            //     path: config.login.social.enabled && config.login.social.redirectURI,
            //     component: Pages.SocialLoginRedirect,
            //     exact: true
            // },
            // {
            //     path: config.pages.Cart && config.pages.Cart.path,
            //     component: Pages.Cart,
            //     exact: true
            // },
            // {
            //     path: config.pages.ProductDetail && config.pages.ProductDetail.path,
            //     component: Pages.ProductDetail
            // },
            // {
            //     path: config.pages.ProductList && config.pages.ProductList.path,
            //     component: Pages.ProductList
            // }
        ].filter((route) => route.path !== false)

        return extensionRoutes as RouteProps[]
    }

    // Called before the route with all the routes
    beforeRouteMatch({allRoutes}: BeforeRouteMatchParams): RouteProps[] {
        const config = this.getConfig()

        return configureRoutes(allRoutes, config, {
            ignoredRoutes: ['/callback']
        })
    }
}

export default ChakraStorefront
