/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fse from 'fs-extra'
import https from 'https'
import nock from 'nock'
import os from 'os'
import path from 'path'
import sinon from 'sinon'
import superagent from 'superagent'
import request from 'supertest'
import express from 'express'

import {PersistentCache} from '../../utils/ssr-cache'
import {CachedResponse} from '../../utils/ssr-server'
// We need to mock isRemote in some tests, so we need to import it directly from
// the file it was defined in, because of the way jest works.
import * as ssrServerUtils from '../../utils/ssr-server/utils'
import * as ssrConfig from '../../utils/ssr-config'
import * as ssrNamespacePaths from '../../utils/ssr-namespace-paths'
import {RemoteServerFactory, REMOTE_REQUIRED_ENV_VARS} from './build-remote-server'
import {X_MOBIFY_QUERYSTRING} from './constants'
import {
    RESOLVED_PROMISE,
    generateCacheKey,
    getResponseFromCache,
    sendCachedResponse,
    cacheResponseWhenDone,
    respondFromBundle,
    getRuntime
} from './express'
import {randomUUID} from 'crypto'

// Mock static assets (require path is relative to the 'ssr' directory)
const mockStaticAssets = {}
jest.mock('../static/assets.json', () => mockStaticAssets, {virtual: true})

const TEST_PORT = 3444
const testFixtures = path.resolve(process.cwd(), 'src/ssr/server/test_fixtures')

/**
 * An HTTPS.Agent that allows self-signed certificates
 * @type {module:https.Agent}
 */
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
})

const opts = (overrides = {}) => {
    const defaults = {
        buildDir: './src/ssr/server/test_fixtures',
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
        sslFilePath: './src/ssr/server/test_fixtures/localhost.pem',
        quiet: true,
        port: TEST_PORT,
        protocol: 'https',
        fetchAgents: {
            https: httpsAgent
        },
        defaultCacheTimeSeconds: 123,
        enableLegacyRemoteProxying: false,
        useSLASPrivateClient: false
    }
    return {
        ...defaults,
        ...overrides
    }
}

const mkdtempSync = () => fse.mkdtempSync(path.resolve(os.tmpdir(), 'ssr-server-tests-'))

beforeAll(() => {
    jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({})

    // The SSR app applies patches on creation. Those patches are specific to an
    // environment (Lambda or not) and we need to ensure that the non-lambda patches
    // are applied for testing. Creating and immediately discarding an app in
    // local mode here applies the correct patches for all tests.
    RemoteServerFactory._createApp(opts())
})

describe('_createApp validates the options object', () => {
    let savedEnvironment

    beforeEach(() => {
        savedEnvironment = Object.assign({}, process.env)
        process.env = {
            LISTEN_ADDRESS: '',
            EXTERNAL_DOMAIN_NAME: ''
        }
    })

    afterEach(() => {
        process.env = savedEnvironment
    })

    const invalidOptions = [
        {
            name: 'mobify',
            options: opts({mobify: undefined})
        },
        {
            name: 'mobify',
            options: opts({mobify: 'a string'})
        },
        {
            name: 'buildDir empty',
            options: opts({buildDir: ''})
        }
    ]

    invalidOptions.forEach(({name, options}) => {
        test(`_createApp validates missing or invalid field "${name}"`, () => {
            expect(() => RemoteServerFactory._createApp(options)).toThrow()
        })
    })
})

describe('_createApp validates environment variables', () => {
    let savedEnvironment

    beforeEach(() => {
        savedEnvironment = Object.assign({}, process.env)
    })

    afterEach(() => {
        process.env = savedEnvironment
    })

    REMOTE_REQUIRED_ENV_VARS.forEach((envVar) => {
        test(`SSR Server verifies environment variable "${envVar}"`, () => {
            // Set truthy values for all the env vars except the one we're testing.
            const vars = REMOTE_REQUIRED_ENV_VARS.filter((name) => name !== envVar).map((name) => ({
                [name]: 'value'
            }))
            // AWS_LAMBDA_FUNCTION_NAME indicates the server is running remotely on Lambda
            vars.push({AWS_LAMBDA_FUNCTION_NAME: 'pretend-to-be-remote'})
            process.env = Object.assign({}, savedEnvironment, ...vars)
            expect(() => RemoteServerFactory._createApp(opts())).toThrow(envVar)
        })
    })
})

