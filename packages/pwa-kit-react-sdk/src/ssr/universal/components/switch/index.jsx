/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import PropTypes from 'prop-types'
import React from 'react'
import {Route, Switch as RouterSwitch} from 'react-router-dom'
import {UIDFork, UIDReset} from 'react-uid'
import AppErrorBoundary from '../app-error-boundary'
import {DesignModeProvider} from '@salesforce/page-designer-react-sdk/dist'

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
                        <DesignModeProvider>
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
                        </DesignModeProvider>
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
