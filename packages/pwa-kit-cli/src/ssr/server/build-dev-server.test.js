/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {NO_CACHE} from 'pwa-kit-runtime/ssr/server/constants'
import {X_MOBIFY_REQUEST_CLASS, X_PROXY_REQUEST_URL} from 'pwa-kit-runtime/utils/ssr-proxying'
const {
    getResponseFromCache,
    sendCachedResponse,
    cacheResponseWhenDone
} = require('pwa-kit-runtime/ssr/server/express')
import fetch from 'node-fetch'
import request from 'supertest'
import {makeErrorHandler, DevServerFactory} from './build-dev-server'
import path from 'path'
import http from 'http'
import https from 'https'
import nock from 'nock'
import zlib from 'zlib'
import fs from 'fs'

const TEST_PORT = 3444
const testFixtures = path.resolve(__dirname, 'test_fixtures')

// Mocks methods on the DevServerFactory to skip setting
// up Webpack's dev middleware – a massive simplification
// for testing.
const NoWebpackDevServerFactory = {
    ...DevServerFactory,
    ...{
        addSSRRenderer() {},
        addSDKInternalHandlers() {},
        getRequestProcessor() {}
    }
}

const httpAgent = new http.Agent({})

/**
 * An HTTPS.Agent that allows self-signed certificates
 * @type {module:https.Agent}
 */
export const httpsAgent = new https.Agent({
    rejectUnauthorized: false
})

/**
 * Fetch and ignore self-signed certificate errors.
 */
const insecureFetch = (url, opts) => {
    return fetch(url, {
        ...opts,
        agent: (_parsedURL) => (_parsedURL.protocol === 'https:' ? httpsAgent : httpAgent)
    })
}

const opts = (overrides = {}) => {
    const defaults = {
        buildDir: path.join(testFixtures, 'build'),
        mobify: {
            ssrEnabled: true,
            ssrOnly: ['main.js.map', 'ssr.js', 'ssr.js.map'],
            ssrShared: ['main.js', 'ssr-loader.js', 'worker.js'],
            ssrParameters: {
                proxyConfigs: [
                    {
                        protocol: 'https',
                        host: 'test.proxy.com',
                        path: 'base'
                    },
                    {
                        protocol: 'https',
                        // This is intentionally an unreachable host
                        host: '0.0.0.0',
                        path: 'base2'
                    },
                    {
                        protocol: 'https',
                        host: 'test.proxy.com',
                        path: 'base3',
                        caching: true
                    }
                ]
            }
        },
        quiet: true,
        port: TEST_PORT,
        protocol: 'http',
        sslFilePath: path.join(testFixtures, 'localhost.pem')
    }
    return {
        ...defaults,
        ...overrides
    }
}

describe('DevServer error handlers', () => {
    const testServerErrorHandler = (error, times) => {
        const exit = jest.fn()
        const proc = {exit}
        const close = jest.fn()
        const devserver = {close}
        const log = jest.fn()
        const handler = makeErrorHandler(proc, devserver, log)
        const e = {code: error}

        handler(e)
        expect(close).toHaveBeenCalledTimes(times)
    }

    test('should exit the current process if the requested port is in use', () => {
        testServerErrorHandler('EADDRINUSE', 1)
    })

    test('should ignore errors other than EADDRINUSE', () => {
        testServerErrorHandler('EACCES', 0)
    })
})

describe('DevServer startup', () => {
    test('createApp creates an express app', () => {
        const app = NoWebpackDevServerFactory.createApp(opts())
        expect(app.options.defaultCacheControl).toEqual(NO_CACHE)
    })

    test(`createApp validates missing or invalid field "protocol"`, () => {
        expect(() => NoWebpackDevServerFactory.createApp(opts({protocol: 'ssl'}))).toThrow()
    })
})

describe('DevServer loading page', () => {
    test('requesting homepage would temporarily redirect to the loading page, when build is not ready', async () => {
        const options = opts()
        const app = NoWebpackDevServerFactory.createApp(options)
        // Simulate when webpack build is not ready
        app.__webpackReady = () => false

        const middleware = () => {} // no-op
        DevServerFactory._useWebpackHotServerMiddleware(app, middleware)

        return request(app)
            .get('/')
            .expect(302) // Expecting the 302 temporary redirect (not 301)
            .then((response) => {
                expect(response.headers.location).toBe('/__mrt/loading-screen/index.html?loading=1')
            })
    })
})