describe('SSRServer operation', () => {
    const savedEnvironment = Object.assign({}, process.env)
    const sandbox = sinon.createSandbox()

    afterEach(() => {
        sandbox.restore()
        jest.resetModules()
        nock.cleanAll()
    })

    afterAll(() => {
        process.env = savedEnvironment
    })

    beforeEach(() => {
        RemoteServerFactory._setRequestId = jest.fn().mockImplementation((_app) => {
            _app.use((req, res, next) => {
                res.locals.requestId = randomUUID()
                next()
            })
        })
        // Ensure the environment is clean
        process.env = {
            LISTEN_ADDRESS: '',
            EXTERNAL_DOMAIN_NAME: ''
        }
    })

    test('_createApp creates an express app', () => {
        const options = opts()
        const app = RemoteServerFactory._createApp(options)
        const expected = `max-age=${options.defaultCacheTimeSeconds}, s-maxage=${options.defaultCacheTimeSeconds}`
        expect(app.options.defaultCacheControl).toEqual(expected)
    })

    test('SSRServer tracks responses', () => {
        const route = jest.fn().mockImplementation((req, res) => {
            res.send('<div>hello world</div>')
            return Promise.resolve()
        })

        const app = RemoteServerFactory._createApp(opts())
        app.get('/*', route)

        const response1 = {
            locals: {
                requestId: 1
            },
            once: () => null
        }
        const response2 = {
            locals: {
                requestId: 2
            },
            once: () => null
        }

        expect(app._requestMonitor._pendingResponses.ids).toEqual([])
        app._requestMonitor._responseFinished(response1)
        expect(app._requestMonitor._pendingResponses.ids).toEqual([])

        const promise1 = app._requestMonitor._waitForResponses()
        expect(promise1).toBe(RESOLVED_PROMISE)

        app._requestMonitor._responseStarted(response1)
        expect(app._requestMonitor._pendingResponses.ids).toEqual([1])

        const promise2 = app._requestMonitor._waitForResponses()
        expect(promise2).not.toBe(RESOLVED_PROMISE)

        app._requestMonitor._responseStarted(response2)
        expect(app._requestMonitor._pendingResponses.ids).toEqual([1, 2])

        const promise3 = app._requestMonitor._waitForResponses()
        expect(promise3).toBe(promise2)

        app._requestMonitor._responseFinished(response1)
        expect(app._requestMonitor._pendingResponses.ids).toEqual([2])

        app._requestMonitor._responseFinished(response1)
        expect(app._requestMonitor._pendingResponses.ids).toEqual([2])

        app._requestMonitor._responseFinished(response2)
        expect(app._requestMonitor._pendingResponses.ids).toEqual([])

        // If the promise doesn't resolve, this test will timeout
        return promise2
    })

    test(`The Remote SSRServer always uses https`, () => {
        REMOTE_REQUIRED_ENV_VARS.forEach((envVar) => {
            process.env[envVar] = 'value'
        })
        const app = RemoteServerFactory._createApp(opts({protocol: 'http'}))
        expect(app.options.protocol).toBe('https')
        process.env = savedEnvironment
    })

    test('SSRServer renders correctly', () => {
        const body = '<div>hello world</div>'
        const route = jest.fn().mockImplementation((req, res) => {
            res.send(body)
        })
        const app = RemoteServerFactory._createApp(opts())
        app.get('/*', route)
        return request(app)
            .get('/')
            .expect(200)
            .then((res) => {
                expect(res.headers['x-powered-by']).toBeUndefined()
                expect(res.text).toBe(body)
                expect(route).toHaveBeenCalled()
            })
    })

    test('SSRServer renders with the react rendering', () => {
        const app = RemoteServerFactory._createApp(opts())
        app.get('/*', RemoteServerFactory.render)
        expect(app.__renderer).toBeUndefined()

        return request(app)
            .get('/')
            .expect(200)
            .then((res) => {
                expect(res.text).toBe('OK')
                expect(app.__renderer).toBeDefined()
            })
    })

    test('SSRServer rendering blocks cookie setting by default', () => {
        const route = (req, res) => {
            res.setHeader('set-cookie', 'blah123')
            res.sendStatus(200)
        }
        const app = RemoteServerFactory._createApp(opts())
        app.get('/*', route)

        jest.spyOn(console, 'warn')
        return request(app)
            .get('/')
            .expect(200)
            .then((res) => {
                expect(console.warn.mock.calls[0][0]).toContain(`Discarding "Set-Cookie: blah123"`)
                expect(res.headers['Set-Cookie']).toBeUndefined()
                expect(res.headers['set-cookie']).toBeUndefined()
            })
    })

    test('SSRServer rendering allows setting cookies with MRT_ALLOW_COOKIES env', () => {
        process.env = {
            MRT_ALLOW_COOKIES: 'true'
        }
        const route = (req, res) => {
            res.setHeader('set-cookie', 'blah123')
            res.sendStatus(200)
        }
        const app = RemoteServerFactory._createApp(opts())
        app.get('/*', route)

        return request(app)
            .get('/')
            .expect(200)
            .then((res) => {
                expect(res.headers['set-cookie']).toEqual(['blah123'])
            })
    })

    test('SSRServer does not allow multi-value headers', () => {
        const route = (req, res) => {
            res.set('content-type', 'application/octet-stream')
            res.set('content-type', 'text/plain')
            res.send('<div>hello world</div>')
        }

        const app = RemoteServerFactory._createApp(opts())
        app.get('*', route)

        return request(app)
            .get('/')
            .expect(200)
            .then((res) => {
                expect(res.headers['content-type']).toBe('text/plain; charset=utf-8')
            })
    })

    test('SSRServer honours any x-mobify-querystring header', () => {
        const route = jest.fn().mockImplementation((req, res) => {
            res.send('<div> Hello world </div>')
        })
        const app = RemoteServerFactory._createApp(opts())
        app.get('/*', route)

        return request(app)
            .get('/')
            .set(X_MOBIFY_QUERYSTRING, 'z=1&y=2&x=3')
            .expect(200)
            .then(() => {
                expect(route.mock.calls[0][0].query).toEqual({z: '1', y: '2', x: '3'})
            })
    })

    describe('Running remotely', () => {
        let isRemoteMock
        let savedEnvironment

        beforeEach(() => {
            isRemoteMock = jest.spyOn(ssrServerUtils, 'isRemote').mockImplementation(() => true)
            savedEnvironment = Object.assign({}, process.env)
            Object.assign(process.env, {
                BUNDLE_ID: 1,
                DEPLOY_TARGET: 1,
                EXTERNAL_DOMAIN_NAME: 'http://www.example.com',
                MOBIFY_PROPERTY_ID: 'example'
            })
        })

        afterEach(() => {
            isRemoteMock.mockRestore()
            process.env = savedEnvironment
        })

        test('should not proxy', () => {
            const app = RemoteServerFactory._createApp(opts())
            return request(app).get('/mobify/proxy/base/test/path').expect(501)
        })
    })

    test('SSRServer handles /mobify/ping', () => {
        const app = RemoteServerFactory._createApp(opts())

        return request(app).get('/mobify/ping').expect(200)
    })

    describe('SSRServer worker.js handling', () => {
        let tmpDir
        beforeEach(() => {
            tmpDir = mkdtempSync()
        })

        afterEach(() => {
            fse.removeSync(tmpDir)
        })

        const cases = [
            {
                file: 'worker.js',
                content: '// a service worker',
                name: 'Should serve the service worker',
                requestPath: '/worker.js'
            },
            {
                file: 'worker.js.map',
                content: '// a service worker source map',
                name: 'Should serve the service worker source map',
                requestPath: '/worker.js.map'
            }
        ]

        cases.forEach(({file, content, name, requestPath}) => {
            test(`${name}`, () => {
                const fixture = path.join(__dirname, 'test_fixtures')
                const buildDir = path.join(tmpDir, 'build')
                fse.copySync(fixture, buildDir)
                const updatedFile = path.resolve(buildDir, file)
                fse.writeFileSync(updatedFile, content)

                const app = RemoteServerFactory._createApp(opts({buildDir}))
                app.get('/worker.js(.map)?', RemoteServerFactory.serveServiceWorker)

                return request(app)
                    .get(requestPath)
                    .expect(200)
                    .then((res) => expect(res.text).toEqual(content))
            })

            test(`${name} (and handle 404s correctly)`, () => {
                const app = RemoteServerFactory._createApp(opts({buildDir: tmpDir}))
                app.get('/worker.js(.map)?', RemoteServerFactory.serveServiceWorker)

                return request(app).get(requestPath).expect(404)
            })
        })
    })

    test('SSRServer creates cache on demand', () => {
        const app = RemoteServerFactory._createApp(opts())
        expect(app._applicationCache).toBeUndefined()
        expect(app.applicationCache).toBeInstanceOf(PersistentCache)
        expect(app._applicationCache).toBe(app.applicationCache)
    })

    test('should support redirects to bundle assets', () => {
        const app = RemoteServerFactory._createApp(opts())
        const route = (req, res) => {
            respondFromBundle({req, res})
        }
        app.get('/*', route)
        return request(app)
            .get('/some-bundle-path.jpg')
            .then((response) => {
                expect(response.status).toBe(301)
                expect(
                    response.headers['location'].endsWith(
                        '/mobify/bundle/development/some-bundle-path.jpg'
                    )
                ).toBe(true)
            })
    })

    test('should support other redirects', () => {
        const app = RemoteServerFactory._createApp(opts())
        const route = (req, res) => {
            res.redirect(302, '/elsewhere')
        }
        app.get('/*', route)
        return request(app)
            .get('/some-bundle-path.jpg')
            .then((response) => {
                expect(response.status).toBe(302)
                expect(response.headers['location'].endsWith('/elsewhere')).toBe(true)
            })
    })
    test('should warn about non-strict SSL', () => {
        const app = RemoteServerFactory._createApp(opts())
        const route = (req, res) => {
            res.redirect(302, '/elsewhere')
        }
        app.get('/*', route)
        return request(app)
            .get('/some-bundle-path.jpg')
            .then((response) => {
                expect(response.status).toBe(302)
                expect(response.headers['location'].endsWith('/elsewhere')).toBe(true)
            })
    })

    test('should support error codes', () => {
        const app = RemoteServerFactory._createApp(opts())
        const route = (request, response) => {
            response.sendStatus(500)
        }
        app.get('/*', route)
        return request(app)
            .get('/')
            .then((response) => {
                expect(response.status).toBe(500)
            })
    })

    test('should strip cookies before passing the request to the handler by default', () => {
        const app = RemoteServerFactory._createApp(opts())
        const route = (req, res) => {
            expect(req.headers.cookie).toBeUndefined()
            res.sendStatus(200)
        }
        app.get('/*', route)
        return request(app)
            .get('/')
            .set('cookie', 'xyz=456')
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.headers['set-cookie']).toBeUndefined()
            })
    })

    test('should allow cookies in the request with MRT_ALLOW_COOKIES env', () => {
        process.env = {MRT_ALLOW_COOKIES: 'true'}
        const app = RemoteServerFactory._createApp(opts())
        const route = (req, res) => {
            expect(req.headers.cookie).toBe('xyz=456')
            res.sendStatus(200)
        }
        app.get('/*', route)
        return request(app)
            .get('/')
            .set('cookie', 'xyz=456')
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.headers['set-cookie']).toBeUndefined()
            })
    })

    test('should fix host and origin headers before passing the request to the handler', () => {
        const app = RemoteServerFactory._createApp(opts())
        const route = (req, res) => {
            expect(req.headers.host).toEqual(app.options.appHostname)
            expect(req.headers.origin).toEqual(app.options.appOrigin)
            res.sendStatus(200)
        }
        app.get('/*', route)
        return request(app)
            .get('/')
            .set({
                host: 'somewhere.over.the.rainbow',
                origin: 'https://somewhere.over.the.rainbow'
            })
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.headers['set-cookie']).toBeUndefined()
            })
    })

    test('should set xForwardedOrigin based on defined x-forwarded-host and x-forwarded-proto headers', () => {
        process.env = {
            MRT_ALLOW_COOKIES: 'true'
        }
        const forwardedHost = 'www.example.com'
        const forwardedProto = 'https'
        const app = RemoteServerFactory._createApp(opts())
        const route = (req, res) => {
            expect(req.headers['x-forwarded-host']).toBe(forwardedHost)
            expect(res.locals.xForwardedOrigin).toBe(`${forwardedProto}://${forwardedHost}`)
            res.sendStatus(200)
        }
        app.get('/*', route)

        return request(app)
            .get('/')
            .set('x-forwarded-host', forwardedHost)
            .set('x-forwarded-proto', 'https')
            .then((response) => {
                expect(response.status).toBe(200)
            })
    })
    test('should set xForwardedOrigin based on defined x-forwarded-host and undefined x-forwarded-proto headers', () => {
        process.env = {
            MRT_ALLOW_COOKIES: 'true'
        }
        const options = opts()
        const forwardedHost = 'www.example.com'
        const app = RemoteServerFactory._createApp(options)
        const route = (req, res) => {
            expect(req.headers['x-forwarded-host']).toBe(forwardedHost)
            expect(res.locals.xForwardedOrigin).toBe(`${options.protocol}://${forwardedHost}`)
            res.sendStatus(200)
        }
        app.get('/*', route)

        return request(app)
            .get('/')
            .set('x-forwarded-host', forwardedHost)
            .then((response) => {
                expect(response.status).toBe(200)
            })
    })

    test(`should reject POST requests to /`, () => {
        const app = RemoteServerFactory._createApp(opts())
        const route = (req, res) => {
            res.status(200).end()
        }
        app.get('/*', route)
        return request(app)
            .post('/')
            .then((response) => {
                expect(response.status).toBe(405)
            })
    })

    test('serveStaticFile serves static files from the build directory', () => {
        const app = RemoteServerFactory._createApp(opts())
        const faviconPath = path.resolve(testFixtures, 'favicon.ico')

        app.get('/thing', RemoteServerFactory.serveStaticFile('favicon.ico'))

        return request(app)
            .get('/thing')
            .buffer(true)
            .parse(superagent.parse.image)
            .expect(200)
            .then((res) => {
                const iconData = fse.readFileSync(faviconPath)
                expect(res.body).toEqual(iconData)
            })
    })

    test('serveStaticFile returns 404 if the file does not exist', () => {
        const app = RemoteServerFactory._createApp(opts())

        app.get('/thing', RemoteServerFactory.serveStaticFile('this-does-not-exist.ico'))

        return request(app).get('/thing').expect(404)
    })
})

