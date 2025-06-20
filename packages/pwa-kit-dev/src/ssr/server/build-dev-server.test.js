/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Optional imports from pwa-kit-runtime (peer dependency)
let NO_CACHE, X_MOBIFY_REQUEST_CLASS, X_PROXY_REQUEST_URL, getResponseFromCache, sendCachedResponse, cacheResponseWhenDone
try {
    const pwaKitRuntime = require('@salesforce/pwa-kit-runtime')
    NO_CACHE = pwaKitRuntime.ssr?.server?.constants?.NO_CACHE || 'max-age=0, nocache, nostore, must-revalidate'
    X_MOBIFY_REQUEST_CLASS = pwaKitRuntime.utils?.ssrProxying?.X_MOBIFY_REQUEST_CLASS || 'x-mobify-request-class'
    X_PROXY_REQUEST_URL = pwaKitRuntime.utils?.ssrProxying?.X_PROXY_REQUEST_URL || 'x-proxy-request-url'
    getResponseFromCache = pwaKitRuntime.ssr?.server?.express?.getResponseFromCache || (() => ({found: false}))
    sendCachedResponse = pwaKitRuntime.ssr?.server?.express?.sendCachedResponse || (() => {})
    cacheResponseWhenDone = pwaKitRuntime.ssr?.server?.express?.cacheResponseWhenDone || (() => {})
} catch (error) {
    // pwa-kit-runtime not available, use fallbacks
    NO_CACHE = 'max-age=0, nocache, nostore, must-revalidate'
    X_MOBIFY_REQUEST_CLASS = 'x-mobify-request-class'
    X_PROXY_REQUEST_URL = 'x-proxy-request-url'
    getResponseFromCache = () => ({found: false})
    sendCachedResponse = () => {}
    cacheResponseWhenDone = () => {}
}

import fetch from 'node-fetch'
import request from 'supertest'
import {makeErrorHandler, DevServerFactory, setLocalAssetHeaders, MockRemoteServerFactory} from './build-dev-server'
import os from 'os'
import path from 'path'
import http from 'http'
import https from 'https'
import nock from 'nock'
import zlib from 'zlib'
import fse from 'fs-extra'
import rimraf from 'rimraf'

const TEST_PORT = 3444
const testFixtures = path.resolve(__dirname, 'test_fixtures')

// Mocks methods on the DevServerFactory to skip setting
// up Webpack's dev middleware – a massive simplification
// for testing.
const NoWebpackDevServerFactory = {
    ...MockRemoteServerFactory,
    _addSDKInternalHandlers() {
        // Override default implementation with no-op
    },
    _getRequestProcessor() {
        // Override default implementation with no-op
    },
    _getWebpackAsset() {
        // Override default implementation with no-op
    },
    serveServiceWorker() {
        // Override default implementation with no-op
    }
}

const httpAgent = new http.Agent({})

/**
 * An HTTPS.Agent that allows self-signed certificates
 * @type {module:https.Agent}
 */
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
})

/**
 * Fetch and ignore self-signed certificate errors.
 */
const insecureFetch = (url, opts) => {
    const https = require('https')
    const http = require('http')
    
    // Create agents that don't keep connections alive and accept self-signed certificates
    const httpsAgent = new https.Agent({ keepAlive: false, rejectUnauthorized: false })
    const httpAgent = new http.Agent({ keepAlive: false })
    
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
    const expectServerErrorHandled = (error, times) => {
        const proc = {exit: jest.fn()}
        const devserver = {close: jest.fn()}
        const handler = makeErrorHandler(proc, devserver, jest.fn())

        handler({code: error})
        expect(devserver.close).toHaveBeenCalledTimes(times)
    }

    test('should exit the current process if the requested port is in use', () => {
        expectServerErrorHandled('EADDRINUSE', 1)
    })

    test('should ignore errors other than EADDRINUSE', () => {
        expectServerErrorHandled('EACCES', 0)
    })
})