describe('DevServer request processor support', () => {
    const helloWorld = '<div>hello world</div>'

    let route

    beforeEach(() => {
        route = jest.fn().mockImplementation((req, res) => {
            res.send(helloWorld)
        })
    })

    afterEach(() => {
        route = undefined
    })

    test('SSRServer supports the request-processor and request class', () => {
        const ServerFactory = {
            ...NoWebpackDevServerFactory,
            ...{
                getRequestProcessor() {
                    return {
                        processRequest: ({getRequestClass, setRequestClass}) => {
                            console.log(`getRequestClass returns ${getRequestClass()}`)
                            setRequestClass('bot')
                            return {
                                path: '/altered',
                                querystring: 'foo=bar'
                            }
                        }
                    }
                }
            }
        }

        const app = ServerFactory.createApp(opts())
        app.get('/*', route)

        return request(app)
            .get('/')
            .expect(200)
            .then((response) => {
                const requestClass = response.headers[X_MOBIFY_REQUEST_CLASS]
                expect(requestClass).toEqual('bot')
                expect(route).toHaveBeenCalled()
            })
    })

    test('SSRServer handles no request processor', () => {
        const ServerFactory = {
            ...NoWebpackDevServerFactory,
            ...{
                getRequestProcessor() {
                    return null
                }
            }
        }

        const options = opts()
        const app = ServerFactory.createApp(options)
        app.get('/*', route)

        return request(app)
            .get('/')
            .expect(200)
            .then((response) => {
                expect(response.headers[X_MOBIFY_REQUEST_CLASS]).toBe(undefined)
                expect(route).toHaveBeenCalled()
                expect(response.text).toEqual(helloWorld)
            })
    })

    test('SSRServer handles a broken request processor', () => {
        // This is a broken because processRequest is required to return
        // {path, querystring}, but returns undefined

        const ServerFactory = {
            ...NoWebpackDevServerFactory,
            ...{
                getRequestProcessor() {
                    return {
                        processRequest: () => {
                            return
                        }
                    }
                }
            }
        }

        const app = ServerFactory.createApp(opts())
        app.get('/*', route)

        return request(app)
            .get('/')
            .expect(500)
            .then(() => {
                expect(route).not.toHaveBeenCalled()
            })
    })
})

describe('DevServer listening on http/https protocol', () => {
    let server
    let originalEnv

    beforeEach(() => {
        originalEnv = Object.assign({}, process.env)
    })

    afterEach(() => {
        if (server) {
            server.close()
        }
        process.env = originalEnv
    })

    const cases = [
        {options: {protocol: 'http'}, env: {}, name: 'listens on http (set in options)'},
        {options: {protocol: 'https'}, env: {}, name: 'listens on https (set in options)'},
        {options: {}, env: {DEV_SERVER_PROTOCOL: 'http'}, name: 'listens on http (set in env var)'},
        {
            options: {},
            env: {DEV_SERVER_PROTOCOL: 'https'},
            name: 'listens on https (set in env var)'
        }
    ]

    cases.forEach(({options, env, name}) => {
        const protocol = options.protocol || env.DEV_SERVER_PROTOCOL
        test(name, () => {
            process.env = {...process.env, ...env}
            const {server: _server} = NoWebpackDevServerFactory.createHandler(
                opts(options),
                (app) => {
                    app.get('/*', (req, res) => {
                        res.send('<div>hello world</div>')
                    })
                }
            )
            server = _server
            return insecureFetch(`${protocol}://localhost:${TEST_PORT}`).then((response) => {
                expect(response.ok).toBe(true)
                return Promise.resolve()
            })
        })
    })
})

test('SSRServer proxying handles empty path', () => {
    // This tests a specific fault that occurred when making a proxy request to mobify/proxy/base/.
    const location = '/another/path'

    // Create a mock response from the proxied backend
    const nockRedirect = nock('https://test.proxy.com')
        .get('/')
        .reply(301, '', {Location: location})

    const options = opts()

    // We expect the Express app to rewrite redirect responses
    const rewritten = `${options.protocol}://localhost:${options.port}/mobify/proxy/base${location}`

    const app = NoWebpackDevServerFactory.createApp(options)
    return (
        request(app)
            .get('/mobify/proxy/base/')
            .expect(301)
            .expect('Location', rewritten)
            // Expected to hit the backend
            .then(() => expect(nockRedirect.isDone()).toBe(true))
    )
})

