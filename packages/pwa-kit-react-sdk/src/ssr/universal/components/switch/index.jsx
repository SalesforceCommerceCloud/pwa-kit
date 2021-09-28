/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Switch as RouterSwitch, Route} from 'react-router-dom'
import AppErrorBoundary from '../app-error-boundary'
import {UIDReset, UIDFork} from 'react-uid'

// Localization
import {IntlProvider} from 'react-intl'

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
    const {error, appState, routes, App, localeConfig = {}} = props
    const {targetLocale, defaultLocale} = localeConfig?.app || {}
    const {messages} = localeConfig

    return (
        <UIDReset>
            <IntlProvider locale={targetLocale} defaultLocale={defaultLocale} messages={messages}>
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
    localeConfig: PropTypes.object // TODO: Use a proper shape here.
    // targetLocale: PropTypes.string,
    // defaultLocale: PropTypes.string,
    // messages: PropTypes.object
}

export default Switch