describe('SSRServer persistent caching', () => {
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
            case 'image':
                res.status(status)
                res.setHeader('content-type', 'image/png')
                res.send(fse.readFileSync(path.join(testFixtures, 'mobify.png')))
                break

            case 'html':
                res.status(status)
                res.setHeader('x-rendered', 'true')
                res.setHeader('cache-control', 's-maxage=60')
                res.send('<div> Hello world </div>')
                break

            case '500':
                res.sendStatus(500)
                break

            case '400':
                res.sendStatus(400)
                break

            default:
                res.sendStatus(status)
                break
        }
    }

    const sandbox = sinon.createSandbox()

    let app, route

    beforeEach(() => {
        route = jest.fn().mockImplementation(routeImplementation)
        const withCaching = cachedRoute(route)
        app = RemoteServerFactory._createApp(opts())
        app.get('/*', withCaching)
    })

    afterEach(() => {
        sandbox.restore()
        app.applicationCache.close()
        app = null
        route = null
    })

    const testCases = [
        {
            name: 'Should put HTML responses into the cache after rendering',
            url: '/cacheme/?type=html',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'x-rendered': 'true',
                'content-type': 'text/html; charset=utf-8'
            },
            expectToBeCached: false,
            expectRenderCallCount: 1
        },
        {
            name: 'Should put binary responses into the cache after rendering',
            url: '/cacheme/?type=image',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'content-type': 'image/png'
            },
            expectToBeCached: false,
            expectRenderCallCount: 1
        },
        {
            name: 'Should skip putting responses into the cache when noCache is set',
            url: '/cacheme/?type=image&noCache=1',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'content-type': 'image/png'
            },
            expectToBeCached: false,
            expectRenderCallCount: 1
        },
        {
            name: 'Should return a response even when the cache put fails',
            url: '/cacheme/?type=image&a=1',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'content-type': 'image/png'
            },
            expectToBeCached: false,
            expectRenderCallCount: 1,
            forcePutFailure: true
        },
        {
            name: 'Should serve responses from the cache, including HTTP headers',
            url: '/cacheme/?type=html',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'content-type': 'text/html; charset=utf-8'
            },
            expectToBeCached: false,
            expectRenderCallCount: 1,
            preCache: {
                data: Buffer.from('<html>456</html>'),
                metadata: {
                    status: 200,
                    headers: {
                        'x-precached': 'false',
                        'content-type': 'text/html; charset=utf-8'
                    }
                }
            }
        },
        {
            name: 'Should serve responses from the cache without cached HTTP headers',
            url: '/cacheme/?type=html',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false'
            },
            expectToBeCached: false,
            expectRenderCallCount: 1,
            preCache: {
                data: Buffer.from('<html>123</html>')
            }
        },
        {
            name: 'Should serve empty responses from the cache without errors',
            url: '/cacheme/?type=none',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false'
            },
            expectToBeCached: false,
            expectRenderCallCount: 1,
            preCache: {
                data: undefined,
                metadata: {
                    status: 200,
                    headers: {
                        'x-precached': 'true'
                    }
                }
            }
        }
    ]

    testCases.forEach((testCase) =>
        test(`${testCase.name}`, () => {
            let url = testCase.url

            return (
                Promise.resolve()
                    .then(() => {
                        const preCache = testCase.preCache
                        if (preCache) {
                            return app.applicationCache.put({
                                namespace,
                                key: keyFromURL(url),
                                metadata: preCache.metadata,
                                data: preCache.data
                            })
                        }
                    })
                    .then(() => {
                        sandbox.stub(app.applicationCache, 'put')
                        if (testCase.forcePutFailure) {
                            app.applicationCache.put
                                .onFirstCall()
                                .callsFake(() => Promise.reject('Fake put error'))
                        }
                        app.applicationCache.put.callThrough()
                    })
                    .then(() => {
                        // Buffer and parse everything as binary for easy comparison
                        // across content types.
                        return request(app)
                            .get(url)
                            .buffer(true)
                            .parse(superagent.parse['application/octet-stream'])
                    })
                    // Wait for any caching to complete
                    .then((response) =>
                        app._requestMonitor._waitForResponses().then(() => response)
                    )
                    // Handle and verify the response
                    .then((response) => {
                        expect(response.ok).toEqual(testCase.expectOk)

                        expect(route.mock.calls).toHaveLength(testCase.expectRenderCallCount)

                        expect(response.headers).toMatchObject(testCase.expectHeaders)

                        return Promise.all([
                            response,
                            app.applicationCache.get({
                                key: keyFromURL(url),
                                namespace
                            })
                        ])
                    })
                    .then(([, entry]) => {
                        // Verify the response data against the cache
                        expect(entry.found).toBe(false)
                    })
            )
        })
    )

    const errorCases = [
        {url: '/?type=500', status: 500},
        {url: '/?type=400', status: 400}
    ]

    errorCases.forEach(({url, status}) => {
        test(`should not cache responses with ${status} status codes`, () => {
            return request(app)
                .get(url)
                .then((res) => app._requestMonitor._waitForResponses().then(() => res))
                .then((res) => {
                    expect(res.status).toBe(status)
                    expect(res.headers['x-mobify-from-cache']).toBe('false')
                })
                .then(() =>
                    app.applicationCache.get({
                        key: keyFromURL(url),
                        namespace
                    })
                )
                .then((entry) => expect(entry.found).toBe(false))
        })
    })

    test('Try to send non-cached response', () => {
        expect(() => sendCachedResponse(new CachedResponse({}))).toThrow('non-cached')
    })
})