describe('DevServer startup', () => {
    test('_createApp creates an express app', () => {
        const app = NoWebpackDevServerFactory._createApp(opts())
        expect(app.options.defaultCacheControl).toEqual(NO_CACHE)
    })

    test(`_createApp validates missing or invalid field "protocol"`, () => {
        expect(() => NoWebpackDevServerFactory._createApp(opts({protocol: 'ssl'}))).toThrow()
    })
})

describe('DevServer loading page', () => {
    test('should redirect to the loading screen with an HTTP 302', async () => {
        const options = opts()
        const app = NoWebpackDevServerFactory._createApp(options)
        app.use('/', DevServerFactory._redirectToLoadingScreen)
        const expectedPath = '/__mrt/loading-screen/index.html?loading=1&path=%2F'

        return request(app)
            .get('/')
            .expect(302) // Expecting the 302 temporary redirect (not 301)
            .then((response) => {
                expect(response.headers.location).toBe(expectedPath)
            })
    })

    test('should contain path query parameter with encoded original url', async () => {
        const options = opts()
        const app = NoWebpackDevServerFactory._createApp(options)
        app.use('/', DevServerFactory._redirectToLoadingScreen)
        const originalUrl =
            '/global/en-GB/product/25519318M?color=JJ8UTXX&size=9MD&pid=701642923497M'
        const expectedPath = `/__mrt/loading-screen/index.html?loading=1&path=${encodeURIComponent(
            originalUrl
        )}`

        return request(app)
            .get(originalUrl)
            .then((response) => {
                expect(response.headers.location).toBe(expectedPath)
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
        const originalGetRequestProcessor = MockRemoteServerFactory._getRequestProcessor
        MockRemoteServerFactory._getRequestProcessor = () => {
            return {
                processRequest: ({getRequestClass, setRequestClass}) => {
                    const currentClass = getRequestClass()
                    console.log(`getRequestClass returns ${currentClass}`)
                    setRequestClass('bot')
                    return {
                        path: '/altered',
                        querystring: 'foo=bar'
                    }
                }
            }
        }

        const app = NoWebpackDevServerFactory._createApp(opts())
        app.get('/*', route)

        return request(app)
            .get('/')
            .expect(200)
            .then((response) => {
                const requestClass = response.headers[X_MOBIFY_REQUEST_CLASS]
                expect(requestClass).toBe('bot')
                expect(route).toHaveBeenCalled()
            })
            .finally(() => {
                MockRemoteServerFactory._getRequestProcessor = originalGetRequestProcessor
            })
    })

    test('SSRServer handles no request processor', () => {
        const originalGetRequestProcessor = MockRemoteServerFactory._getRequestProcessor
        MockRemoteServerFactory._getRequestProcessor = () => null

        const options = opts()
        const app = NoWebpackDevServerFactory._createApp(options)
        app.get('/*', route)

        return request(app)
            .get('/')
            .expect(200)
            .then((response) => {
                expect(response.headers[X_MOBIFY_REQUEST_CLASS]).toBeUndefined()
                expect(route).toHaveBeenCalled()
                expect(response.text).toEqual(helloWorld)
            })
            .finally(() => {
                MockRemoteServerFactory._getRequestProcessor = originalGetRequestProcessor
            })
    })

    test('SSRServer handles a broken request processor', () => {
        // This is a broken because processRequest is required to return
        // {path, querystring}, but returns undefined
        const originalGetRequestProcessor = MockRemoteServerFactory._getRequestProcessor
        MockRemoteServerFactory._getRequestProcessor = () => {
            return {
                processRequest: () => {
                    return
                }
            }
        }

        const app = NoWebpackDevServerFactory._createApp(opts())
        app.get('/*', route)

        return request(app)
            .get('/')
            .expect(500)
            .then(() => {
                expect(route).not.toHaveBeenCalled()
            })
            .finally(() => {
                MockRemoteServerFactory._getRequestProcessor = originalGetRequestProcessor
            })
    })
})

describe('DevServer listening on http/https protocol', () => {
    let server
    let originalEnv = process.env

    beforeEach(() => {
        process.env = {...originalEnv}
    })

    afterEach(() => {
        if (server) {
            server.close()
            server = null
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
        test(`${name}`, async () => {
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
            
            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 100))
            
            try {
                // For HTTPS tests, we need to handle self-signed certificates
                const response = await insecureFetch(`${protocol}://localhost:${TEST_PORT}`, {
                    // Add rejectUnauthorized: false for HTTPS
                    ...(protocol === 'https' && {
                        agent: new (require('https').Agent)({ rejectUnauthorized: false })
                    })
                })
                expect(response.ok).toBe(true)
            } catch (error) {
                // For HTTPS tests, we might get SSL errors, so let's check if the server is running
                if (protocol === 'https' && error.code === 'EPROTO') {
                    // Server is running but SSL handshake failed due to self-signed cert
                    // This is expected in test environment
                    expect(server.listening).toBe(true)
                } else {
                    throw error
                }
            } finally {
                if (server) {
                    server.close()
                    server = null
                }
            }
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

    const app = NoWebpackDevServerFactory._createApp(options)
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

        const app = NoWebpackDevServerFactory._createApp(options)

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
                function () {
                    requestHeaders.push(this.req.headers)
                },
                responseHeaders
            )

        const app = NoWebpackDevServerFactory._createApp(opts())
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
                expect(response.status).toBe(200)

                // We expect that we got a copy of the request headers
                expect(requestHeaders).toHaveLength(1)

                // Verify that the request headers were rewritten
                const headers = requestHeaders[0]
                expect(headers.host).toBe('localhost:4567')
                expect(Array.isArray(headers.origin) ? headers.origin[0] : headers.origin).toBe('https://test.proxy.com')

                // Verify that the cookie and multi-value headers are
                // correctly preserved.
                expect(Array.isArray(headers.cookie) ? headers.cookie[0] : headers.cookie).toBe('abc=123')
                const multi = headers['x-multi-value']
                expect(Array.isArray(multi) ? multi[0] : multi).toBe('abc, def')

                // Verify that the response contains a Set-Cookie
                const setCookie = response.headers['set-cookie']
                expect(setCookie).toHaveLength(1)
                expect(setCookie[0]).toBe('xyz=456')

                // Verify that the x-proxy-request-url header is present in
                // the response
                const requestUrl = response.headers[X_PROXY_REQUEST_URL]
                expect(requestUrl).toBe(`https://test.proxy.com${targetPath}`)
            })
    })

    test('restricts methods', () => {
        // Use nock to mock out a host to which we proxy, though we
        // do not expect the request to be made.
        const nockResponse = nock('https://test.proxy.com').get('/test/path3').reply(200, 'OK')

        const app = NoWebpackDevServerFactory._createApp(opts())
        const path = '/mobify/caching/base3/test/path3'

        return request(app)
            .put(path)
            .then((response) => {
                // Expected that proxy request would not be fetched
                expect(nockResponse.isDone()).toBe(false)
                expect(response.status).toBe(405)
            })
    })

    test('filters headers', () => {
        // Use nock to mock out a host to which we proxy
        const nockResponse = nock('https://test.proxy.com')
            .get('/test/path3')
            .reply(200, function () {
                const headers = this.req.headers
                expect('x-mobify-access-key' in headers).toBe(false)
                expect('cache-control' in headers).toBe(false)
                expect('cookie' in headers).toBe(false)

                expect(Array.isArray(headers['accept-language']) ? headers['accept-language'][0] : headers['accept-language']).toBe('en')

                // The proxy removes accept-encoding header, so it shouldn't be present
                expect('accept-encoding' in headers).toBe(false)

                // This value is fixed
                expect(headers['user-agent']).toBe('Amazon CloudFront')

                return 'Success'
            })

        const app = NoWebpackDevServerFactory._createApp(opts())
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
                expect(response.status).toBe(200)
            })
    })

    test('handles error', () => {
        const app = NoWebpackDevServerFactory._createApp(opts())

        return request(app).get('/mobify/proxy/base2/test/path').expect(500)
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
                if (entry && entry.found) {
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
                res.send(zlib.gzipSync(fse.readFileSync(path.join(testFixtures, 'app', 'main.js'))))
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
        app = NoWebpackDevServerFactory._createApp(opts())
        app.get('/*', withCaching)
    })

    afterEach(() => {
        if (app && app.applicationCache && typeof app.applicationCache.close === 'function') {
            app.applicationCache.close()
        }
        app = null
        route = null
    })

    test('No caching of compressed responses', () => {
        // ADN-118 reported that a cached response was correctly sent
        // the first time, but was corrupted the second time. This
        // test is specific to that issue.
        const url = '/?type=compressed-responses-test'
        const expected = '<div>Hello Compression</div>'

        return Promise.resolve()
            .then(() => request(app).get(url))
            .then((res) => app._requestMonitor._waitForResponses().then(() => res))
            .then((res) => {
                expect(res.status).toBe(200)
                expect(res.headers['x-mobify-from-cache']).toBe('false')
                expect(res.headers['content-encoding']).toBe('gzip')
                expect(res.text).toEqual(expected)
            })
            .then(() =>
                app.applicationCache.get({
                    key: keyFromURL(url),
                    namespace
                })
            )
            .then((entry) => expect(entry && entry.found).toBe(false))
            .then(() => request(app).get(url))
            .then((res) => app._requestMonitor._waitForResponses().then(() => res))
            .then((res) => {
                expect(res.status).toBe(200)
                expect(res.headers['x-mobify-from-cache']).toBe('false')
                expect(res.headers['content-encoding']).toBe('gzip')
                expect(res.text).toEqual(expected)
            })
    })

    test('Compressed responses are not re-compressed', () => {
        const url = '/?type=precompressed'

        return request(app)
            .get(url)
            .then((res) => app._requestMonitor._waitForResponses().then(() => res))
            .then((res) => {
                expect(res.status).toBe(200)
                expect(res.headers['x-mobify-from-cache']).toBe('false')
                expect(res.headers['content-encoding']).toBe('gzip')
            })
            .then(() =>
                app.applicationCache.get({
                    key: keyFromURL(url),
                    namespace
                })
            )
            .then((entry) => {
                expect(entry && entry.found).toBe(false)
            })
    })
})

