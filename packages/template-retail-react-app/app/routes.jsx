/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* istanbul ignore file */
// NOTE!
// This file is being ignored in the test coverage report for now. It reports `0%` functions
// tested, which brings down the overall coverage and blocks CI. There are tests still, but
// we don't want it to count toward coverage until we figure out how to cover the `functions`
// metric for this file in its test.

import React, {useEffect} from 'react'
import loadable from '@loadable/component'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {withRouter} from 'react-router-dom'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Components
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'

// Constants
import {
    PASSWORDLESS_LOGIN_LANDING_PATH,
    RESET_PASSWORD_LANDING_PATH
} from '@salesforce/retail-react-app/app/constants'

const fallback = <Skeleton height="75vh" width="100%" />
const socialRedirectURI = getConfig()?.app?.login?.social?.redirectURI

// Pages
const Home = loadable(() => import('./pages/home'), {fallback})
const Login = loadable(() => import('./pages/login'), {fallback})
const Registration = loadable(() => import('./pages/registration'), {
    fallback
})
const ResetPassword = loadable(() => import('./pages/reset-password'), {fallback})
const Account = loadable(() => import('./pages/account'), {fallback})
const Cart = loadable(() => import('./pages/cart'), {fallback})
const Checkout = loadable(() => import('./pages/checkout'), {
    fallback
})
const CheckoutConfirmation = loadable(() => import('./pages/checkout/confirmation'), {fallback})
const SocialLoginRedirect = loadable(() => import('./pages/social-login-redirect'), {fallback})
const LoginRedirect = loadable(() => import('./pages/login-redirect'), {fallback})
const ProductDetail = loadable(() => import('./pages/product-detail'), {fallback})
const ProductList = loadable(() => import('./pages/product-list'), {
    fallback
})
const StoreLocator = loadable(() => import('./pages/store-locator'), {
    fallback
})
const Wishlist = loadable(() => import('./pages/account/wishlist'), {
    fallback
})
const PageNotFound = loadable(() => import('./pages/page-not-found'))

// NOTE: If you add/remove routes here, it is a good practice to update the pwaKitRoutes list in default.js.
// The default.js pwaKitRoutes list is the source of truth in case hybridProxy is enabled.
export const routes = [
    {
        path: '/',
        component: Home,
        exact: true
    },
    {
        path: '/login',
        component: Login,
        exact: true
    },
    {
        path: '/registration',
        component: Registration,
        exact: true
    },
    {
        path: '/reset-password',
        component: ResetPassword,
        exact: true
    },
    {
        path: RESET_PASSWORD_LANDING_PATH,
        component: ResetPassword,
        exact: true
    },
    {
        path: PASSWORDLESS_LOGIN_LANDING_PATH,
        component: Login,
        exact: true
    },
    {
        path: '/account',
        component: Account
    },
    {
        path: '/checkout',
        component: Checkout,
        exact: true
    },
    {
        path: '/checkout/confirmation/:orderNo',
        component: CheckoutConfirmation
    },
    {
        path: '/callback',
        component: LoginRedirect,
        exact: true
    },
    {
        path: socialRedirectURI || '/social-callback',
        component: SocialLoginRedirect,
        exact: true
    },
    {
        path: '/cart',
        component: Cart,
        exact: true
    },
    {
        path: '/product/:productId',
        component: ProductDetail
    },
    {
        path: '/search',
        component: ProductList
    },
    {
        path: '/category/:categoryId',
        component: ProductList
    },
    {
        path: '/account/wishlist',
        component: Wishlist
    },
    {
        path: '/store-locator',
        component: StoreLocator
    },
    {
        path: '*',
        component: PageNotFound
    }
]

export default () => {
    const config = getConfig()
    let routesToConfigure = routes

    if (config.hybrid?.enableHybrid) {
        const pwaKitRoutes = config.hybrid?.pwaKitRoutes || []

        // Filter to only PWA-owned routes + add catch-all redirect to SFRA
        const hybridRoutes = [
            ...routes.filter((route) => pwaKitRoutes.includes(route.path)),
            {
                path: '*',
                component: withRouter((props) => {
                    const {location} = props
                    const urlParams = new URLSearchParams(location.search)
                    const {site} = useMultiSite()
                    const siteId = site?.id || config?.app?.defaultSite

                    if (typeof window !== 'undefined') {
                        useEffect(() => {
                            if (!urlParams.has('redirected')) {
                                const newURL = new URL(window.location)
                                newURL.searchParams.append('redirected', '1')
                                // Rewrite to SFRA format: /s/{siteId}/{locale}/{rest}
                                newURL.pathname = `/s/${siteId}/${window.location.pathname
                                    .split('/')
                                    .slice(2)
                                    .join('/')}`
                                window.location.replace(newURL)
                            }
                        }, [window.location.href])
                    }

                    // If already redirected once and still here, show 404
                    if (urlParams.has('redirected')) {
                        return <PageNotFound {...props} />
                    }
                    return null
                })
            }
        ]

        routesToConfigure = hybridRoutes
    }

    return configureRoutes(routesToConfigure, config, {
        ignoredRoutes: ['/callback', '*']
    })
}