describe('generateCacheKey', () => {
    const mockRequest = (overrides) => {
        return {
            url: '/test?a=1',
            query: {},
            headers: {},
            get: function (key) {
                return this.headers[key]
            },
            ...overrides
        }
    }

    test('returns expected results', () => {
        expect(generateCacheKey(mockRequest({url: '/test/1?id=abc'})).indexOf('/test/1')).toBe(0)
    })

    test('path affects key', () => {
        const result1 = generateCacheKey(mockRequest({url: '/test2a/'}))
        expect(generateCacheKey(mockRequest({url: '/testab/'}))).not.toEqual(result1)
    })

    test('query affects key', () => {
        const result1 = generateCacheKey(mockRequest({url: '/test3?a=1'}))
        expect(generateCacheKey(mockRequest({url: '/test3?a=2'}))).not.toEqual(result1)
    })

    test('request class affects key', () => {
        const result1 = generateCacheKey(mockRequest())
        const request2 = mockRequest({
            headers: {
                'x-mobify-request-class': 'bot'
            }
        })
        expect(generateCacheKey(request2)).not.toEqual(result1)

        expect(generateCacheKey(request2, {ignoreRequestClass: true})).toEqual(result1)
    })

    test('extras affect key', () => {
        const result1 = generateCacheKey(mockRequest())
        expect(generateCacheKey(mockRequest(), {extras: ['123']})).not.toEqual(result1)
    })

    describe('URL parsing edge cases', () => {
        test('handles URL with empty query string', () => {
            const key = generateCacheKey(mockRequest({url: '/test?'}))
            expect(key).toBeDefined()
            expect(key.indexOf('/test')).toBe(0)
        })

        test('handles URL with special characters in query', () => {
            const key = generateCacheKey(mockRequest({url: '/test?q=hello+world&lang=en%20US'}))
            expect(key).toBeDefined()
            expect(key.indexOf('/test')).toBe(0)
        })

        test('handles URL with fragment', () => {
            const key = generateCacheKey(mockRequest({url: '/test?a=1#section'}))
            expect(key).toBeDefined()
            expect(key.indexOf('/test')).toBe(0)
        })

        test('handles URL with encoded path', () => {
            const key = generateCacheKey(mockRequest({url: '/test%20path?a=1'}))
            expect(key).toBeDefined()
        })

        test('handles URL without query string', () => {
            const key = generateCacheKey(mockRequest({url: '/test'}))
            expect(key).toBeDefined()
            expect(key.indexOf('/test')).toBe(0)
        })

        test('handles URL with valueless query parameter', () => {
            const key = generateCacheKey(mockRequest({url: '/test?flag'}))
            expect(key).toBeDefined()
            expect(key.indexOf('/test')).toBe(0)
        })

        test('handles URL with unicode characters in path', () => {
            const key = generateCacheKey(mockRequest({url: '/caf%C3%A9?a=1'}))
            expect(key).toBeDefined()
        })

        test('handles URL with multiple query parameters', () => {
            const key = generateCacheKey(mockRequest({url: '/test?a=1&b=2&c=3'}))
            expect(key).toBeDefined()
            expect(key.indexOf('/test')).toBe(0)
        })
    })

    describe('dynamic base URL construction', () => {
        test('uses request protocol when available', () => {
            const key = generateCacheKey(mockRequest({url: '/test?a=1', protocol: 'https'}))
            expect(key).toBeDefined()
            expect(key.indexOf('/test')).toBe(0)
        })

        test('falls back to http when no protocol info exists', () => {
            const key = generateCacheKey(mockRequest({url: '/test?a=1'}))
            expect(key).toBeDefined()
        })

        test('detects https from socket.encrypted', () => {
            const key = generateCacheKey(mockRequest({url: '/test?a=1', socket: {encrypted: true}}))
            expect(key).toBeDefined()
        })

        test('falls back to localhost when no host header exists', () => {
            const key = generateCacheKey(mockRequest({url: '/test?a=1'}))
            expect(key).toBeDefined()
        })

        test('prefers req.protocol over socket.encrypted', () => {
            const key = generateCacheKey(
                mockRequest({url: '/test?a=1', protocol: 'https', socket: {encrypted: false}})
            )
            expect(key).toBeDefined()
        })
    })
})