describe('DevServer proxying', () => {
    afterEach(() => {
        nock.cleanAll()
    })
    test('rewrites redirects', () => {
        // Example:
        // - You're running a proxy server for example.com at localhost/mobify/base
        // - You request localhost/mobify/base which hits example.com and returns a redirect to example.com/found
        // - The proxy must rewrite that redirect to localhost/mobify/base/found

        // Create a mock response from the proxied backend
        const location = '/another/path'
        const nockRedirect = nock('https://test.proxy.com')
            .get('/test/path')
            .reply(301, '', {Location: location})

        const options = opts()

        // We expect the Express app to rewrite redirect responses
        const rewritten = `${options.protocol}://localhost:${options.port}/mobify/proxy/base${location}`

        const app = NoWebpackDevServerFactory.createApp(options)

        return (
            request(app)
                .get('/mobify/proxy/base/test/path')
                .expect(301)
                .expect('Location', rewritten)
                // Expected to hit the backend
                .then(() => expect(nockRedirect.isDone()).toBe(true))
        )
    })

    test('rewrites headers', () => {
        // Use nock to mock out a host to which we proxy
        const requestHeaders = []
        const responseHeaders = {
            'Set-Cookie': 'xyz=456'
        }
        const targetPath = '/test/path3?abc=123'
        const nockResponse = nock('https://test.proxy.com')
            .get(targetPath)
            .reply(
                200,
                function() {
                    requestHeaders.push(this.req.headers)
                },
                responseHeaders
            )

        const app = NoWebpackDevServerFactory.createApp(opts())
        const path = `/mobify/proxy/base${targetPath}`
        const outgoingHeaders = {
            Host: 'localhost:4567',
            Origin: 'https://localhost:4567',
            Cookie: 'abc=123',
            'x-multi-value': 'abc, def'
        }

        return request(app)
            .get(path)
            .set(outgoingHeaders)
            .then((response) => {
                // Expected that proxy request would be fetched
                expect(nockResponse.isDone()).toBe(true)

                // We expect a 200 (that nock returned)
                expect(response.status).toEqual(200)

                // We expect that we got a copy of the request headers
                expect(requestHeaders.length).toBe(1)

                // Verify that the request headers were rewritten
                const headers = requestHeaders[0]
                expect(headers.host).toEqual('test.proxy.com')
                expect(headers.origin).toEqual('https://test.proxy.com')

                // Verify that the cookie and multi-value headers are
                // correctly preserved.
                expect(headers.cookie).toEqual('abc=123')
                const multi = headers['x-multi-value']
                expect(multi).toEqual('abc, def')

                // Verify that the response contains a Set-Cookie
                const setCookie = response.headers['set-cookie']
                expect(setCookie.length).toBe(1)
                expect(setCookie[0]).toEqual('xyz=456')

                // Verify that the x-proxy-request-url header is present in
                // the response
                const requestUrl = response.headers[X_PROXY_REQUEST_URL]
                expect(requestUrl).toEqual(`https://test.proxy.com${targetPath}`)
            })
    })

    test('restricts methods', () => {
        // Use nock to mock out a host to which we proxy, though we
        // do not expect the request to be made.
        const nockResponse = nock('https://test.proxy.com')
            .get('/test/path3')
            .reply(200, 'OK')

        const app = NoWebpackDevServerFactory.createApp(opts())
        const path = '/mobify/caching/base3/test/path3'

        return request(app)
            .put(path)
            .then((response) => {
                // Expected that proxy request would not be fetched
                expect(nockResponse.isDone()).toBe(false)
                expect(response.status).toEqual(405)
            })
    })

    test('filters headers', () => {
        // Use nock to mock out a host to which we proxy
        const nockResponse = nock('https://test.proxy.com')
            .get('/test/path3')
            .reply(200, function() {
                const headers = this.req.headers
                expect('x-mobify-access-key' in headers).toBe(false)
                expect('cache-control' in headers).toBe(false)
                expect('cookie' in headers).toBe(false)

                expect(headers['accept-language']).toEqual('en')

                expect(headers['accept-encoding']).toEqual('gzip')

                // This value is fixed
                expect(headers['user-agent']).toEqual('Amazon CloudFront')

                return 'Success'
            })

        const app = NoWebpackDevServerFactory.createApp(opts())
        const path = '/mobify/caching/base3/test/path3'

        return request(app)
            .get(path)
            .set({
                // These headers are disallowed and should be removed
                'x-mobify-access-key': '12345',
                'cache-control': 'no-cache',
                cookie: 'abc=123',
                // These headers are allowed
                'accept-encoding': 'gzip',
                'accept-language': 'en'
            })
            .then((response) => {
                // Expected that proxy request would be fetched
                expect(nockResponse.isDone()).toBe(true)
                expect(response.status).toEqual(200)
            })
    })

    test('handles error', () => {
        const app = NoWebpackDevServerFactory.createApp(opts())

        return request(app)
            .get('/mobify/proxy/base2/test/path')
            .expect(500)
    })
})

