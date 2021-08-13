/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * @module progressive-web-sdk/dist/ssr/server/react-rendering
 */

import path from 'path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import Helmet from 'react-helmet'
import {VALID_TAG_NAMES} from 'react-helmet/lib/HelmetConstants'
import {ChunkExtractor} from '@loadable/server'
import {StaticRouter as Router, matchPath} from 'react-router-dom'
import serialize from 'serialize-javascript'

import {getAssetUrl} from '../universal/utils'
import DeviceContext from '../universal/device-context'

import AMPDocument from '../universal/components/_amp-document'
import PWADocument from '../universal/components/_pwa-document'

import AMPApp from '../universal/components/_amp-app'
import PWAApp from '../universal/components/_pwa-app'
import Throw404 from '../universal/components/throw-404'

import AppConfig from '../universal/components/_app-config'
import Switch from '../universal/components/switch'
import {getRoutes, routeComponent} from '../universal/components/route-component'
import * as errors from '../universal/errors'
import {detectDeviceType} from '../../utils/ssr-server'
import {proxyConfigs} from '../../utils/ssr-shared'

const CWD = process.cwd()
const BUNDLES_PATH = path.resolve(CWD, 'build/loadable-stats.json')

const TTI_POLYFILL_SCRIPT = [
    `!function(){if('PerformanceLongTaskTiming' in window){var g=window.__tti={e:[]};`,
    `g.o=new PerformanceObserver(function(l){g.e=g.e.concat(l.getEntries())});`,
    `g.o.observe({entryTypes:['longtask']})}}();`
].join('')

export const WHITELISTED_INLINE_SCRIPTS = [TTI_POLYFILL_SCRIPT]

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
export const render = (req, res) => {
    // AppConfig.restore *must* come before using getRoutes() or routeComponent()
    // to inject arguments into the wrapped component's getProps methods.
    AppConfig.restore(res.locals)
    const routes = getRoutes(res.locals)

    const renderConfig = {
        amp: {
            App: routeComponent(AMPApp, false, res.locals),
            renderer: renderAMP
        },
        pwa: {
            App: routeComponent(PWAApp, false, res.locals),
            renderer: renderPWA
        }
    }

    return Promise.resolve()
        .then(() => {
            let ret = {route: undefined, match: undefined}
            routes.some((route) => {
                const match = matchPath(req.path, route)
                if (match) {
                    ret = {route, match}
                }
                return !!match
            })
            return ret
        })
        .then(({route, match}) => {
            // TODO: A minor problem here is that if we don't match a route, we
            // can't decide whether to render an AMP or a PWA error page - default
            // to the PWA
            const promises = [
                Promise.resolve().then(route ? route.component.getPageType : () => 'pwa'),
                route.component.getComponent()
            ]

            return Promise.all(promises).then(([pageType, component]) => ({
                route,
                match,
                pageType,
                component
            }))
        })
        .then(({route, match, pageType, component}) => {
            const {App, renderer} = renderConfig[pageType]

            const initAppState = () => {
                if (component === Throw404) {
                    // Don't init if there was no match
                    return Promise.resolve({
                        error: new errors.HTTPNotFound('Not found'),
                        appState: {}
                    })
                } else {
                    const {params, url} = match
                    const components = [App, route.component]
                    const promises = components.map((c) =>
                        c.getProps
                            ? c.getProps({
                                  req,
                                  res,
                                  params,
                                  location: url
                              })
                            : Promise.resolve({})
                    )
                    return Promise.resolve()
                        .then(() => Promise.all(promises))
                        .then(([appProps, pageProps]) => {
                            const appState = {
                                appProps,
                                pageProps,
                                __STATE_MANAGEMENT_LIBRARY: AppConfig.freeze(res.locals)
                            }
                            return {error: undefined, appState}
                        })
                        .catch((error) => {
                            return {
                                error: error || new Error(),
                                appState: {}
                            }
                        })
                }
            }

            return Promise.resolve()
                .then(initAppState)
                .then(({appState, error}) => {
                    const args = {
                        req,
                        res,
                        routes,
                        error: error && logAndFormatError(error),
                        appState,
                        App
                    }

                    return Promise.resolve()
                        .then(() => renderer(args))
                        .catch((e) => renderer({...args, error: logAndFormatError(e)}))
                        .then(({error, html, routerContext}) => {
                            const redirectUrl = routerContext.url
                            const status = (error && error.status) || res.statusCode

                            if (redirectUrl) {
                                res.redirect(302, redirectUrl)
                            } else {
                                res.status(status).send(html)
                            }
                        })
                })
        })
}

const renderAMP = (args) => {
    const {req, res, appState, routes, error, App} = args
    const routerContext = {}

    return Promise.resolve().then(() => {
        const appHtml = ReactDOMServer.renderToStaticMarkup(
            <Router location={req.path} context={routerContext}>
                <AppConfig locals={res.locals}>
                    <Switch error={error} appState={appState} routes={routes} App={App} />
                </AppConfig>
            </Router>
        )
        const html = ReactDOMServer.renderToStaticMarkup(
            <AMPDocument
                head={[<title key="title">Hello World</title>]}
                html={appHtml}
                beforeBodyEnd={[]}
            />
        )
        return {error, html: ['<!doctype html>', html].join(''), routerContext}
    })
}

const renderPWA = (args) => {
    const {req, res, routes, appState, error, App} = args

    return Promise.resolve().then(() => {
        const ssrOnly = 'mobify_server_only' in req.query
        const prettyPrint = 'mobify_pretty' in req.query
        const indent = prettyPrint ? 8 : 0
        const deviceType = detectDeviceType(req)
        const routerContext = {}

        let extractor
        let bundles = []
        let appJSX = (
            <Router location={req.path} context={routerContext}>
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
        return Promise.resolve().then(() => {
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
                        __html: serialize(windowGlobals, {isJSON: true, space: indent})
                    }}
                />,
                ...bundles
            ]

            const helmetHeadTags = VALID_TAG_NAMES.map(
                (tag) => helmet[tag] && helmet[tag].toComponent()
            ).filter((tag) => tag)

            const html = ReactDOMServer.renderToString(
                <PWADocument
                    head={[
                        <script
                            id="performance-metrics"
                            key="performance-metrics"
                            dangerouslySetInnerHTML={{
                                __html: TTI_POLYFILL_SCRIPT
                            }}
                            {...scriptProps}
                        />,
                        ...helmetHeadTags,
                        <link key="stylesheet" rel="stylesheet" href={getAssetUrl('main.css')} />
                    ]}
                    html={appHtml}
                    beforeBodyEnd={scripts}
                    htmlAttributes={helmet.htmlAttributes.toComponent()}
                    bodyAttributes={helmet.bodyAttributes.toComponent()}
                />
            )
            return {error, html: ['<!doctype html>', html].join(''), routerContext}
        })
    })
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
