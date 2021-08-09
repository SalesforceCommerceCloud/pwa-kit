/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * @module progressive-web-sdk/dist/ssr/server/react-rendering
 */

import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import {Helmet} from 'react-helmet'
import {ChunkExtractor} from '@loadable/server'
import {StaticRouter as Router, matchPath} from 'react-router-dom'

import {getAssetUrl} from '../universal/utils'
import DeviceContext from '../universal/device-context'

import Document from '../universal/components/_document'
import App from '../universal/components/_app'
import Throw404 from '../universal/components/throw-404'

import AppConfig from '../universal/components/_app-config'
import Switch from '../universal/components/switch'
import {getRoutes, routeComponent} from '../universal/components/route-component'
import * as errors from '../universal/errors'
import {detectDeviceType} from '../../utils/ssr-server'
import {proxyConfigs} from '../../utils/ssr-shared'

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

const TTI_POLYFILL_SCRIPT = [
    `!function(){if('PerformanceLongTaskTiming' in window){var g=window.__tti={e:[]};`,
    `g.o=new PerformanceObserver(function(l){g.e=g.e.concat(l.getEntries())});`,
    `g.o.observe({entryTypes:['longtask']})}}();`
].join('')

export const ALLOWLISTED_INLINE_SCRIPTS = [TTI_POLYFILL_SCRIPT]

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

const initAppState = async ({App, component, match, route, req, res, location}) => {
    if (component === Throw404) {
        // Don't init if there was no match
        return {
            error: new errors.HTTPNotFound('Not found'),
            appState: {}
        }
    }

    const {params} = match

    const components = [App, route.component]
    const promises = components.map((c) =>
        c.getProps
            ? c.getProps({
                  req,
                  res,
                  params,
                  location
              })
            : Promise.resolve({})
    )
    let returnVal = {}

    try {
        const [appProps, pageProps] = await Promise.all(promises)
        const appState = {
            appProps,
            pageProps,
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
export const render = async (req, res) => {
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

    // Step 3 - Init the app state
    const {appState, error: appStateError} = await initAppState({
        App: WrappedApp,
        component,
        match,
        route,
        req,
        res,
        location
    })

    // Step 4 - Render the App
    let renderResult
    const args = {
        App: WrappedApp,
        appState,
        error: appStateError && logAndFormatError(appStateError),
        routes,
        req,
        res,
        location
    }
    try {
        renderResult = renderApp(args)
    } catch (error) {
        renderResult = renderApp({...args, error: logAndFormatError(error)})
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

const renderApp = (args) => {
    const {req, res, location, routes, appState, error, App} = args

    const ssrOnly = 'mobify_server_only' in req.query
    const prettyPrint = 'mobify_pretty' in req.query
    const indent = prettyPrint ? 8 : 0
    const deviceType = detectDeviceType(req)
    const routerContext = {}

    let extractor
    let bundles = []
    let appJSX = (
        <Router location={location} context={routerContext}>
            <DeviceContext.Provider value={{type: deviceType}}>
                <AppConfig locals={res.locals}>
                    <Switch error={error} appState={appState} routes={routes} App={App} />
                </AppConfig>
            </DeviceContext.Provider>
        </Router>
    )

    /* istanbul ignore next */
    try {
        extractor = new ChunkExtractor({statsFile: BUNDLES_PATH})
        appJSX = extractor.collectChunks(appJSX)
    } catch (e) {
        // Tests aren't being run through webpack, therefore no chunks or `loadable-stats.json`
        // file is being created. This causes a file read exception. For this
        // reason, swallow the error and carry on when in a test environment.
    }

    // It's important that we render the App before extracting the script elements,
    // otherwise it won't return the correct chunks.
    const appHtml = ReactDOMServer.renderToString(appJSX)

    // Setting type: 'application/json' stops the browser from executing the code.
    const scriptProps = ssrOnly ? {type: 'application/json'} : {}

    /* istanbul ignore next */
    if (extractor) {
        // Clone elements with the correct bundle path.
        bundles = extractor.getScriptElements().map((el) =>
            React.cloneElement(el, {
                ...el.props,
                ...scriptProps,
                src: el.props.src && getAssetUrl(el.props.src.slice(1))
            })
        )
    }

    const helmet = Helmet.renderStatic()

    // Do not include *dynamic*, executable inline scripts – these cause issues with
    // strict CSP headers that customers often want to use. Avoid inline scripts,
    // full-stop, whenever possible.

    // Each key in `windowGlobals` is expected to be set on the window
    // object, client-side, by code in ssr/browser/main.jsx.
    //
    // Do *not* add to these without a very good reason - globals are a liability.
    const windowGlobals = {
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
                __html: JSON.stringify(windowGlobals, null, indent)
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
            head={[
                <script
                    id="performance-metrics"
                    key="performance-metrics"
                    dangerouslySetInnerHTML={{
                        __html: TTI_POLYFILL_SCRIPT
                    }}
                    {...scriptProps}
                />,
                ...helmetHeadTags
            ]}
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