describe('DevServer persistent caching support', () => {
    const namespace = 'test'

    const keyFromURL = (url) => encodeURIComponent(url)

    /**
     * A cache decorator for a route function that uses the percent-encoded req.url
     * as keys for all cache entries (this makes testing easier).
     */
    const cachedRoute = (route) => (req, res) => {
        const shouldCache = !req.query.noCache
        const cacheArgs = {
            req,
            res,
            namespace,
            key: keyFromURL(req.url)
        }

        const shouldCacheResponse = (req, res) => res.statusCode >= 200 && res.statusCode < 300

        return Promise.resolve()
            .then(() => getResponseFromCache(cacheArgs))
            .then((entry) => {
                if (entry.found) {
                    sendCachedResponse(entry)
                } else {
                    if (shouldCache) {
                        cacheResponseWhenDone({
                            shouldCacheResponse,
                            ...cacheArgs
                        })
                    }
                    return route(req, res)
                }
            })
    }

    /**
     * A test route that returns different content types based on query params.
     */
    const routeImplementation = (req, res) => {
        const status = parseInt(req.query.status || 200)

        switch (req.query.type) {
            case 'precompressed':
                res.status(status)
                res.setHeader('content-type', 'application/javascript')
                res.setHeader('content-encoding', 'gzip')
                res.send(zlib.gzipSync(fs.readFileSync(path.join(testFixtures, 'app', 'main.js'))))
                break

            case 'compressed-responses-test':
                // The "compression" middleware only compresses responses that are
                // "compressable". So we must set the `content-type` to a known
                // "compressible" type.
                res.setHeader('content-type', 'text/html')
                res.write('<div>Hello Compression</div>')
                res.end()
                break

            default:
                throw new Error('Unhandled case')
        }
    }

    let app, route

    beforeEach(() => {
        route = jest.fn().mockImplementation(routeImplementation)
        const withCaching = cachedRoute(route)
        app = NoWebpackDevServerFactory.createApp(opts())
        app.get('/*', withCaching)
    })

    afterEach(() => {
        app.applicationCache.close()
        app = null
        route = null
    })

    test('Caching of compressed responses', () => {
        // ADN-118 reported that a cached response was correctly sent
        // the first time, but was corrupted the second time. This
        // test is specific to that issue.
        const url = '/?type=compressed-responses-test'
        const expected = '<div>Hello Compression</div>'

        return Promise.resolve()
            .then(() => request(app).get(url))
            .then((res) => app._requestMonitor._waitForResponses().then(() => res))
            .then((res) => {
                expect(res.status).toEqual(200)
                expect(res.headers['x-mobify-from-cache']).toEqual('false')
                expect(res.headers['content-encoding']).toEqual('gzip')
                expect(res.text).toEqual(expected)
            })
            .then(() =>
                app.applicationCache.get({
                    key: keyFromURL(url),
                    namespace
                })
            )
            .then((entry) => expect(entry.found).toBe(true))
            .then(() => request(app).get(url))
            .then((res) => app._requestMonitor._waitForResponses().then(() => res))
            .then((res) => {
                expect(res.status).toEqual(200)
                expect(res.headers['x-mobify-from-cache']).toEqual('true')
                expect(res.headers['content-encoding']).toEqual('gzip')
                expect(res.text).toEqual(expected)
            })
    })

    test('Compressed responses are not re-compressed', () => {
        const url = '/?type=precompressed'

        return request(app)
            .get(url)
            .then((res) => app._requestMonitor._waitForResponses().then(() => res))
            .then((res) => {
                expect(res.status).toEqual(200)
                expect(res.headers['x-mobify-from-cache']).toEqual('false')
                expect(res.headers['content-encoding']).toEqual('gzip')
                return res
            })
            .then((res) =>
                app.applicationCache
                    .get({
                        key: keyFromURL(url),
                        namespace
                    })
                    .then((entry) => ({res, entry}))
            )
            .then(({res, entry}) => {
                expect(entry.found).toBe(true)
                const uncompressed = zlib.gunzipSync(entry.data)
                expect(uncompressed.toString()).toEqual(res.text)
            })
    })
})
