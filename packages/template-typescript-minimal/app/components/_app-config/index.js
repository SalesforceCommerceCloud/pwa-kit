/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {withLegacyGetProps} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {getRoutes} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/route-component'
// import AppConfig from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/_app-config'

export const RoutesContext = React.createContext({})

const AppConfig = ({children, locals = {}}) => {
    const routes = getRoutes(locals)
    const indexRoute = routes.find((route) => route.path === '/' && route.exact)
    const indexRouteExists = Boolean(indexRoute)

    return <RoutesContext.Provider value={{indexRouteExists}}>{children}</RoutesContext.Provider>
}

AppConfig.restore = () => {}
AppConfig.freeze = () => {
    return undefined
}
AppConfig.extraGetPropsArgs = () => {
    return {}
}
AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

const isServerSide = typeof window === 'undefined'

// Recommended settings for PWA-Kit usages.
// NOTE: they will be applied on both server and client side.
const options = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 2 * 1000,
                ...(isServerSide ? {retryOnMount: false} : {})
            },
            mutations: {
                retry: false
            }
        }
    }
}

export default withReactQuery(withLegacyGetProps(AppConfig), options)
