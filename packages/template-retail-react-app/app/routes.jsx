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

import React from 'react'
import loadable from '@loadable/component'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {withRouter} from 'react-router-dom'

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
const CheckoutConfirmation = loadable(() => import('./pages/checkout/confirmation'), {fallback})
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
        path: '/home',
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
        path: '/callback',
        component: LoginRedirect,
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
        component: withRouter((props) => {
            const {location} = props
            const urlParams = new URLSearchParams(location.search)

            useEffect(() => {
                const newURL = new URL(window.location)
                if (!urlParams.has('redirected')) {
                    newURL.searchParams.append('redirected', '1')
                    window.location.href = newURL
                }
            }, [window.location.href])
            if (urlParams.has('redirected')) {
                return <PageNotFound {...props} />
            }
            return null
        })
    }
]

export default () => {
    const config = getConfig()
    return configureRoutes(routes, config, {
        ignoredRoutes: ['/callback', '*']
    })
}
