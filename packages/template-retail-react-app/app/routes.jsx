/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {withRouter} from 'react-router-dom'
import loadable from '@loadable/component'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Components
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'
import {routes as _routes} from '@salesforce/retail-react-app/app/routes'

const fallback = <Skeleton height="75vh" width="100%" />

// Pages
const Home = loadable(() => import('@salesforce/retail-react-app/app/pages/home'), {fallback})
const PageNotFound = loadable(
    () => import('@salesforce/retail-react-app/app/pages/page-not-found'),
    {fallback}
)

// Remove handling SFRA routes on PWA Kit
const SFRARoutes = ['/cart', '/checkout', '*']

const routes = [
    ..._routes.filter((route) => !SFRARoutes.includes(route.path)),
    {
        path: '/home',
        component: Home,
        exact: true
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