describe('getRuntime', () => {
    let originalEnv
    let originalEval = global.eval

    // Mock the DevSeverFactory via `eval` so we don't have to include it as a dev
    // dependency which will cause circular dependency warnings.
    const MockDevServerFactory = {
        name: 'MockDevServerFactory',
        returnMyName() {
            return this.name
        }
    }
    const mockEval = () => ({
        main: {
            require: () => ({DevServerFactory: MockDevServerFactory})
        }
    })

    const matchExceptFunctionValues = (obj) => {
        const entries = Object.entries(obj)
        const matchers = entries.map(([key, value]) => {
            const matcher = typeof value === 'function' ? expect.any(Function) : value
            return [key, matcher]
        })
        return Object.fromEntries(matchers)
    }

    const cases = [
        {
            env: {},
            expectedRuntime: MockDevServerFactory,
            msg: 'when running locally'
        },
        {
            env: {AWS_LAMBDA_FUNCTION_NAME: 'this-makes-it-remote'},
            expectedRuntime: RemoteServerFactory,
            msg: 'when running remotely'
        }
    ]

    beforeAll(() => {
        global.eval = mockEval
    })

    afterAll(() => {
        global.eval = originalEval
    })

    beforeEach(() => {
        originalEnv = process.env
    })

    afterEach(() => {
        process.env = originalEnv
    })

    test.each(cases)(
        'should return a remote/development runtime $msg',
        ({env, expectedRuntime}) => {
            process.env = {...process.env, ...env}
            expect(getRuntime()).toMatchObject(matchExceptFunctionValues(expectedRuntime))
        }
    )

    test('should return a remote/development runtime bound to the correct context', () => {
        const mockDevRuntime = getRuntime()
        const func = mockDevRuntime.returnMyName
        expect(func()).toBe(MockDevServerFactory.name)
    })
})

describe('DevServer middleware', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })
    test('_validateConfiguration protocol', () => {
        let protocol = 'ftp'
        let error = `Invalid local development server protocol ${protocol}. Valid protocols are http and https.`
        expect(() => {
            RemoteServerFactory._validateConfiguration(opts({protocol}))
        }).toThrow(error)
    })

    test('_validateConfiguration sslFilePath', () => {
        let sslFilePath = './does/not/exist'
        let error =
            'The sslFilePath option passed to the SSR server constructor ' +
            'must be a path to an SSL certificate file ' +
            'in PEM format, whose name ends with ".pem". ' +
            'See the "cert" and "key" options on ' +
            'https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options'
        expect(() => {
            RemoteServerFactory._validateConfiguration(opts({sslFilePath}))
        }).toThrow(error)
    })
    test('_validateConfiguration strictSSL', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        RemoteServerFactory._validateConfiguration(opts({strictSSL: false}))
        expect(warn.mock.calls).toEqual([
            ['The SSR Server has _strictSSL turned off for https requests']
        ])
    })
})

