/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Switch as RouterSwitch, Route} from 'react-router-dom'
import AppErrorBoundary from '../app-error-boundary'
import {UIDReset, UIDFork} from 'react-uid'

// Localization
import {IntlProvider as ReactIntlProvider} from 'react-intl'

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
    const {error, appState, intlConfig, routes, App} = props
    const IntlProvider = intlConfig ? ReactIntlProvider : Fragment

    return (
        <UIDReset>
            <IntlProvider {...intlConfig}>
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
            </IntlProvider>
        </UIDReset>
    )
}

Switch.propTypes = {
    error: PropTypes.object,
    appState: PropTypes.object,
    routes: PropTypes.array,
    App: PropTypes.func,
    preloadedProps: PropTypes.object,
    intlConfig: PropTypes.object
}

export default Switch
