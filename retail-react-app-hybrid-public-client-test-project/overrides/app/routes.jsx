/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, { useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import loadable from '@loadable/component'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Components
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'
import {routes as _routes} from '@salesforce/retail-react-app/app/routes'

const fallback = <Skeleton height="75vh" width="100%" />

// Create your pages here and add them to the routes array
// Use loadable to split code into smaller js chunks
const Home = loadable(() => import('@salesforce/retail-react-app/app/pages/home'), { fallback })
const MyNewRoute = loadable(() => import('./pages/my-new-route'))
const PageNotFound = loadable(() => import('@salesforce/retail-react-app/app/pages/page-not-found'))

const routes = [
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
        path: '/my-new-route',
        component: MyNewRoute
    },
    // remove routes from the base template that we want to go to SFRA
    ..._routes.filter((route) => {
        return !(route.path === '/cart' || route.path === '/checkout' || route.path === '*')
    }),
    {
        path: '*',
        component: withRouter((props) => {
            const { location, history } = props
            const urlParams = new URLSearchParams(location.search)

            useEffect(() => {
                const newURL = new URL(window.location)
                if (!urlParams.has('redirected')) {
                    newURL.searchParams.append('redirected', '1')
                    window.location.href = newURL
                }
            }, [location.pathname])
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
