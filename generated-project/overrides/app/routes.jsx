/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {configureRoutes} from 'retail-react-app/app/utils/routes-utils'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import loadable from '@loadable/component'
const fallback = <Skeleton height="75vh" width="100%" />
import {routes as _routes} from 'retail-react-app/app/routes'
import {Skeleton} from '@chakra-ui/react'

const Home = loadable(() => import('./pages/home'), {fallback})
const routes = [
    {
        path: '/',
        component: Home,
        exact: true
    },
    // NOTE: the final item in the array must be the { path: '*', component: PageNotFound } so
    // routes added after re-inserting the base templates routes here might fail to
    // show up unless the '*' route is filtered out and re-inserted
    ..._routes
]
export default () => {
    const config = getConfig()
    return configureRoutes(routes, config, {
        ignoredRoutes: ['/callback', '*']
    })
}
