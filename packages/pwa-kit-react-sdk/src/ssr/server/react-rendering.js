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
import {Helmet} from 'react-helmet'
import {ChunkExtractor} from '@loadable/server'
import {StaticRouter as Router, matchPath} from 'react-router-dom'
import serialize from 'serialize-javascript'
import PropTypes from 'prop-types'
import sprite from 'svg-sprite-loader/runtime/sprite.build'
import {isRemote} from '@salesforce/pwa-kit-runtime/utils/ssr-server'
import {proxyConfigs} from '@salesforce/pwa-kit-runtime/utils/ssr-shared'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

import {getAssetUrl} from '../universal/utils'
import {ServerContext, CorrelationIdProvider} from '../universal/contexts'

import Document from '../universal/components/_document'
import App from '../universal/components/_app'
import Throw404 from '../universal/components/throw-404'

import {getAppConfig} from '../universal/compatibility'
import Switch from '../universal/components/switch'
import {getRoutes, routeComponent} from '../universal/components/route-component'
import * as errors from '../universal/errors'
import logger from '../../utils/logger-instance'

import PerformanceTimer, {PERFORMANCE_MARKS} from '../../utils/performance'

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
        logger.error(cause, {namespace: 'react-rendering.render'})
        const safeMessage = 'Internal Server Error'
        return {message: safeMessage, status: 500, stack: err.stack}
    }
}

