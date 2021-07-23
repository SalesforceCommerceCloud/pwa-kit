/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import PropTypes from 'prop-types'
import {Switch as RouterSwitch, Route} from 'react-router-dom'
import AppErrorBoundary from '../app-error-boundary'
import {UIDReset, UIDFork} from 'react-uid'

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
    const {error, appState, routes, App} = props
    return (
        <UIDReset>
            <AppErrorBoundary error={error}>
                {!error && (
                    <App preloadedProps={appState.appProps}>
                        <RouterSwitch>
                            {routes.map((route, i) => {
                                const {component: Component, ...routeProps} = route
                                return (
                                    <Route key={i} {...routeProps}>
                                        <UIDFork>
                                            <Component preloadedProps={appState.pageProps} />
                                        </UIDFork>
                                    </Route>
                                )
                            })}
                        </RouterSwitch>
                    </App>
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
