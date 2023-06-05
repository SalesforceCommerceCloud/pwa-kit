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

// Components
import {Skeleton} from '@chakra-ui/react'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'

const fallback = <Skeleton height="75vh" width="100%" />

// Pages
const Home = loadable(() => import('@salesforce/retail-react-app/app/pages/home'), {fallback})
const Login = loadable(() => import('@salesforce/retail-react-app/app/pages/login'), {fallback})
const Registration = loadable(() => import('@salesforce/retail-react-app/app/pages/registration'), {
    fallback
})
const ResetPassword = loadable(
    () => import('@salesforce/retail-react-app/app/pages/reset-password'),
    {fallback}
)
const Account = loadable(() => import('@salesforce/retail-react-app/app/pages/account'), {fallback})
const Cart = loadable(() => import('@salesforce/retail-react-app/app/pages/cart'), {fallback})
const Checkout = loadable(() => import('@salesforce/retail-react-app/app/pages/checkout'), {
    fallback
})
const CheckoutConfirmation = loadable(
    () => import('@salesforce/retail-react-app/app/pages/checkout/confirmation'),
    {fallback}
)
const LoginRedirect = loadable(
    () => import('@salesforce/retail-react-app/app/pages/login-redirect'),
    {fallback}
)
const ProductDetail = loadable(
    () => import('@salesforce/retail-react-app/app/pages/product-detail'),
    {fallback}
)
const ProductList = loadable(() => import('@salesforce/retail-react-app/app/pages/product-list'), {
    fallback
})
const Wishlist = loadable(() => import('@salesforce/retail-react-app/app/pages/account/wishlist'), {
    fallback
})
const PageNotFound = loadable(() => import('@salesforce/retail-react-app/app/pages/page-not-found'))

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
        path: '*',
        component: PageNotFound
    }
]

export default () => {
    const config = getConfig()
    return configureRoutes(routes, config, {
        ignoredRoutes: ['/callback', '*']
    })
}
