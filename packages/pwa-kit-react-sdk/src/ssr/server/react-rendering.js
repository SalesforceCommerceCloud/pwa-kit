/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * @module progressive-web-sdk/ssr/server/react-rendering
 */

import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import {dehydrate, QueryClient, QueryClientProvider} from '@tanstack/react-query'
import ssrPrepass from 'react-ssr-prepass'
import {Helmet} from 'react-helmet'
import {ChunkExtractor} from '@loadable/server'
import {StaticRouter as Router, matchPath} from 'react-router-dom'
import serialize from 'serialize-javascript'

import {getAssetUrl} from '../universal/utils'
import DeviceContext from '../universal/device-context'
import {ExpressContext} from '../universal/contexts'

import Document from '../universal/components/_document'
import App from '../universal/components/_app'
import Throw404 from '../universal/components/throw-404'

import AppConfig from '../universal/components/_app-config'
import Switch from '../universal/components/switch'
import {getRoutes, routeComponent} from '../universal/components/route-component'
import * as errors from '../universal/errors'
import {detectDeviceType, isRemote} from 'pwa-kit-runtime/utils/ssr-server'
import {proxyConfigs} from 'pwa-kit-runtime/utils/ssr-shared'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

import sprite from 'svg-sprite-loader/runtime/sprite.build'

const CWD = process.cwd()
const BUNDLES_PATH = path.resolve(CWD, 'build/loadable-stats.json')

const VALID_TAG_NAMES = [
    'base',
    'body',
    'head',
    'html',
    'link',
    'meta',
    'noscript',
    'script',
    'style',
    'title'
]

export const ALLOWLISTED_INLINE_SCRIPTS = []

/**
 * Convert from thrown Error or String to {message, status} that we need for
 * rendering.
 * @private
 * @param err - Error to be converted
 * @function
 * @return {Object}
 */
const logAndFormatError = (err) => {
    if (err instanceof errors.HTTPError) {
        // These are safe to display – we expect end-users to throw them
        return {message: err.message, status: err.status, stack: err.stack}
    } else {
        const cause = err.stack || err.toString()
        console.error(cause)
        const safeMessage = 'Internal Server Error'
        return {message: safeMessage, status: 500, stack: err.stack}
    }
}

const initAppState = async ({App, component, match, route, req, res, location, queryClient}) => {
    if (component === Throw404) {
        // Don't init if there was no match
        return {
            error: new errors.HTTPNotFound('Not found'),
            appState: {}
        }
    }

    const {params} = match

    const components = [App, route.component]
    const queries = queryClient.queryCache.queries.map((q) => q.fetch())
    const promises = components
        .map((c) =>
            c.getProps
                ? c.getProps({
                      req,
                      res,
                      params,
                      location
                  })
                : Promise.resolve({})
        )
        .concat(queries)
    let returnVal = {}

    try {
        const [appProps, pageProps] = await Promise.all(promises)
        const appState = {
            appProps,
            pageProps,
            __REACT_QUERY_STATE__: dehydrate(queryClient),
            __STATE_MANAGEMENT_LIBRARY: AppConfig.freeze(res.locals)
        }

        returnVal = {
            error: undefined,
            appState: appState
        }
    } catch (error) {
        returnVal = {
            error: error || new Error(),
            appState: {}
        }
    }

    return returnVal
}

/**
 * This is the main react-rendering function for SSR. It is an Express handler.
 *
 * @param req - Request
 * @param res - Response
 *
 * @function
 *
 * @return {Promise}
 */