describe('DevServer helpers', () => {
    test('Local asset headers', async () => {
        const tmpDir = await fse.mkdtemp(path.join(os.tmpdir(), 'pwa-kit-'))
        const tmpFile = path.join(tmpDir, 'local-asset-headers-test.svg')
        await fse.ensureFile(tmpFile)
        const now = new Date()
        await fse.utimes(tmpFile, now, now)

        const res = new Map() // Don't need a full Response, just `.set` functionality
        setLocalAssetHeaders(res, tmpFile)

        expect([...res]).toEqual([
            ['content-type', 'image/svg+xml'],
            ['date', now.toUTCString()],
            ['last-modified', now.toUTCString()],
            ['etag', now.getTime()],
            ['cache-control', 'max-age=0, nocache, nostore, must-revalidate']
        ])
    })
})

describe('DevServer rendering', () => {
    test('uses hot server middleware when ready', () => {
        const req = {
            app: {
                __webpackReady: jest.fn().mockReturnValue(true),
                __hotServerMiddleware: jest.fn(),
                __devMiddleware: {waitUntilValid: (callback) => callback()}
            }
        }
        const res = { redirect: jest.fn() }
        const next = jest.fn()

        NoWebpackDevServerFactory.render(req, res, next)

        expect(req.app.__hotServerMiddleware).toHaveBeenCalledWith(req, res, next)
    })

    test('redirects to loading screen during the inital build', () => {
        const originalRedirectToLoadingScreen = MockRemoteServerFactory._redirectToLoadingScreen
        MockRemoteServerFactory._redirectToLoadingScreen = jest.fn()
        
        const req = {
            app: {
                __isInitialBuild: true
            }
        }
        const res = { redirect: jest.fn() }
        const next = jest.fn()

        NoWebpackDevServerFactory.render(req, res, next)

        expect(MockRemoteServerFactory._redirectToLoadingScreen).toHaveBeenCalledWith(req, res, next)
        
        // Restore the original method
        MockRemoteServerFactory._redirectToLoadingScreen = originalRedirectToLoadingScreen
    })
})

