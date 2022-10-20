/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* global __webpack_require__ */
import React from 'react'
import ReactDOM from 'react-dom'
import {BrowserRouter as Router} from 'react-router-dom'
import DeviceContext from '../universal/device-context'
import {ServerContext, CorrelationIdProvider} from '../universal/contexts'
import App from '../universal/components/_app'
import {getAppConfig} from '../universal/compatibility'
import Switch from '../universal/components/switch'
import {getRoutes, routeComponent} from '../universal/components/route-component'
import {loadableReady} from '@loadable/component'
import {uuidv4} from '../../utils/uuidv4.client'
/* istanbul ignore next */
export const registerServiceWorker = (url) => {
    return Promise.resolve().then(() => {
        if ('serviceWorker' in navigator) {
            return Promise.resolve()
                .then(() => new Promise((resolve) => window.addEventListener('load', resolve)))
                .then(() => navigator.serviceWorker.register(url))
                .then((registration) =>
                    console.log(
                        `ServiceWorker registration successful with scope: ${registration.scope}`
                    )
                )
                .catch((err) => console.log('ServiceWorker registration failed: ', err))
        }
    })
}

/* istanbul ignore next */
export const start = () => {
    const AppConfig = getAppConfig()
    const rootEl = document.getElementsByClassName('react-target')[0]
    const data = JSON.parse(document.getElementById('mobify-data').innerHTML)

    // Set all globals sent from the server on the window object.
    Object.entries(data).forEach(([key, value]) => {
        window[key] = value
    })

    // Tell webpack how to find javascript files
    Object.defineProperty(__webpack_require__, 'p', {
        get: () => window.Progressive.buildOrigin
    })

    // On the browser we don't have request.locals, so we just provide an empty
    // object that exists for the lifetime of the app. AppConfig components can use
    // this to set up, eg. Redux stores.
    const locals = {}

    // AppConfig.restore *must* come before getRoutes()
    AppConfig.restore(locals, window.__PRELOADED_STATE__.__STATE_MANAGEMENT_LIBRARY)
    const routes = getRoutes(locals)

    // We need to tell the routeComponent HOC when the app is hydrating in order to
    // prevent pages from re-fetching data on the first client-side render. The
    // reason we do this is that we expect a render to have taken place
    // on the server already. That server-side render already called getProps()
    // and froze the application state as a JSON blob on the page.
    //
    // This is VERY fiddly – don't go crazy with window.__HYDRATING__. You have
    // been warned.
    window.__HYDRATING__ = true

    const WrappedApp = routeComponent(App, false, locals)
    const error = window.__ERROR__

    return Promise.resolve()
        .then(() => new Promise((resolve) => loadableReady(resolve)))
        .then(() => {
            ReactDOM.hydrate(
                <ServerContext.Provider value={{}}>
                    <Router>
                        <CorrelationIdProvider correlationId={() => uuidv4()}>
                            <DeviceContext.Provider value={{type: window.__DEVICE_TYPE__}}>
                                <AppConfig locals={locals}>
                                    <Switch
                                        error={error}
                                        appState={window.__PRELOADED_STATE__}
                                        routes={routes}
                                        App={WrappedApp}
                                    />
                                </AppConfig>
                            </DeviceContext.Provider>
                        </CorrelationIdProvider>
                    </Router>
                </ServerContext.Provider>,
                rootEl,
                () => {
                    window.__HYDRATING__ = false
                }
            )
        })
}