export const render = async (req, res, next) => {
    // Get the application config which should have been stored at this point.
    const config = getConfig()

    // AppConfig.restore *must* come before using getRoutes() or routeComponent()
    // to inject arguments into the wrapped component's getProps methods.
    AppConfig.restore(res.locals)

    const routes = getRoutes(res.locals)
    const WrappedApp = routeComponent(App, false, res.locals)

    const [pathname, search] = req.originalUrl.split('?')
    const location = {
        pathname,
        search: search ? `?${search}` : ''
    }
    const queryClient = new QueryClient()

    // Step 1 - Find the match.
    let route
    let match

    routes.some((_route) => {
        const _match = matchPath(req.path, _route)
        if (_match) {
            match = _match
            route = _route
        }
        return !!match
    })

    // Step 2 - Get the component
    const component = await route.component.getComponent()

    // Step 2.5 - Prepass render for `useQuery` server-side support.
    if (config?.ssrParameters?.ssrPrepassEnabled) {
        await prepassApp(req, res, {
            App: WrappedApp,
            location,
            routes,
            queryClient
        })
    }

    // Step 3 - Init the app state
    const {appState, error: appStateError} = await initAppState({
        App: WrappedApp,
        component,
        match,
        route,
        req,
        res,
        location,
        queryClient
    })

    // Step 4 - Render the App
    let renderResult
    const args = {
        App: WrappedApp,
        appState,
        appStateError: appStateError && logAndFormatError(appStateError),
        routes,
        req,
        res,
        location,
        config,
        queryClient
    }
    try {
        renderResult = await renderApp(args)
    } catch (e) {
        // This is an unrecoverable error.
        // (errors handled by the AppErrorBoundary are considered recoverable)
        // Here, we use Express's convention to invoke error middleware.
        // Note, we don't have an error handling middleware yet! This is calling the
        // default error handling middleware provided by Express
        return next(e)
    }

    // Step 5 - Determine what is going to happen, redirect, or send html with
    // the correct status code.
    const {html, routerContext, error} = renderResult
    const redirectUrl = routerContext.url
    const status = (error && error.status) || res.statusCode

    if (redirectUrl) {
        res.redirect(302, redirectUrl)
    } else {
        res.status(status).send(html)
    }
}

const getAppJSX = (req, res, error, appData) => {
    const {
        App,
        appState = {},
        routes,
        location,
        deviceType, // We DO need this.. if it's not passed we might have different queries.
        queryClient
    } = appData

    return (
        <ExpressContext.Provider value={{req, res}}>
            <QueryClientProvider client={queryClient}>
                <Router location={location}>
                    <DeviceContext.Provider value={{type: deviceType}}>
                        <AppConfig locals={res.locals}>
                            <Switch error={error} appState={appState} routes={routes} App={App} />
                        </AppConfig>
                    </DeviceContext.Provider>
                </Router>
            </QueryClientProvider>
        </ExpressContext.Provider>
    )
}

const renderAppHtml = (req, res, error, appData) => {
    const {extractor} = appData
    const appJSX = extractor.collectChunks(getAppJSX(req, res, error, appData))
    return ReactDOMServer.renderToString(appJSX)
}

const prepassApp = async (req, res, appData) => {
    let appStateError
    const deviceType = detectDeviceType(req)

    // Update "appData" with device type incase it influences the JSX elements that
    // react ssr prepass processes.
    appData = {
        ...appData,
        deviceType
    }

    await ssrPrepass(getAppJSX(req, res, appStateError, appData))
}

