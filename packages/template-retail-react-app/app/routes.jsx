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
import {Redirect} from 'react-router-dom'
import loadable from '@loadable/component'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {transformUrlMappingToRoute} from '@salesforce/retail-react-app/app/utils/routes-utils'

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
export const ProductDetail = loadable(() => import('./pages/product-detail'), {fallback})
export const ProductList = loadable(() => import('./pages/product-list'), {
    fallback
})
const StoreLocator = loadable(() => import('./pages/store-locator'), {
    fallback
})
const Wishlist = loadable(() => import('./pages/account/wishlist'), {
    fallback
})
const PageNotFound = loadable(() => import('./pages/page-not-found'))

// Set the display names
// Home.displayName = 'Home'
// Cart.displayName = 'Cart'
// ProductDetail.displayName = 'ProductDetail'
// ProductList.displayName = 'ProductList'
// PageNotFound.displayName = 'PageNotFound'

const isServerSide = typeof window === 'undefined'

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

const componentNameMap = {
    'Home': Home,
    'Cart': Cart,
    'ProductDetail': ProductDetail,
    'ProductList': ProductList,
    'PageNotFound': PageNotFound
}

const resourceableComponentsMap = {
    category: ProductList,
    product: ProductDetail
}

export default async (locals) => {
    const config = getConfig()
    let configuredRoutes = []

    const seoUrlMappingEnabled = true

    console.log('isClient', !isServerSide)
    if (!isServerSide) {
        // CLIENT!

        // Router Deserialization
        let _routes = window.__CONFIG__.app.routes
        console.log('_routes', _routes)
        configuredRoutes = await Promise.all(_routes.map(async ({path}) => {
            // DEVELOPER NOTE: We previously tried to dynamically load the component using the path to map to the
            // filename and use import, but I couldn't get that to work. So here we are using the original routes
            // array to find the component for a given path from the serialized route config. It doesn't completely
            // work as it will remove the configured routes as they don't match the path. This should be done in
            // another way.
            let component = componentNameMap[componentName]
            if (!component) {
                return
            }

            if (componentProps) {
                const ComponentClass = componentNameMap[componentName]

                component = () => <ComponentClass {...componentProps} />
            }
            return {
                path,
                exact: true,
                component
            }
        }))
        configuredRoutes = configuredRoutes.filter((route => !!route))
        configuredRoutes = configureRoutes(configuredRoutes, config, {
            ignoredRoutes: ['/callback', '*']
        })
    } else {
        // SERVER!
        configuredRoutes = configureRoutes(routes, config, {
            ignoredRoutes: ['/callback', '*']
        })

        if (seoUrlMappingEnabled) {
            // DEVELOPER NOTES: Replace with actual getUrlMapping call
            // For now we Mock resourceType category
            const mapping = {
                "copySourceParams": false,
                "destinationUrl": "/s/RefArch/search?lang=en_US&cgid=newarrivals",
                "resourceId": "newarrivals",
                "resourceType": "category",
                "statusCode": "301"
            }
            if (mapping) {
                const path = '/category/top-seller'
                const route = transformUrlMappingToRoute(path, mapping, resourceableComponentsMap)

                configuredRoutes = [
                    ...configureRoutes([route], config, {
                        ignoredRoutes: []
                    }),
                    ...configuredRoutes
                ]
            }
        }
    }

    console.log('configuredRoutes: ', configuredRoutes)
    return configuredRoutes
}