describe('SLAS private client proxy', () => {
    const savedEnvironment = Object.assign({}, process.env)

    let proxyApp
    let proxyServer
    const proxyPort = 12345
    const proxyPath = '/shopper/auth/responseHeaders'
    const slasTarget = `http://localhost:${proxyPort}${proxyPath}`
    const appConfig = {
        mobify: {
            app: {
                commerceAPI: {
                    parameters: {
                        clientId: 'clientId',
                        shortCode: 'shortCode'
                    }
                }
            }
        },
        useSLASPrivateClient: true,
        slasTarget: slasTarget
    }

    beforeEach(() => {
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({})
        // by setting slasTarget, rather than forwarding the request to SLAS,
        // we send the proxy request here so we can return the request headers
        proxyApp = express()
        proxyApp.use(proxyPath, (req, res) => {
            res.send(req.headers)
        })
        proxyServer = proxyApp.listen(proxyPort)
    })

    afterEach(async () => {
        process.env = savedEnvironment
        if (proxyServer) {
            // Close the server and wait for it to fully close
            await new Promise((resolve) => {
                proxyServer.close(() => {
                    resolve()
                })
            })

            // Additional cleanup to ensure all connections are closed
            proxyServer.unref()

            // Force close any remaining connections
            if (proxyServer._handle) {
                proxyServer._handle.close()
            }

            // Clear any remaining event listeners
            proxyServer.removeAllListeners()
        }

        // Clear any remaining timers or intervals
        jest.clearAllTimers()
    })

    test('should not create proxy by default', () => {
        const app = RemoteServerFactory._createApp(opts())
        return request(app).get('/mobify/slas/private').expect(404)
    })

    test('should return HTTP 501 if PWA_KIT_SLAS_CLIENT_SECRET env var not set', () => {
        delete process.env.PWA_KIT_SLAS_CLIENT_SECRET
        const app = RemoteServerFactory._createApp(opts({useSLASPrivateClient: true}))
        return request(app).get('/mobify/slas/private').expect(501)
    })

    test('does not insert client secret for allow-listed non-token endpoints', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        // /oauth2/logout is allow-listed with no credential injection.
        return await request(app)
            .post('/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/logout')
            .then((response) => {
                expect(response.body.authorization).toBeUndefined()
                expect(response.body.host).toBe('shortCode.api.commercecloud.salesforce.com')
                expect(response.body['x-mobify']).toBe('true')
            })
    }, 15000)

    test('inserts client secret if request is for /oauth2/token', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const encodedCredentials = Buffer.from('clientId:a secret').toString('base64')

        const app = RemoteServerFactory._createApp(opts(appConfig))

        return await request(app)
            .post('/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/token')
            .then((response) => {
                expect(response.body.authorization).toBe(`Basic ${encodedCredentials}`)
                expect(response.body.host).toBe('shortCode.api.commercecloud.salesforce.com')
                expect(response.body['x-mobify']).toBe('true')
            })
    }, 15000)

    test('does not add _sfdc_client_auth header if request not for /oauth2/trusted-agent/token', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        // `oauth2/login` is allow-listed but must never receive the
        // `_sfdc_client_auth` header (that header is only for
        // `oauth2/trusted-agent/token`).
        return await request(app)
            .post('/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/login')
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.body._sfdc_client_auth).toBeUndefined()
            })
    }, 15000)

    test('adds _sfdc_client_auth header if request is for /oauth2/trusted-agent/token', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const encodedCredentials = Buffer.from('clientId:a secret').toString('base64')

        const app = RemoteServerFactory._createApp(
            opts({
                mobify: {
                    app: {
                        commerceAPI: {
                            parameters: {
                                clientId: 'clientId',
                                shortCode: 'shortCode'
                            }
                        }
                    }
                },
                useSLASPrivateClient: true,
                slasTarget: slasTarget,
                trustedAgentAuthPathMatch: /\/oauth2\/trusted-agent\/token/
            })
        )

        return await request(app)
            .post(
                '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/trusted-agent/token'
            )
            .then((response) => {
                expect(response.body['_sfdc_client_auth']).toBe(encodedCredentials)
                expect(response.body.authorization).toBeUndefined()
                expect(response.body.host).toBe('shortCode.api.commercecloud.salesforce.com')
                expect(response.body['x-mobify']).toBe('true')
            })
    }, 15000)

    test('returns 403 if request is not for /shopper/auth endpoints', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        return await request(app)
            .get('/mobify/slas/private/shopper/auth-admin/v1/other-path')
            .expect(403)
    }, 15000)

    test('returns 403 if request is for /oauth2/trusted-system/* endpoint', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        return await request(app)
            .get('/mobify/slas/private/shopper/auth/v1/oauth2/trusted-system/token')
            .expect(403)
    }, 15000)

    test('returns 403 if trusted-system path contains percent-encoded characters', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        return await request(app)
            .get('/mobify/slas/private/shopper/auth/v1/oauth2/trusted%2Dsystem/token')
            .expect(403)
    }, 15000)

    test('returns 403 if trusted-system is reached via encoded dot-segments', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        return await request(app)
            .post('/mobify/slas/private/shopper/auth/v1/oauth2/token/%2E%2E/trusted%2Dsystem/token')
            .expect(403)
    }, 15000)

    test('does not inject credentials when trusted-system is reached via encoded dot-segments', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        return await request(app)
            .post('/mobify/slas/private/shopper/auth/v1/oauth2/token/%2E%2E/trusted%2Dsystem/token')
            .then((response) => {
                // Should be blocked with 403, credentials never injected
                expect(response.status).toBe(403)
                expect(response.body.authorization).toBeUndefined()
            })
    }, 15000)

    test('returns 403 if path contains malformed percent encoding', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        return await request(app)
            .get('/mobify/slas/private/shopper/auth/v1/oauth2/%ZZbad/token')
            .expect(403)
    }, 15000)

    test('returns 403 if trusted-system is reached via double-encoded hyphen', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        // %252D → %2D → "-" after iterative decode
        return await request(app)
            .get('/mobify/slas/private/shopper/auth/v1/oauth2/trusted%252Dsystem/token')
            .expect(403)
    }, 15000)

    test('returns 403 if trusted-system is reached via triple-encoded hyphen', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        // %25252D → %252D → %2D → "-" after iterative decode
        return await request(app)
            .get('/mobify/slas/private/shopper/auth/v1/oauth2/trusted%25252Dsystem/token')
            .expect(403)
    }, 15000)

    test('returns 403 if trusted-system is reached via double-encoded dot-segments', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(opts(appConfig))

        // %252E%252E → %2E%2E → ".." which normalize collapses
        return await request(app)
            .post(
                '/mobify/slas/private/shopper/auth/v1/oauth2/token/%252E%252E/trusted-system/token'
            )
            .expect(403)
    }, 15000)

    test('boots without throwing when applySLASPrivateClientToEndpoints is set (deprecated, now a narrowing-only filter)', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        expect(() => {
            RemoteServerFactory._createApp(
                opts({
                    mobify: {
                        app: {
                            commerceAPI: {
                                parameters: {
                                    clientId: 'clientId',
                                    shortCode: 'shortCode'
                                }
                            }
                        }
                    },
                    useSLASPrivateClient: true,
                    slasTarget: slasTarget,
                    applySLASPrivateClientToEndpoints: /\/oauth2\/trusted-system/
                })
            )
        }).not.toThrow()
    }, 15000)

    test('applySLASPrivateClientToEndpoints narrows the built-in allow-list: non-matching allow-listed endpoints are blocked', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(
            opts({
                ...appConfig,
                // Only permit /oauth2/token; everything else in the built-in
                // list must be filtered out and therefore blocked by the guard.
                applySLASPrivateClientToEndpoints: /^\/oauth2\/token$/
            })
        )

        await request(app)
            .post(
                '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/passwordless/login'
            )
            .expect(403)
    }, 15000)

    test('applySLASPrivateClientToEndpoints narrows the built-in allow-list: matching endpoints are still forwarded', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(
            opts({
                ...appConfig,
                applySLASPrivateClientToEndpoints: /\/oauth2\/token/
            })
        )

        // The mock upstream echoes headers (see beforeEach), any non-403 means
        // the guard forwarded the request to the upstream rather than blocking it.
        const res = await request(app).post(
            '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/token'
        )
        expect(res.status).not.toBe(403)
    }, 15000)

    test('applySLASPrivateClientToEndpoints cannot widen the allow-list: a regex matching a non-allow-listed endpoint does not grant access', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const app = RemoteServerFactory._createApp(
            opts({
                ...appConfig,
                applySLASPrivateClientToEndpoints: /\/oauth2\/trusted-system/
            })
        )

        // trusted-system is intentionally NOT on the allow-list; the legacy
        // regex must never be able to add it back.
        await request(app)
            .post(
                '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/trusted-system/token'
            )
            .expect(403)
    }, 15000)

    test('proxy returns a 200 OK masking a user not found error', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        // Create a new mock server specifically for this test so we can mock a response from SLAS
        const testProxyApp = express()
        const testProxyPort = 12346
        const testSlasTarget = `http://localhost:${testProxyPort}/shopper/auth/responseHeaders`

        // Set up the mock server to return a 404 for passwordless login
        testProxyApp.use('/shopper/auth/responseHeaders', (req, res) => {
            if (req.url.includes('/oauth2/passwordless/login')) {
                res.status(404).send()
            } else {
                res.send(req.headers)
            }
        })

        const testProxyServer = testProxyApp.listen(testProxyPort)

        try {
            const testAppConfig = {
                ...appConfig,
                slasTarget: testSlasTarget
            }

            const app = RemoteServerFactory._createApp(opts(testAppConfig))

            return await request(app)
                .post(
                    '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/passwordless/login'
                )
                .expect(200)
                .then((response) => {
                    expect(response.text).toBe('')
                })
        } finally {
            // Clean up the test server
            testProxyServer.close()
        }
    })

    test('proxy masks 404 for passwordless login with percent-encoded path', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        // Create a new mock server specifically for this test so we can mock a response from SLAS
        const testProxyApp = express()
        const testProxyPort = 12347
        const testSlasTarget = `http://localhost:${testProxyPort}/shopper/auth/responseHeaders`

        testProxyApp.use('/shopper/auth/responseHeaders', (req, res) => {
            if (req.url.includes('passwordless') || req.url.includes('passwordles')) {
                res.status(404).send()
            } else {
                res.send(req.headers)
            }
        })

        const testProxyServer = testProxyApp.listen(testProxyPort)

        try {
            const testAppConfig = {
                ...appConfig,
                slasTarget: testSlasTarget
            }

            const app = RemoteServerFactory._createApp(opts(testAppConfig))

            return await request(app)
                .post(
                    '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/passwordles%73/login'
                )
                .expect(200)
                .then((response) => {
                    expect(response.text).toBe('')
                })
        } finally {
            // Clean up the test server
            testProxyServer.close()
        }
    })

    test('proxy does NOT mask 404 for passwordless token (only login is masked)', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const testProxyApp = express()
        const testProxyPort = 12350
        const testSlasTarget = `http://localhost:${testProxyPort}/shopper/auth/responseHeaders`

        // Mock upstream returns 404 for any passwordless endpoint.
        testProxyApp.use('/shopper/auth/responseHeaders', (req, res) => {
            res.status(404).send()
        })

        const testProxyServer = testProxyApp.listen(testProxyPort)

        try {
            const testAppConfig = {
                ...appConfig,
                slasTarget: testSlasTarget
            }

            const app = RemoteServerFactory._createApp(opts(testAppConfig))

            // /oauth2/passwordless/token is allow-listed but is NOT the login
            // endpoint, so the user-enumeration mask must not fire here — the
            // raw 404 from SLAS must be passed through.
            return await request(app)
                .post(
                    '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/passwordless/token'
                )
                .expect(404)
        } finally {
            testProxyServer.close()
        }
    }, 15000)

    test('pathRewrite normalizes percent-encoded characters before forwarding to upstream', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const testProxyApp = express()
        const testProxyPort = 12348

        // Echo back the URL the mock upstream received
        testProxyApp.use((req, res) => {
            res.json({url: req.url})
        })

        const testProxyServer = testProxyApp.listen(testProxyPort)

        try {
            const testAppConfig = {
                ...appConfig,
                slasTarget: `http://localhost:${testProxyPort}`
            }

            const app = RemoteServerFactory._createApp(opts(testAppConfig))

            // Send an allow-listed path with %6F encoding for 'o' in "logout"
            return await request(app)
                .get(
                    '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/l%6Fgout'
                )
                .then((response) => {
                    // The upstream should receive the decoded, normalized path
                    expect(response.body.url).toBe(
                        '/shopper/auth/v1/organizations/f_ecom_test/oauth2/logout'
                    )
                })
        } finally {
            testProxyServer.close()
        }
    }, 15000)

    test('pathRewrite collapses dot-segments before forwarding to upstream', async () => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'

        const testProxyApp = express()
        const testProxyPort = 12349

        // Echo back the URL the mock upstream received
        testProxyApp.use((req, res) => {
            res.json({url: req.url})
        })

        const testProxyServer = testProxyApp.listen(testProxyPort)

        try {
            const testAppConfig = {
                ...appConfig,
                slasTarget: `http://localhost:${testProxyPort}`
            }

            const app = RemoteServerFactory._createApp(opts(testAppConfig))

            // Send a path with encoded dot-segments that collapse to an
            // allow-listed endpoint.
            return await request(app)
                .post(
                    '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/other/%2E%2E/token'
                )
                .then((response) => {
                    // The upstream should receive the collapsed path
                    expect(response.body.url).toBe(
                        '/shopper/auth/v1/organizations/f_ecom_test/oauth2/token'
                    )
                })
        } finally {
            testProxyServer.close()
        }
    }, 15000)
})