const renderApp = async (args) => {
    const {req, res, appStateError, App, appState, location, routes, config, queryClient} = args
    const deviceType = detectDeviceType(req)
    const extractor = new ChunkExtractor({statsFile: BUNDLES_PATH, publicPath: getAssetUrl()})
    const routerContext = {}
    const appData = {
        App,
        appState,
        location,
        routes,
        routerContext,
        deviceType,
        extractor,
        queryClient
    }

    const ssrOnly = 'mobify_server_only' in req.query || '__server_only' in req.query
    const prettyPrint = 'mobify_pretty' in req.query || '__pretty_print' in req.query
    const indent = prettyPrint ? 8 : 0

    let appHtml
    let renderError
    // It's important that we render the App before extracting the script elements,
    // otherwise it won't return the correct chunks.
    try {
        appHtml = renderAppHtml(req, res, appStateError, appData)
    } catch (e) {
        // This will catch errors thrown from the app and pass the error
        // to the AppErrorBoundary component, and renders the error page.
        renderError = logAndFormatError(e)
        appHtml = renderAppHtml(req, res, renderError, appData)
    }

    // Setting type: 'application/json' stops the browser from executing the code.
    const scriptProps = ssrOnly ? {type: 'application/json'} : {}

    let bundles = []
    /* istanbul ignore next */
    if (extractor) {
        bundles = extractor.getScriptElements().map((el) =>
            React.cloneElement(el, {
                ...el.props,
                ...scriptProps
            })
        )
    }

    const helmet = Helmet.renderStatic()

    // Return the first error encountered during the rendering pipeline.
    const error = appStateError || renderError
    // Remove the stacktrace when executing remotely as to not leak any important
    // information to users about our system.
    if (error && isRemote()) {
        delete error.stack
    }

    // Do not include *dynamic*, executable inline scripts – these cause issues with
    // strict CSP headers that customers often want to use. Avoid inline scripts,
    // full-stop, whenever possible.

    // Each key in `windowGlobals` is expected to be set on the window
    // object, client-side, by code in ssr/browser/main.jsx.
    //
    // Do *not* add to these without a very good reason - globals are a liability.

    const windowGlobals = {
        __CONFIG__: config,
        __DEVICE_TYPE__: deviceType,
        __PRELOADED_STATE__: appState,
        __ERROR__: error,
        // `window.Progressive` has a long history at Mobify and some
        // client-side code depends on it. Maintain its name out of tradition.
        Progressive: getWindowProgressive(req, res)
    }

    const scripts = [
        <script
            id="mobify-data"
            key="mobify-data"
            type="application/json" // Not executable
            dangerouslySetInnerHTML={{
                __html: serialize(windowGlobals, {isJSON: true, space: indent})
            }}
        />,
        ...bundles
    ]

    const svgs = [<div key="svg_sprite" dangerouslySetInnerHTML={{__html: sprite.stringify()}} />]
    const helmetHeadTags = VALID_TAG_NAMES.map(
        (tag) => helmet[tag] && helmet[tag].toComponent()
    ).filter((tag) => tag)

    const html = ReactDOMServer.renderToString(
        <Document
            head={[...helmetHeadTags]}
            html={appHtml}
            afterBodyStart={svgs}
            beforeBodyEnd={scripts}
            htmlAttributes={helmet.htmlAttributes.toComponent()}
            bodyAttributes={helmet.bodyAttributes.toComponent()}
        />
    )

    return {error, html: ['<!doctype html>', html].join(''), routerContext}
}

const getWindowProgressive = (req, res) => {
    const options = req.app.options || {}
    return {
        buildOrigin: getAssetUrl(''),
        cacheManifest: options.cacheHashManifest || {},
        ssrOptions: {
            // The hostname and origin under which this page is served
            appHostname: options.appHostname,
            appOrigin: options.appOrigin,
            // The id of the bundle being served, as a string,
            // defaulting to 'development' for the local dev server
            bundleId: process.env.BUNDLE_ID || 'development',
            // The id of the deploy as a string, defaulting to '0'
            // for the local dev server
            deployId: process.env.DEPLOY_ID || '0',
            // On a local dev server, the DEPLOY_TARGET environment variable
            // isn't defined by default. Developers may define it if it's
            // used by the UPWA to modify behaviour.
            deployTarget: process.env.DEPLOY_TARGET || 'local',
            proxyConfigs,
            // The request class (undefined by default)
            requestClass: res.locals.requestClass
        }
    }
}

// eslint-disable-next-line no-unused-vars
const serverRenderer = ({clientStats, serverStats}) => (req, res, next) => render(req, res, next)

export default serverRenderer
