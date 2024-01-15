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

// Components
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'

const fallback = <Skeleton height="75vh" width="100%" />

// Pages
// const Home = loadable(() => import('./pages/home'), {fallback})
// const ProductDetail = loadable(() => import('./pages/product-detail'), {fallback})
// const PageNotFound = loadable(() => import('./pages/page-not-found'))

// import Home from './pages/home'
// import ProductDetail from './pages/product-detail'
// import ProductList from './pages/product-list'

// import PageNotFound from './pages/page-not-found'

const Home = loadable(() => import('./pages/home'), {fallback})
const ProductDetail = loadable(() => import('./pages/product-detail'), {fallback})
const ProductList = loadable(() => import('./pages/product-list'), {
    fallback
})
const PageNotFound = loadable(() => import('./pages/page-not-found'))

const isServerSide = typeof window === 'undefined'

export const routes = [
    {
        path: '/',
        component: Home,
        exact: true
    },
    {
        path: '/product/:productId',
        component: ProductDetail
    },
    {
        path: '/category/:categoryId',
        component: ProductList
    },
    {
        path: '*',
        component: PageNotFound
    }
]

const componentNameMap = {
    'Home': Home,
    'ProductDetails': ProductDetail,
    'ProductList': ProductList,
    'PageNotFount': PageNotFound
}

const getUrlMapping = async (urlSegment) => {
    debugger
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // DEVELOPER NOTE: We probably need to account for the site and locale prefixes if there are any.
    const mappings = {
        "/stripped-silk-tie": {
            resourceId: '25752986M',
            resourceType: 'product'
        },
        "/product/25592770M": {
            redirectUrl: {
                destinationId: '52416781M',
                destinationType: 'product'
            },
            resourceId: 'mens',
            resourceType: 'category'
        }
    }
    // DEVELOPER NOTE: For now we are only simulating a valid response for a custom url, not an error, or a 
    // redirect.
    return mappings[urlSegment]
}

export default async (locals) => {
    debugger
    const config = getConfig()
    let configuredRoutes = []

    if (!isServerSide) {
        let _routes = window.__CONFIG__.app.routes
        configuredRoutes = await Promise.all(_routes.map(async ({path}) => {
            // DEVELOPER NOTE: We previously tried to dynamically load the component using the path to map to the 
            // filename and use import, but I couldn't get that to work. So here we are using the original routes
            // array to find the component for a given path from the serialized route config. It doesn't completely
            // work as it will remove the configured routes as they don't match the path. This should be done in 
            // another way.
            const {component} = routes.find((route) => route.path === path) || {}
            if (!component) {
                return
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
        configuredRoutes = configureRoutes(routes, config, {
            ignoredRoutes: ['/callback', '*']
        })
    }

    debugger
    if (locals.originalUrl) {
        const mapping = await getUrlMapping(locals.originalUrl.split('?')[0])
        if (mapping) {
            const isRedirect = !!mapping.redirectUrl
            // DEVELOPER NOTE: Here is where you would use the resource type to assign the corrent component.
            const ComponentToRender = isRedirect ? 
                () => <Redirect to={`/us/en-US/${mapping.redirectUrl.destinationType}/${mapping.redirectUrl.destinationId}`}/>  :
                () => <ProductDetail productId={mapping.resourceId}/> 
            configuredRoutes = [
                ...configureRoutes([{
                    path: locals.originalUrl.split('?')[0],
                    component: () => <ComponentToRender productId={mapping.resourceId}/>
                }], config, {
                    ignoredRoutes: []
                }),
                ...configuredRoutes
            ]
        }
    }
    debugger
    return configuredRoutes
}
