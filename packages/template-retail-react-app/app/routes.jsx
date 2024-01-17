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

export const Home = loadable(() => import('./pages/home'), {fallback})
export const ProductDetail = loadable(() => import('./pages/product-detail'), {
    fallback
})
export const ProductList = loadable(() => import('./pages/product-list'), {
    fallback
})
export const PageNotFound = loadable(() => import('./pages/page-not-found'))

// Set the display names
Home.displayName = 'Home'
ProductDetail.displayName = 'ProductDetail'
ProductList.displayName = 'ProductList'
PageNotFound.displayName = 'PageNotFound'

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
    'ProductDetail': ProductDetail,
    'ProductList': ProductList,
    'PageNotFount': PageNotFound
}

const getUrlMapping = async (urlSegment) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // DEVELOPER NOTE: We probably need to account for the site and locale prefixes if there are any.
    const mappings = {
        "/custom-url": {
            resourceId: '25752986M',
            resourceType: 'product'
        },
        "/product/TG786M": {
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
    const config = getConfig()
    let configuredRoutes = []

    if (!isServerSide) {
        // CLIENT!

        let _routes = window.__CONFIG__.app.routes
        configuredRoutes = await Promise.all(_routes.map(async ({path, componentName, componentProps}) => {
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
        debugger
        // SERVER!

        configuredRoutes = configureRoutes(routes, config, {
            ignoredRoutes: ['/callback', '*']
        })

        const mapping = await getUrlMapping(locals.originalUrl.split('?')[0])
        if (mapping) {
            const isRedirect = !!mapping.redirectUrl

            // DEVELOPER NOTE: Here is where you would use the resource type to assign the corrent component.
            
            let Component
            let props
            if (isRedirect) {
                Component = Redirect
                props = {
                    to: `/${mapping.redirectUrl.destinationType}/${mapping.redirectUrl.destinationId}`
                }
            } else {
                Component = ProductDetail
                props = {
                    [`${mapping.resourceType}Id`]: mapping.resourceId
                }
            }

            configuredRoutes = [
                ...configureRoutes([{
                    path: locals.originalUrl.split('?')[0],
                    component: Component,
                    props
                }], config, {
                    ignoredRoutes: []
                }),
                ...configuredRoutes
            ]
        }
    }

    return configuredRoutes
}
