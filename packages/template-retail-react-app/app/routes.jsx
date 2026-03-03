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
import {withRouter} from 'react-router-dom'
import loadable from '@loadable/component'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Components
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'

const fallback = <Skeleton height="75vh" width="100%" />

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
const CheckoutOneClick = loadable(() => import('./pages/checkout-one-click'), {
    fallback
})
const CheckoutConfirmation = loadable(() => import('./pages/confirmation'), {fallback})
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
        path: '/account',
        component: Account
    },
    {
        path: '/checkout',
        component: (props) => {
            const enabled = getConfig()?.app?.oneClickCheckout?.enabled
            return enabled ? <CheckoutOneClick {...props} /> : <Checkout {...props} />
        },
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
    }
]

// Remove SFRA/SiteGenesis routes from PWA Kit
const ecomRoutes = ['/cart', '/checkout', '*']

export default () => {
    const config = getConfig()
    const enableHybrid = config?.app?.enableHybrid
    const loginConfig = config?.app?.login
    const resetPasswordLandingPath = loginConfig?.resetPassword?.landingPath
    const socialLoginEnabled = loginConfig?.social?.enabled
    const socialRedirectURI = loginConfig?.social?.redirectURI
    const passwordlessLoginEnabled = loginConfig?.passwordless?.enabled
    const passwordlessLoginLandingPath = loginConfig?.passwordless?.landingPath

    // Add dynamic routes conditionally (only if features are enabled and paths are defined)
    const dynamicRoutes = [
        resetPasswordLandingPath && {
            path: resetPasswordLandingPath,
            component: ResetPassword,
            exact: true
        },
        passwordlessLoginEnabled &&
            passwordlessLoginLandingPath && {
                path: passwordlessLoginLandingPath,
                component: Login,
                exact: true
            },
        socialLoginEnabled &&
            socialRedirectURI && {
                path: socialRedirectURI,
                component: SocialLoginRedirect,
                exact: true
            }
    ].filter(Boolean)

    const allBaseRoutes = [...routes, ...dynamicRoutes]

    const hybridRoutes = [
        ...allBaseRoutes.filter((route) => !ecomRoutes.includes(route.path)),
        {
            path: '*',
            component: withRouter((props) => {
                const {location} = props
                const urlParams = new URLSearchParams(location.search)
                const {site} = useMultiSite()
                const siteId = site && site.id ? site.id : config?.app?.defaultSite

                if (typeof window !== 'undefined') {
                    useEffect(() => {
                        const newURL = new URL(window.location)
                        if (!urlParams.has('redirected')) {
                            newURL.searchParams.append('redirected', '1')
                            newURL.pathname = `/s/${siteId}/${window.location.pathname
                                .split('/')
                                .slice(2)
                                .join('/')}`
                            window.location.replace(newURL)
                        }
                    }, [window.location.href])
                }

                if (urlParams.has('redirected')) {
                    return <PageNotFound {...props} />
                }

                return null
            })
        }
    ]

    // Only use these routes if we are in hybrid mode otherwise use defaults
    // This is driven via the config and env variables
    const routesToConfigure = enableHybrid ? hybridRoutes : allBaseRoutes

    return configureRoutes(routesToConfigure, config, {
        ignoredRoutes: ['/callback', '*']
    })
}