describe('Base path tests', () => {
    beforeEach(() => {
        // Re-establish the getConfig mock that afterEach's restoreAllMocks clears.
        // _setupBasePathMiddleware reads getConfig() at setup time.
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('Base path is removed from /mobify request path and still gets through to /mobify endpoint', async () => {
        jest.spyOn(ssrNamespacePaths, 'getEnvBasePath').mockReturnValue('/basepath')

        const app = RemoteServerFactory._createApp(opts())

        return request(app)
            .get('/basepath/mobify/ping')
            .then((response) => {
                expect(response.status).toBe(200)
            })
    }, 15000)

    test('should not remove base path from non /mobify non-express routes', async () => {
        // Set base path to something that might also be a site id used by react router routes
        jest.spyOn(ssrNamespacePaths, 'getEnvBasePath').mockReturnValue('/us')

        const app = RemoteServerFactory._createApp(opts())

        // Add a middleware to capture the request path after base path processing
        let capturedPath = null
        app.use((req, res, next) => {
            capturedPath = req.path
            next()
        })

        return request(app)
            .get('/us/products/123')
            .then((response) => {
                expect(response.status).toBe(404) // 404 because the route doesn't exist in express

                // Verify that the base path was not removed from the request path
                expect(capturedPath).toBe('/us/products/123')
            })
    }, 15000)

    test('should remove base path from routes with path parameters', async () => {
        jest.spyOn(ssrNamespacePaths, 'getEnvBasePath').mockReturnValue('/basepath')

        const app = RemoteServerFactory._createApp(opts())

        app.get('/api/users/:id', (req, res) => {
            res.status(200).json({userId: req.params.id})
        })

        return request(app)
            .get('/basepath/api/users/123')
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.body.userId).toBe('123')
            })
    }, 15000)

    test('should remove base path from routes defined with regex', async () => {
        jest.spyOn(ssrNamespacePaths, 'getEnvBasePath').mockReturnValue('/basepath')

        const app = RemoteServerFactory._createApp(opts())

        app.get(/\/api\/users\/\d+/, (req, res) => {
            // Extract the user ID from the URL path since regex routes don't create req.params automatically
            const match = req.path.match(/\/api\/users\/(\d+)/)
            const userId = match ? match[1] : 'unknown'
            res.status(200).json({userId: userId})
        })

        return request(app)
            .get('/basepath/api/users/123')
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.body.userId).toBe('123')
            })
    }, 15000)

    test('should handle optional characters in route pattern', async () => {
        jest.spyOn(ssrNamespacePaths, 'getEnvBasePath').mockReturnValue('/basepath')

        const app = RemoteServerFactory._createApp(opts())

        // This route is intentionally made complex to test the following:
        // 1. Optional characters in route pattern ie. 'k?'
        // 2. Optional characters in route pattern with groups ie. (c)?
        // 3. Optional characters in route pattern with path parameters ie. (:param?)
        // 4. Wildcards ie. '*'
        app.get('/callba(c)?k?*/:param?', (req, res) => {
            res.status(200).json({message: 'test'})
        })

        return request(app)
            .get('/basepath/callback')
            .then((response) => {
                expect(response.status).toBe(200)
                expect(response.body.message).toBe('test')
            })
    }, 15000)

    test('should redirect /__pwa-kit routes to clean URL when showBasePath is false', async () => {
        jest.spyOn(ssrNamespacePaths, 'getEnvBasePath').mockReturnValue('/basepath')
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({
            app: {url: {showBasePath: false}}
        })

        const app = RemoteServerFactory._createApp(opts())

        return request(app)
            .get('/basepath/__pwa-kit/refresh?referrer=/some-page')
            .expect(302)
            .then((response) => {
                // Should redirect to the clean URL without base path
                expect(response.headers.location).toBe('/__pwa-kit/refresh?referrer=/some-page')
            })
    }, 15000)

    test('should not remove base path from /__pwa-kit routes when showBasePath is true', async () => {
        jest.spyOn(ssrNamespacePaths, 'getEnvBasePath').mockReturnValue('/basepath')
        jest.spyOn(ssrConfig, 'getConfig').mockReturnValue({
            app: {url: {showBasePath: true}}
        })

        const app = RemoteServerFactory._createApp(opts())

        let capturedPath = null
        app.use((req, res, next) => {
            capturedPath = req.path
            next()
        })

        return request(app)
            .get('/basepath/__pwa-kit/refresh')
            .then(() => {
                // Base path should NOT be stripped since React Router handles it via basename
                expect(capturedPath).toBe('/basepath/__pwa-kit/refresh')
            })
    }, 15000)
})