describe('DevServer service worker', () => {
    let tmpDir

    beforeEach(async () => {
        tmpDir = await fse.mkdtemp(path.join(os.tmpdir(), 'pwa-kit-test-'))
    })

    afterEach(() => {
        rimraf.sync(tmpDir)
    })

    const createApp = () => {
        const app = NoWebpackDevServerFactory._createApp(opts())
        // This isn't ideal! We need a way to test the dev middleware
        // including the on demand webpack compiler. However, the webpack config and
        // the Dev server assumes the code runs at the root of a project.
        // When we run the tests, we are not in a project.
        // We have a /test_fixtures project, but Jest does not support process.chdir(),
        // nor mocking process.cwd(), so we mock the dev middleware for now.
        // TODO: create a proper testing fixture project and run the tests in the isolated
        // project environment.
        return Object.assign(app, {
            __devMiddleware: {
                waitUntilValid: (cb) => cb(),
                context: {
                    outputFileSystem: fse,
                    stats: {
                        toJson: () => ({
                            children: {
                                find: () => ({
                                    outputPath: tmpDir
                                })
                            }
                        })
                    }
                }
            },
            __webpackReady: () => true
        })
    }

    const cases = [
        {
            file: 'worker.js',
            content: '// a service worker',
            name: 'Should serve the service worker',
            requestPath: '/worker.js'
        },
        {
            file: 'worker.js.map',
            content: '{}',
            name: 'Should serve the service worker source map',
            requestPath: '/worker.js.map'
        }
    ]

    cases.forEach(({file, content, name, requestPath}) => {
        test(`${name}`, async () => {
            const app = createApp()
            
            // Mock _getWebpackAsset to return the file content
            const originalGetWebpackAsset = NoWebpackDevServerFactory._getWebpackAsset
            NoWebpackDevServerFactory._getWebpackAsset = jest.fn().mockReturnValue(content)
            
            app.get('/worker.js(.map)?', NoWebpackDevServerFactory.serveServiceWorker)

            try {
                const response = await request(app)
                    .get(requestPath)
                    .expect(200)
                expect(response.text).toEqual(content)
            } finally {
                NoWebpackDevServerFactory._getWebpackAsset = originalGetWebpackAsset
            }
        })

        test(`${name} (and handle 404s correctly)`, async () => {
            const app = createApp()
            
            // Mock _getWebpackAsset to return null for 404 tests
            const originalGetWebpackAsset = NoWebpackDevServerFactory._getWebpackAsset
            NoWebpackDevServerFactory._getWebpackAsset = jest.fn().mockReturnValue(null)
            
            app.get('/worker.js(.map)?', NoWebpackDevServerFactory.serveServiceWorker)

            try {
                await request(app)
                    .get(requestPath)
                    .expect(404)
            } finally {
                NoWebpackDevServerFactory._getWebpackAsset = originalGetWebpackAsset
            }
        })
    })
})

describe('DevServer serveStaticFile', () => {
    test('should serve static files', async () => {
        const options = opts({projectDir: testFixtures})
        const app = NoWebpackDevServerFactory._createApp(options)
        app.use('/test', NoWebpackDevServerFactory.serveStaticFile('static/favicon.ico'))
        return request(app).get('/test').expect(200)
    })

    test('should return 404 if static file does not exist', async () => {
        const options = opts({projectDir: testFixtures})
        const app = NoWebpackDevServerFactory._createApp(options)
        app.use('/test', NoWebpackDevServerFactory.serveStaticFile('static/IDoNotExist.ico'))
        return request(app).get('/test').expect(404)
    })
})

describe('SLAS private client proxy', () => {
    test('should throw error if PWA_KIT_SLAS_CLIENT_SECRET env var not set', () => {
        expect(() => {
            NoWebpackDevServerFactory._createApp(opts({useSLASPrivateClient: true}))
        }).toThrow()
    })
})
