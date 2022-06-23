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
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

// Components
import {Skeleton} from '@chakra-ui/react'
import {configureRoutes} from './utils/routes-utils'

const fallback = <Skeleton height="75vh" width="100%" />

// Pages
import Home from './pages/home'
import Login from './pages/login'
import Registration from './pages/registration'
import ResetPassword from './pages/reset-password'
import Account from './pages/account'
import Cart from './pages/cart'
import Checkout from './pages/checkout'
import CheckoutConfirmation from './pages/checkout/confirmation'
import LoginRedirect from './pages/login-redirect'
import ProductDetail from './pages/product-detail'
import ProductList from './pages/product-list'
import Wishlist from './pages/account/wishlist'
import PageNotFound from './pages/page-not-found'
import AccountDetail from "./pages/account/profile";
import AccountOrders from "./pages/account/orders";
import AccountAddresses from "./pages/account/addresses";
import AccountPaymentMethods from "./pages/account/payments";
import AccountWishlist from "./pages/account/wishlist";


const routes = [
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
        path: '/account/wishlist',
        component: AccountWishlist
    },
    {
        path: '/account/payments',
        component: AccountPaymentMethods
    },
    {
        path: '/account/addresses',
        component: AccountAddresses
    },
    {
        path: '/account/orders',
        component: AccountOrders
    },
    {
        path: '/account',
        component: AccountDetail
    },
    {
        path: '/checkout',
        component: Checkout,
        exact: true
    },
    {
        path: '/checkout/confirmation',
        component: CheckoutConfirmation,
        exact: true
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