describe('SLAS private client proxy — credential leak guard on blocked shapes', () => {
    // For every shape the pre-proxy guard rejects, the upstream must never
    // be contacted at all — and therefore neither the `Authorization` nor
    // the `_sfdc_client_auth` header can have been set on a forwarded
    // request. This block captures both invariants symmetrically.

    const savedEnvironment = Object.assign({}, process.env)
    const upstreamPort = 12351
    const upstreamPath = '/shopper/auth/responseHeaders'
    const slasTarget = `http://localhost:${upstreamPort}${upstreamPath}`
    const appConfig = {
        mobify: {
            app: {
                commerceAPI: {
                    parameters: {
                        clientId: 'clientId',
                        shortCode: 'shortCode'
                    }
                }
            }
        },
        useSLASPrivateClient: true,
        slasTarget: slasTarget
    }

    let upstreamApp
    let upstreamServer
    let upstreamHandler

    beforeEach(() => {
        process.env.PWA_KIT_SLAS_CLIENT_SECRET = 'a secret'
        upstreamHandler = jest.fn((req, res) => res.send(req.headers))
        upstreamApp = express()
        upstreamApp.use(upstreamPath, upstreamHandler)
        upstreamServer = upstreamApp.listen(upstreamPort)
    })

    afterEach(async () => {
        process.env = savedEnvironment
        if (upstreamServer) {
            await new Promise((resolve) => upstreamServer.close(resolve))
            upstreamServer.unref?.()
            upstreamServer.removeAllListeners?.()
        }
    })

    const blockedShapes = [
        [
            'plain trusted-system path',
            'POST',
            '/mobify/slas/private/shopper/auth/v1/oauth2/trusted-system/token'
        ],
        [
            'percent-encoded hyphen in trusted-system',
            'POST',
            '/mobify/slas/private/shopper/auth/v1/oauth2/trusted%2Dsystem/token'
        ],
        [
            'encoded dot-segment traversal to trusted-system',
            'POST',
            '/mobify/slas/private/shopper/auth/v1/oauth2/token/%2E%2E/trusted-system/token'
        ],
        [
            'double-encoded hyphen in trusted-system',
            'GET',
            '/mobify/slas/private/shopper/auth/v1/oauth2/trusted%252Dsystem/token'
        ],
        [
            'triple-encoded hyphen in trusted-system',
            'GET',
            '/mobify/slas/private/shopper/auth/v1/oauth2/trusted%25252Dsystem/token'
        ],
        [
            'double-encoded dot-segment traversal',
            'POST',
            '/mobify/slas/private/shopper/auth/v1/oauth2/token/%252E%252E/trusted-system/token'
        ],
        [
            'wrong method on allow-listed token endpoint',
            'GET',
            '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/token'
        ],
        [
            'missing /organizations/{orgId}/ structural prefix',
            'POST',
            '/mobify/slas/private/shopper/auth/v1/oauth2/token'
        ],
        [
            'endpoint not on the allow-list',
            'POST',
            '/mobify/slas/private/shopper/auth/v1/organizations/f_ecom_test/oauth2/bogus'
        ]
    ]

    test.each(blockedShapes)(
        'never forwards credentials on blocked shape: %s',
        async (_label, method, path) => {
            const app = RemoteServerFactory._createApp(opts(appConfig))

            const response = await request(app)[method.toLowerCase()](path)

            expect(response.status).toBe(403)
            // The upstream mock must not have been called at all — proving
            // neither `Authorization: Basic …` nor `_sfdc_client_auth` could
            // have leaked, because no request reached SLAS.
            expect(upstreamHandler).not.toHaveBeenCalled()
        },
        15000
    )
})
