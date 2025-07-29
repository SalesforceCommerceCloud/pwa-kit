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
import {configureRoutes} from '../src/utils/routes-utils'

const fallback = <Skeleton height="75vh" width="100%" />
// Pages
const Account = loadable(() => import('../src/pages/account'), {fallback})
const Cart = loadable(() => import('../src/pages/cart'), {fallback})
const Checkout = loadable(() => import('../src/pages/checkout'), {
    fallback
})
const CheckoutConfirmation = loadable(() => import('../src/pages/checkout/confirmation'), {
    fallback
})

const LoginRedirect = loadable(() => import('../src/pages/login-redirect'), {fallback})
const Login = loadable(() => import('../src/pages/login'), {fallback})
const Home = loadable(() => import('../src/pages/home'), {fallback})
const Registration = loadable(() => import('../src/pages/registration'), {
    fallback
})
const ResetPassword = loadable(() => import('../src/pages/reset-password'), {fallback})
const ProductDetail = loadable(() => import('../src/pages/product-detail'), {fallback})
const ProductList = loadable(() => import('../src/pages/product-list'), {
    fallback
})
const StoreLocator =
    SFDC_EXT_STORE_LOCATOR &&
    loadable(() => import('../src/pages/store-locator'), {
        fallback
    })
//@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
const SocialLoginRedirect = loadable(() => import('../src/pages/social-login-redirect'), {fallback})

// @sfdc-extension-line SFDC_EXT_WISHLIST
const Wishlist = loadable(() => import('../src/pages/account/wishlist'), {fallback})
const PageNotFound = loadable(() => import('../src/pages/page-not-found'))

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
        path: '/reset-password-landing',
        component: ResetPassword,
        exact: true
    },
    {
        path: '/passwordless-login-landing',
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
    //@sfdc-extension-block-start SFDC_EXT_SOCIAL_LOGIN
    {
        path: '/social-callback',
        component: SocialLoginRedirect,
        exact: true
    },
    //@sfdc-extension-block-end SFDC_EXT_SOCIAL_LOGIN
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
    // @sfdc-extension-block-start SFDC_EXT_WISHLIST
    {
        path: '/account/wishlist',
        component: Wishlist
    }
    // @sfdc-extension-block-end SFDC_EXT_WISHLIST
]

SFDC_EXT_STORE_LOCATOR &&
    routes.push({
        path: '/store-locator',
        component: StoreLocator
    })

routes.push({
    path: '*',
    component: PageNotFound
})

export default () => {
    const config = getConfig()
    return configureRoutes(routes, config, {
        ignoredRoutes: ['/callback', '*']
    })
}