// Because multi-value params are not supported in `aws-serverless-express` create a proper
// search string using the `query` property. We pay special attention to the order the params
// as best as we can.
export const getLocationSearch = (req, opts = {}) => {
    const {interpretPlusSignAsSpace = false} = opts
    const [_, search] = req.originalUrl.split('?')
    const params = new URLSearchParams(search)

    const newParams = new URLSearchParams()
    const orderedKeys = [...new Set(params.keys())]

    // Maintain the original order of the parameters by iterating the
    // ordered list of keys, and using the `req.query` object as the source of values.
    orderedKeys.forEach((key) => {
        const value = req.query[key]
        const values = Array.isArray(value) ? value : [value]

        values.forEach((v) => {
            // To have feature parity to SFRA, the + sign can be treated as space
            // However, this could potential a breaking change since not all users want to treat it as such
            // Therefore, we create a flag for it via the app configuration
            newParams.append(
                key,
                interpretPlusSignAsSpace ? decodeURIComponent(v).replace(/\+/, ' ') : v
            )
        })
    })

    const searchString = newParams.toString()
    // Update the location objects reference.
    return searchString ? `?${searchString}` : ''
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
    const includeServerTimingHeader = '__server_timing' in req.query
    const shouldTrackPerformance = includeServerTimingHeader || process.env.SERVER_TIMING
    res.__performanceTimer = new PerformanceTimer({enabled: shouldTrackPerformance})
    res.__performanceTimer.mark(PERFORMANCE_MARKS.total, 'start')
    const AppConfig = getAppConfig()
    // Get the application config which should have been stored at this point.
    const config = getConfig()

    AppConfig.restore(res.locals)

    const routes = getRoutes(res.locals)
    const WrappedApp = routeComponent(App, false, res.locals)

    const [pathname] = req.originalUrl.split('?')

    const location = {
        pathname,
        search: getLocationSearch(req, {
            interpretPlusSignAsSpace: config?.app?.url?.interpretPlusSignAsSpace
        })
    }

    // Step 1 - Find the match.
    res.__performanceTimer.mark(PERFORMANCE_MARKS.routeMatching, 'start')
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
    res.__performanceTimer.mark(PERFORMANCE_MARKS.routeMatching, 'end')

    // Step 2 - Get the component
    res.__performanceTimer.mark(PERFORMANCE_MARKS.loadComponent, 'start')
    const component = await route.component.getComponent()
    res.__performanceTimer.mark(PERFORMANCE_MARKS.loadComponent, 'end')

    // Step 3 - Init the app state
    const props = {
        error: null,
        appState: {},
        routerContext: {},
        req,
        res,
        App: WrappedApp,
        routes,
        location
    }
    let appJSX = <OuterApp {...props} />

    let appState, appStateError

    if (component === Throw404) {
        appState = {}
        appStateError = new errors.HTTPNotFound('Not found')
    } else {
        res.__performanceTimer.mark(PERFORMANCE_MARKS.fetchStrategies, 'start')
        const ret = await AppConfig.initAppState({
            App: WrappedApp,
            component,
            match,
            route,
            req,
            res,
            location,
            appJSX
        })
        appState = {
            ...ret.appState,
            __STATE_MANAGEMENT_LIBRARY: AppConfig.freeze(res.locals)
        }
        appStateError = ret.error
        res.__performanceTimer.mark(PERFORMANCE_MARKS.fetchStrategies, 'end')
    }
    res.__performanceTimer.mark(PERFORMANCE_MARKS.renderToString, 'start')
    appJSX = React.cloneElement(appJSX, {error: appStateError, appState})

    // Step 4 - Render the App
    let renderResult
    try {
        renderResult = renderApp({
            App: WrappedApp,
            appState,
            appStateError: appStateError && logAndFormatError(appStateError),
            routes,
            req,
            res,
            location,
            config,
            appJSX
        })
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

    res.__performanceTimer.mark(PERFORMANCE_MARKS.renderToString, 'end')
    res.__performanceTimer.mark(PERFORMANCE_MARKS.total, 'end')
    res.__performanceTimer.log()

    if (includeServerTimingHeader) {
        res.setHeader('Server-Timing', res.__performanceTimer.buildServerTimingHeader())
    }

    if (redirectUrl) {
        res.redirect(302, redirectUrl)
    } else {
        res.status(status).send(html)
    }
}

const OuterApp = ({req, res, error, App, appState, routes, routerContext, location}) => {
    const AppConfig = getAppConfig()
    return (
        <ServerContext.Provider value={{req, res}}>
            <Router location={location} context={routerContext}>
                <CorrelationIdProvider
                    correlationId={res.locals.requestId}
                    resetOnPageChange={false}
                >
                    <AppConfig locals={res.locals}>
                        <Switch error={error} appState={appState} routes={routes} App={App} />
                    </AppConfig>
                </CorrelationIdProvider>
            </Router>
        </ServerContext.Provider>
    )
}

OuterApp.propTypes = {
    req: PropTypes.object,
    res: PropTypes.object,
    error: PropTypes.object,
    App: PropTypes.elementType,
    appState: PropTypes.object,
    routes: PropTypes.array,
    routerContext: PropTypes.object,
    location: PropTypes.object
}

const renderToString = (jsx, extractor) =>
    ReactDOMServer.renderToString(extractor.collectChunks(jsx))

const renderApp = (args) => {
    const {req, res, appStateError, appJSX, appState, config} = args
    const extractor = new ChunkExtractor({statsFile: BUNDLES_PATH, publicPath: getAssetUrl()})

    const ssrOnly = 'mobify_server_only' in req.query || '__server_only' in req.query
    const prettyPrint = 'mobify_pretty' in req.query || '__pretty_print' in req.query
    const indent = prettyPrint ? 8 : 0

    let routerContext
    let appHtml
    let renderError
    // It's important that we render the App before extracting the script elements,
    // otherwise it won't return the correct chunks.

    try {
        routerContext = {}
        appHtml = renderToString(React.cloneElement(appJSX, {routerContext}), extractor)
    } catch (e) {
        // This will catch errors thrown from the app and pass the error
        // to the AppErrorBoundary component, and renders the error page.
        routerContext = {}
        renderError = logAndFormatError(e)
        appHtml = renderToString(
            React.cloneElement(appJSX, {routerContext, error: renderError}),
            extractor
        )
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
        __INITIAL_CORRELATION_ID__: res.locals.requestId,
        __CONFIG__: config,
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

const serverRenderer =
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({clientStats, serverStats}) => {
        return (req, res, next) => render(req, res, next)
    }

export default serverRenderer
