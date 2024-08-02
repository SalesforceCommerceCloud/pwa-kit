/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* global __webpack_require__ */
import React, {useRef} from 'react'
import {hydrateRoot} from 'react-dom/client'
import {BrowserRouter as Router} from 'react-router-dom'
import {ServerContext, CorrelationIdProvider} from '../universal/contexts'
import App from '../universal/components/_app'
import {getAppConfig} from '../universal/compatibility'
import Switch from '../universal/components/switch'
import {getRoutes, routeComponent} from '../universal/components/route-component'
import {loadableReady} from '@loadable/component'
import {uuidv4} from '../../utils/uuidv4.client'
import PropTypes from 'prop-types'
import logger from '../../utils/logger-instance'

/* istanbul ignore next */
export const registerServiceWorker = (url) => {
    return Promise.resolve().then(() => {
        if ('serviceWorker' in navigator) {
            return Promise.resolve()
                .then(() => new Promise((resolve) => window.addEventListener('load', resolve)))
                .then(() => navigator.serviceWorker.register(url))
                .then((registration) =>
                    logger.info(
                        `ServiceWorker registration successful with scope: ${registration.scope}`,
                        {namespace: 'registerServiceWorker'}
                    )
                )
                .catch((err) =>
                    logger.error('ServiceWorker registration failed', {
                        namespace: 'registerServiceWorker',
                        additionalProperties: {error: err}
                    })
                )
        }
    })
}

export const OuterApp = ({routes, error, WrappedApp, locals, onHydrate}) => {
    const AppConfig = getAppConfig()
    const isInitialPageRef = useRef(true)

    return (
        <ServerContext.Provider value={{}}>
            <Router ref={onHydrate}>
                <CorrelationIdProvider
                    correlationId={() => {
                        // If we are hydrating an error page use the server correlation id.
                        if (isInitialPageRef.current && window.__ERROR__) {
                            isInitialPageRef.current = false
                            return window.__INITIAL_CORRELATION_ID__
                        }
                        return uuidv4()
                    }}
                >
                    <AppConfig locals={locals}>
                        <Switch
                            error={error}
                            appState={window.__PRELOADED_STATE__}
                            routes={routes}
                            App={WrappedApp}
                        />
                    </AppConfig>
                </CorrelationIdProvider>
            </Router>
        </ServerContext.Provider>
    )
}

OuterApp.propTypes = {
    routes: PropTypes.array.isRequired,
    error: PropTypes.object,
    WrappedApp: PropTypes.func.isRequired,
    locals: PropTypes.object,
    onHydrate: PropTypes.func
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

    // We need to tell the routeComponent HOC when the app is hydrating in order to
    // prevent pages from re-fetching data on the first client-side render. The
    // reason we do this is that we expect a render to have taken place
    // on the server already. That server-side render already called getProps()
    // and froze the application state as a JSON blob on the page.
    //
    // This is VERY fiddly – don't go crazy with window.__HYDRATING__. You have
    // been warned.
    window.__HYDRATING__ = true

    const props = {
        error: window.__ERROR__,
        locals: locals,
        routes: getRoutes(locals),
        WrappedApp: routeComponent(App, false, locals)
    }

    return Promise.resolve()
        .then(() => new Promise((resolve) => loadableReady(resolve)))
        .then(() => {
            hydrateRoot(
                rootEl,
                <OuterApp
                    {...props}
                    onHydrate={() => {
                        window.__HYDRATING__ = false
                    }}
                />
            )
        })
}
