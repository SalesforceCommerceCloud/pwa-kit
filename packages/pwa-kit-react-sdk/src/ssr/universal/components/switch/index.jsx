/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useState} from 'react'
import PropTypes from 'prop-types'
import {Switch as RouterSwitch, Route} from 'react-router-dom'
import AppErrorBoundary from '../app-error-boundary'
import {UIDReset, UIDFork} from 'react-uid'

const RoutesContext = React.createContext({})

// DEVELOPER NTOES: MAKE THIS API FANCIER!
export const useRouteContext = () => useContext(RoutesContext)

/**
 * The Switch component packages up the bits of rendering that are shared between
 * server and client-side. It's *mostly* a react-router Switch component, hence the
 * name.
 *
 * This is for internal use only.
 *
 * @private
 */
const Switch = (props) => {
    const {error, appState, routes, App, initialProps} = props
    const [_routes, setRoutes] = useState(routes)

 
    return (
        <UIDReset>
            <AppErrorBoundary error={error}>
                {!error && (
                    <RoutesContext.Provider value={{
                        routes: _routes,
                        updateRoutes: (routes) => {
                            setRoutes(routes)
                        }
                    }}>
                        <App preloadedProps={appState.appProps}>
                        
                            <RouterSwitch>
                                {_routes.map((route, i) => {
                                    const {component: Component, props, ...routeProps} = route
                                    return (
                                        <Route key={i} {...routeProps}>
                                            <UIDFork>
                                                <Component preloadedProps={appState.pageProps} {...props} />
                                            </UIDFork>
                                        </Route>
                                    )
                                })}
                            </RouterSwitch>
                        </App>
                    </RoutesContext.Provider>
                )}
            </AppErrorBoundary>
        </UIDReset>
    )
}

Switch.propTypes = {
    error: PropTypes.object,
    appState: PropTypes.object,
    routes: PropTypes.array,
    App: PropTypes.func,
    preloadedProps: PropTypes.object
}

export default Switch
