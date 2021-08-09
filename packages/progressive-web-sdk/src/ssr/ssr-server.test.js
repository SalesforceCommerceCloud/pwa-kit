/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* global jest, describe, test */

/* eslint-env jest */
/* eslint import/no-commonjs:0 */
/* eslint max-nested-callbacks:0 */

import {PersistentCache} from '../utils/ssr-cache-utils'
import {
    CachedResponse,
    getWindowFetchOptions,
    windowFetch,
    setRemote
} from '../utils/ssr-server-utils'
import {X_PROXY_REQUEST_URL, X_MOBIFY_REQUEST_CLASS} from '../utils/ssr-proxy-utils'
import {PROXY_PATH_PREFIX, X_MOBIFY_QUERYSTRING} from './constants'
import {Request} from 'node-fetch'
// Mock static assets (require path is relative to the 'ssr' directory)
const mockStaticAssets = {}
jest.mock('../static/assets.json', () => mockStaticAssets, {virtual: true})

// We use require() for the ssr-server since we have to mock a module
// that it needs.
const {
    RESOLVED_PROMISE,
    SSRServer,
    scriptCache,
    ScriptTag,
    hashInlineScript
} = require('./ssr-server')
const polyfills = require('./ssr-polyfills')
const fetch = require('node-fetch')
const fs = require('fs')
const http = require('http')
const https = require('https')
const nock = require('nock')
const sinon = require('sinon')
const tls = require('tls')
const path = require('path')
const querystring = require('querystring')
const _ = require('lodash')
const URL = require('url')
const zlib = require('zlib')
const TEST_PORT = 3444

const testFixtures = path.resolve(process.cwd(), 'src/ssr/test_fixtures')

const testPackageMobify = {
    pageNotFoundURL: '/page-not-found',
    ssrEnabled: true,
    ssrOnly: ['main.js.map', 'ssr.js', 'ssr.js.map', 'vendor.js.map'],
    ssrShared: ['main.css', 'main.js', 'ssr-loader.js', 'vendor.js', 'worker.js'],
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
}

// Set up the mocked staticAssets object
SSRServer.SCRIPT_FILES.forEach((scriptPath) => {
    const base = path.basename(scriptPath)
    mockStaticAssets[base] = `// no-op (${base})\n`
})
mockStaticAssets['jquery.min.js'] = '// Fake JQuery\nwindow.$ = () => false\n'
mockStaticAssets['capture.min.js'] = '// Fake CaptureJS\nwindow.Capture = () => false\n'
mockStaticAssets['browser-detection.min.js'] =
    '// Fake browser detection\ncheckBrowserCompatibility = () => false\n'

// Some of our tests require that the 'temp' directory
// exists.
const tempDir = path.resolve(process.cwd(), 'temp')
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
}

describe('SSRServer validation', () => {
    const baseOptions = {
        buildDir: 'temp',
        routes: [/\/.*/],
        mobify: testPackageMobify,
        remote: false,
        quiet: true,
        port: TEST_PORT,
        protocol: 'https',
        sslFilePath: './src/ssr/test_fixtures/localhost.pem',
        unsupportedBrowserRedirect: 'https://mobify.com',
        supportedBrowsers: [{name: 'chrome', version: 51}]
    }
    const invalidOptions = [
        {
            name: 'routes',
            options: Object.assign({}, baseOptions, {routes: undefined})
        },
        {
            name: 'routes',
            options: Object.assign({}, baseOptions, {routes: []})
        },
        {
            name: 'mobify',
            options: Object.assign({}, baseOptions, {mobify: undefined})
        },
        {
            name: 'mobify',
            options: Object.assign({}, baseOptions, {mobify: 'a string'})
        },
        {
            name: 'mobify.pageNotFoundURL',
            options: Object.assign({}, baseOptions, {mobify: {}})
        },
        {
            name: 'buildDir empty',
            options: Object.assign({}, baseOptions, {buildDir: ''})
        },
        {
            name: 'buildDir invalid',
            options: Object.assign({}, baseOptions, {buildDir: 'nosuchpath'})
        },
        {
            name: 'fetchAgents.http invalid',
            options: Object.assign({}, baseOptions, {fetchAgents: {http: {}}})
        },
        {
            name: 'fetchAgents.https invalid',
            options: Object.assign({}, baseOptions, {fetchAgents: {https: {}}})
        },
        {
            name: 'sslFilePath missing',
            options: Object.assign({}, baseOptions, {sslFilePath: undefined})
        },
        {
            name: 'unsupportedBrowserRedirect uses a protocol other than HTTP',
            options: Object.assign({}, baseOptions, {unsupportedBrowserRedirect: 'c://not/http'})
        },
        {
            name: 'empty supported browser object',
            options: Object.assign({}, baseOptions, {supportedBrowsers: [{}]})
        },
        {
            name: 'supported browser object without name',
            options: Object.assign({}, baseOptions, {supportedBrowsers: [{version: 53}]})
        },
        {
            name: 'supported browser object is not an array',
            options: Object.assign({}, baseOptions, {supportedBrowsers: 'all the things'})
        },
        {
            name: 'supported browser object without version',
            options: Object.assign({}, baseOptions, {supportedBrowsers: [{name: 'chrome'}]})
        },
        {
            name: 'supported browser version is a string',
            options: Object.assign({}, baseOptions, {
                supportedBrowsers: [{name: 'chrome', version: '53'}]
            })
        },
        {
            name: 'supported browser name is an integer',
            options: Object.assign({}, baseOptions, {supportedBrowsers: [{name: 53, version: 53}]})
        },
        {
            name: 'server protocol is ssl',
            options: Object.assign({}, baseOptions, {protocol: 'ssl'})
        }
    ]
    invalidOptions.forEach((testConfig) => {
        test(`SSRServer validates missing or invalid field "${testConfig.name}"`, () => {
            expect(() => new SSRServer(testConfig.options)).toThrow()
        })
    })

    test('The unsupportedBrowserRedirect option', () => {
        const options = {...baseOptions}
        options.unsupportedBrowserRedirect = '/relative'
        const server = new SSRServer(options)
        try {
            expect(server.options.unsupportedBrowserRedirect).toEqual('/relative')
        } finally {
            server.close()
        }
    })

    test('SSRServer warns on missing favicon', () => {
        const options = {...baseOptions}
        options.buildDir = path.resolve(process.cwd(), 'src/ssr/test_fixtures')
        options.faviconPath = 'nosuchfile.ico'

        const sandbox = sinon.sandbox.create()
        let server

        try {
            const warn = sandbox.spy(console, 'warn')
            server = new SSRServer(options)
            expect(warn.calledOnce).toBe(true)
            expect(server.options.faviconPath).toBeFalsy()
        } finally {
            server && server.close()
            sandbox.restore()
        }
    })

    test('SSRServer removes jquery duplicate script', () => {
        const options = {...baseOptions}
        options.loadJQuery = true
        const jq = 'static/jquery.js'
        const analytics = 'static/analytics.js'
        options.ssrLoaderScripts = [jq, analytics]

        let server
        try {
            server = new SSRServer(options)
            expect(server.options.ssrLoaderScripts.length).toBe(1)
            expect(server.options.ssrLoaderScripts.includes(jq)).toBe(false)
            expect(server.options.ssrLoaderScripts.includes(analytics)).toBe(true)
        } finally {
            if (server) {
                server.close()
            }
        }
    })

    test('SSRServer loads capture along with JQuery', () => {
        const options = {...baseOptions}
        options.loadJQuery = true
        options.loadCaptureJS = false
        let server
        try {
            server = new SSRServer(options)
            expect(server.options.loadJQuery).toBe(true)
            expect(server.options.loadCaptureJS).toBe(true)
        } finally {
            server && server.close()
        }
    })
})

describe('SSRServer checks environment', () => {
    const baseOptions = {
        buildDir: 'temp',
        routes: [/\/.*/],
        mobify: testPackageMobify,
        remote: true,
        quiet: true,
        port: TEST_PORT
    }

    const savedEnvironment = Object.assign({}, process.env)

    SSRServer.REQUIRED_ENVIRONMENT.forEach((envVar) => {
        test(`SSR Server verifies environment variable "${envVar}"`, () => {
            // Set truthy values for all the variables except the one we're
            // testing.
            SSRServer.REQUIRED_ENVIRONMENT.forEach((envName) => {
                if (envName !== envVar) {
                    process.env[envName] = 'value'
                } else {
                    delete process.env[envName]
                }
            })
            expect(() => new SSRServer(baseOptions)).toThrow(envVar)
        })
    })

    // Restore the environment
    process.env = savedEnvironment
})

describe('SSRServer dev server error handling', () => {
    // Use Jest's mocking functions to create stubs for the side-effects you want to test.
    const testServerErrorHandler = (error, times) => {
        const exit = jest.fn()
        const proc = {exit}
        const close = jest.fn()
        const devserver = {close}
        const log = jest.fn()
        const handler = SSRServer._serverErrorHandler(proc, devserver, log)
        const e = {code: error}

        handler(e)
        expect(close).toHaveBeenCalledTimes(times)
    }

    test('SSRServer dev server exits if there is already a process running on the same port', () => {
        testServerErrorHandler('EADDRINUSE', 1)
    })

    test('SSRServer is not handling permission denied errors', () => {
        testServerErrorHandler('EACCES', 0)
    })
})

/**
 * An HTTPS.Agent that allows self-signed certificates
 * @type {module:https.Agent}
 */
export const httpsAgent = new https.Agent({
    rejectUnauthorized: false
})

const LOCALHOST_BASE = `https://localhost:${TEST_PORT}`
/**
 * Perform a fetch to the given path on localhost:${TEST_PORT}, ignoring
 * certificate errors.
 * @param url {String} path to fetch
 * @param init [{Object}] options for fetch
 */
const doLocalFetch = (url, init) => {
    const fullUrl = URL.resolve(LOCALHOST_BASE, url)
    const fullInit = Object.assign({}, init || {}, {
        agent: httpsAgent
    })
    return fetch(fullUrl, fullInit)
}

describe('SSRServer operation', () => {
    const savedEnvironment = Object.assign({}, process.env)
    const sandbox = sinon.sandbox.create()
    let server
    afterEach(() => {
        sandbox.restore()
        if (server) {
            server.close()
            server = null
        }
        nock.cleanAll()
    })
    afterAll(() => {
        process.env = savedEnvironment
    })
    beforeEach(() => {
        // Ensure the environment is clean
        process.env = {
            LISTEN_ADDRESS: '',
            EXTERNAL_DOMAIN_NAME: ''
        }
    })

    const options = {
        buildDir: './src/ssr/test_fixtures',
        routes: [/\//],
        mobify: testPackageMobify,
        optimizeCSS: true,
        sslFilePath: './src/ssr/test_fixtures/localhost.pem',
        quiet: true,
        port: TEST_PORT,
        protocol: 'https',
        fetchAgents: {
            https: httpsAgent
        },
        unsupportedBrowserRedirect: 'https://mobify.com'
    }

    test('global.fetch is windowFetch', () => {
        expect(global.fetch).toBe(windowFetch)
    })

    test('SSRServer local creates express app', () => {
        server = new SSRServer(options)
        expect(server.expressApp).toBeDefined()
        expect(server.localDevServer).toBeDefined()
        expect(server.options.defaultCacheControl).toEqual(SSRServer.NO_CACHE)
        expect(server.options.errorCacheControl).toEqual(SSRServer.NO_CACHE)
    })

    test('SSRServer remote creates express app', () => {
        const newOptions = Object.assign({}, options, {
            remote: true,
            defaultCacheTimeSeconds: 123,
            errorCacheTimeSeconds: 456
        })
        SSRServer.REQUIRED_ENVIRONMENT.forEach((envVar) => {
            process.env[envVar] = 'value'
        })
        server = new SSRServer(newOptions)
        expect(server.expressApp).toBeDefined()
        expect(server.localDevServer).not.toBeDefined()
        expect(server.options.defaultCacheControl.includes('123')).toBe(true)
        expect(server.options.errorCacheControl.includes('456')).toBe(true)

        // Check that rejectUnauthorized hasn't been changed
        expect(https.globalAgent.rejectUnauthorized).toBeUndefined()
    })

    test('SSRServer configures Agent objects', () => {
        const newCiphers =
            tls.DEFAULT_CIPHERS.replace('!RC4:', '').replace('!MD5:', '') + ':RC4-MD5'
        for (let secure = 0; secure <= 1; secure++) {
            const protocol = secure ? 'https' : 'http'
            const module = secure ? https : http

            const newOptions = Object.assign({}, options, {
                remote: false,
                fetchAgents: {
                    [protocol]: new module.Agent({
                        ciphers: newCiphers
                    })
                }
            })
            server = new SSRServer(newOptions)

            // Check that self-signed certs are accepted
            expect(!!https.globalAgent.rejectUnauthorized).toBe(false)

            // Check that keepAlive is enabled on the windowFetch agents
            let agent = getWindowFetchOptions().fetchAgents[protocol]
            expect(
                agent.keepAlive,
                `Expected that windowFetch ${protocol} agent would have keepAlive set to true`
            ).toBe(true)
            expect(
                agent.options.ciphers,
                `Expected that windowFetch ${protocol} agent would have ciphers set`
            ).toEqual(newCiphers)

            agent = module.globalAgent
            expect(
                agent.options.ciphers,
                `Expected that ${protocol}.globalAgent would have ciphers set`
            ).toEqual(newCiphers)
            server.close()
            server = null
        }
    })

    test('SSRServer listens on HTTPS', () => {
        server = new SSRServer(options)
        return doLocalFetch('/').then((response) => {
            expect(response.ok).toBe(true)
        })
    })

    test('SSRServer listens on HTTP', () => {
        server = new SSRServer(Object.assign({}, options, {protocol: 'http'}))
        return fetch(`http://localhost:${TEST_PORT}`).then((response) => {
            expect(response.ok).toBe(true)
        })
    })

    test('SSRServer can get a protocol from an environment variable', () => {
        process.env.DEV_SERVER_PROTOCOL = 'http'
        server = new SSRServer(options)
        return fetch(`http://localhost:${TEST_PORT}`).then((response) => {
            expect(response.ok).toBe(true)
            delete process.env.DEV_SERVER_PROTOCOL
        })
    })

    test('SSRServer tracks responses', () => {
        server = new SSRServer(options)
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

        expect(server._pendingResponses.ids).toEqual([])
        server._responseFinished(response1)
        expect(server._pendingResponses.ids).toEqual([])

        const promise1 = server._waitForResponses()
        expect(promise1).toBe(RESOLVED_PROMISE)

        server._responseStarted(response1)
        expect(server._pendingResponses.ids).toEqual([1])

        const promise2 = server._waitForResponses()
        expect(promise2).not.toBe(RESOLVED_PROMISE)

        server._responseStarted(response2)
        expect(server._pendingResponses.ids).toEqual([1, 2])

        const promise3 = server._waitForResponses()
        expect(promise3).toBe(promise2)

        server._responseFinished(response1)
        expect(server._pendingResponses.ids).toEqual([2])

        server._responseFinished(response1)
        expect(server._pendingResponses.ids).toEqual([2])

        server._responseFinished(response2)
        expect(server._pendingResponses.ids).toEqual([])

        // If the promise doesn't resolve, this test will timeout
        return promise2
    })

    test('SSRServer throws on incorrect dev server protocol', () => {
        expect(() => new SSRServer(Object.assign({}, options, {protocol: 'ssl'}))).toThrow()
    })

    test(`SSRServer doesn't overwrite the protocol when remote`, () => {
        SSRServer.REQUIRED_ENVIRONMENT.forEach((envVar) => {
            process.env[envVar] = 'value'
        })
        server = new SSRServer(Object.assign({}, options, {protocol: 'http', remote: true}))
        expect(server.protocol).toEqual('https')
        process.env = savedEnvironment
    })

    test('SSRServer handles missing sslFile', () => {
        const newOptions = Object.assign({}, options, {sslFilePath: undefined})
        expect(() => new SSRServer(newOptions)).toThrow()
    })

    test('SSRServer get() calls renderPage', () => {
        const newOptions = Object.assign({}, options, {quiet: false})
        server = new SSRServer(newOptions)
        const mock = sandbox.stub(SSRServer.prototype, '_renderPage')
        mock.callsFake((req, res) => {
            res.status(200).end()
            return Promise.resolve()
        })

        expect.assertions(1)

        return doLocalFetch('/').then(() => expect(mock.calledOnce).toBe(true))
    })

    test('SSRServer injects the script for recognizing unsupported browsers', () => {
        const supportedBrowsers = [{name: 'Chrome', version: 53, mobile: true}]
        const unsupportedBrowserRedirect = 'https://mobify.com'
        const newOptions = Object.assign({}, options, {
            supportedBrowsers,
            unsupportedBrowserRedirect
        })
        server = new SSRServer(newOptions)

        return doLocalFetch('/')
            .then((response) => {
                expect(response.ok).toBe(true)
                return response.text()
            })
            .then((text) => {
                expect(
                    text.includes('<script id="supported-browsers-check" type="text/javascript">'),
                    'Expected to find injected script with supported browser list'
                ).toBe(true)

                // Find the `"supportedBrowsers":` string and the list for that key.
                // The second group in the RegExp matches the first list exactly after
                // the `"supportedBrowsers":` string:
                // - `\[` and `\]` - match characters `[` and `]`
                // - [^\[] - match every character that's not `[`
                // [2] is the second match group
                const listCheck = text.match(/("supportedBrowsers": )(\[[^\]]+\])/)[2]
                expect(
                    // window.Progressive is pretty-printed, so we need to remove
                    // all the whitespaces
                    listCheck.replace(/\s/g, ''),
                    'Expected the supported browser list to match the options'
                ).toEqual(JSON.stringify(supportedBrowsers))

                expect(
                    // The body of the test fixture script
                    text.includes('// Fake browser detection'),
                    'Expected the browser detection script to be present'
                ).toBe(true)

                expect(
                    text.includes(
                        `window.location.replace("${server.options.unsupportedBrowserRedirect}")`
                    ),
                    `Expected a redirect to ${server.options.unsupportedBrowserRedirect} to be present`
                ).toBe(true)
            })
    })

    test('SSRServer handles missing route', () => {
        const newOptions = Object.assign({}, options, {
            routes: [/\/onlythispage/, new RegExp(options.mobify.pageNotFoundURL)]
        })
        server = new SSRServer(newOptions)
        expect.assertions(6)

        return doLocalFetch('/nosuchpage', {redirect: 'manual'})
            .then((response) => {
                expect(response.status).toBe(302)
                expect(response.ok).toBe(false)
                const headers = response.headers
                expect(headers.has('location')).toBe(true)
                const location = response.headers.get('location')
                expect(location).toEqual(
                    `https://localhost:${TEST_PORT}${newOptions.mobify.pageNotFoundURL}`
                )

                // Follow the redirect
                return fetch(location, {agent: httpsAgent})
            })
            .then((response) => {
                expect(response.status).toBe(404)
                expect(response.ok).toBe(false)
            })
    })

    test('SSRServer renders error page if getRenderedContent throws an error', () => {
        server = new SSRServer(options)
        expect.assertions(5)

        // Patch Rendering._getRenderedContent to throw an error, which
        // causes the Rendering promise chain to fail
        const mock = sandbox.stub(SSRServer.Rendering.prototype, '_getRenderedContent')
        mock.throws('Error', 'Intentional test error')

        return doLocalFetch('/')
            .then((response) => {
                expect(response.ok).toBe(true)
                expect(mock.calledOnce).toBe(true)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()

                // Check that there's an error comment
                expect(
                    text.includes('Error in rendering'),
                    'Did not expect to find an error-page comment'
                ).toBe(true)

                // Check that the React target div is empty
                const emptyDiv = '<div class="react-target">&nbsp;</div>'
                expect(text.includes(emptyDiv), `Expected to find "${emptyDiv}" in HTML`).toBe(true)
            })
    })

    test('SSRServer sends an error page if server side rendering fails', () => {
        const newOptions = {
            ...options,
            mainFilename: 'main-error.js',
            stylesheetFilename: 'main.css',
            quiet: false
        }
        server = new SSRServer(newOptions)

        return doLocalFetch('/')
            .then((response) => {
                expect(response.ok).toBe(true)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()

                // Check that there's an error comment
                expect(
                    text.includes('Error in rendering'),
                    'Did not expect to find an error-page comment'
                ).toBe(true)

                // Check that the React target div is empty
                const emptyDiv = '<div class="react-target">&nbsp;</div>'
                expect(text.includes(emptyDiv), `Expected to find "${emptyDiv}" in HTML`).toBe(true)

                const errorScript =
                    '<script type="text/javascript">console.error("An error occurred during server side rendering: This is an intentional Error")</script>'
                expect(
                    text.includes(errorScript),
                    `Expected to find "${errorScript}" in HTML`
                ).toBe(true)
            })
    })

    test('SSRServer renders correctly', () => {
        const scriptUrl = 'https://scripty.com/script.js'
        const newOptions = Object.assign({}, options, {
            ssrLoaderScripts: [scriptUrl]
        })
        server = new SSRServer(newOptions)

        // This will render the test fixture PWA.
        const path = '/render1?abc=123'
        return doLocalFetch(path)
            .then((response) => {
                expect(response.ok).toBe(true)

                // Verify headers
                const xpb = response.headers.get('x-powered-by')
                expect(xpb).toEqual(SSRServer.POWERED_BY)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()

                // Check that there's no error comment
                expect(
                    text.includes('Error in rendering'),
                    'Did not expect to find an error-page comment'
                ).toBe(false)

                // Check for expected strings
                const expectedStrings = [
                    '<p>hi from javascript</p>',
                    'JQuery is present',
                    '<script id="srcless">',
                    '<script>I am a script\\x3c\\x2fscript><p>\\x3c\\x2fp>',
                    `window.location is "${LOCALHOST_BASE}${path}"`,
                    `src="/mobify/bundle/development/ssr-loader.js"`,
                    `"${scriptUrl}"`
                ]

                expectedStrings.forEach((expectedString) => {
                    expect(
                        text.includes(expectedString),
                        `Expected to find "${expectedString}" in HTML ${text}`
                    ).toBe(true)
                })

                // Check for strings that should not be present
                expect(
                    text.includes('pw-remove'),
                    'Did not expect to find elements with class "pw-remove"'
                ).toBe(false)
            })
    })

    test('SSRSever generating correct inline script hashes', () => {
        server = new SSRServer({
            ...options,
            mainFilename: 'main6.js'
        })

        const responseHook = sandbox.spy(server, 'responseHook')

        const scriptContents = [
            'console.log("this is an inline script")',
            '(x => x)(1)',
            'console.log("foo")'
        ]
        const path = `/render1?scriptContents=${scriptContents}`
        return doLocalFetch(path).then(() => {
            expect(responseHook.called, 'Expected responseHook to be called').toBe(true)

            let options = responseHook.args[0][2]
            const {inlineScriptHashes} = options
            // the server has some hashed scripts of its own,
            // so inlineScriptHashes should be >= inline scriptContents
            expect(inlineScriptHashes.length).toBeGreaterThanOrEqual(scriptContents.length)

            scriptContents.forEach((scriptContent) => {
                const hashedContent = hashInlineScript(scriptContent)
                expect(inlineScriptHashes.includes(hashedContent)).toBe(true)
            })
        })
    })

    test('SSRServer rendering gets and sends no cookies', () => {
        server = new SSRServer(options)
        const responseHeaders = {
            'set-cookie': 'xyz=456',
            'x-expected': '123'
        }
        const path = `/render1?headers=${JSON.stringify(responseHeaders)}`
        return doLocalFetch(path).then((response) => {
            expect(response.ok).toBe(true)
            const setCookie = response.headers.get('Set-Cookie')
            expect(setCookie).toBeFalsy()
            expect(response.headers.get('x-expected')).toEqual('123')
        })
    })

    test('SSRServer renders with 404 status code', () => {
        server = new SSRServer(options)

        // This will render with a 404 code
        const path = '/render1?abc=123&statusCode=404'
        return doLocalFetch(path)
            .then((response) => {
                expect(response.ok).toBe(false)
                expect(response.status).toBe(404)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                expect(text.includes('I am a script')).toBe(true)
            })
    })

    test('SSRServer renders with 301 status code and no body', () => {
        server = new SSRServer(options)

        // This will render with a 301 code and a Location header
        const headers = {
            location: 'https://somewhere.else/'
        }
        const encodedHeaders = querystring.escape(JSON.stringify(headers))
        const path = `/render1?statusCode=301&headers=${encodedHeaders}&suppressBody=1`
        return doLocalFetch(path, {redirect: 'manual'})
            .then((response) => {
                expect(response.status).toBe(301)
                expect(response.ok).toBe(false)
                expect(response.headers.get('Location')).toEqual(headers.location)
                return response.text()
            })
            .then((body) => {
                expect(body).toBeFalsy()
            })
    })

    test('SSRServer ssrRenderingComplete catches invalid header', () => {
        server = new SSRServer(options)

        // This will not set the Content-Type header because a multi-value
        // is disallowed.
        const headers = {
            'content-type': ['application/octet-stream', 'text/plain']
        }
        const encodedHeaders = querystring.escape(JSON.stringify(headers))
        const path = `/render1?headers=${encodedHeaders}`
        return doLocalFetch(path).then((response) => {
            expect(response.ok).toBe(true)
            expect(response.status).toBe(200)
            expect(response.headers.get('Content-Type')).toEqual('text/html; charset=utf-8')
        })
    })

    test('SSRServer renders server-only', () => {
        server = new SSRServer(options)

        // This will render the server output only
        const path = '/render1?mobify_server_only'
        return doLocalFetch(path)
            .then((response) => {
                expect(response.ok).toBe(true)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()

                // Check that there's no script element to load
                // the UPWA
                expect(
                    text.includes('ssr-loader'),
                    "Did not expect to find 'ssr-loader' in the output"
                ).toBe(false)

                expect(
                    text.includes('id="mobify-v8-tag"'),
                    'Did not expect to find \'id="mobify-v8-tag"\' in the output'
                ).toBe(false)
            })
    })

    test('SSRServer supports the request-processor and request class', () => {
        server = new SSRServer(options)

        return doLocalFetch('/test-request-processor?a=1')
            .then((response) => {
                expect(response.ok).toBe(true)

                const requestClass = response.headers.get(X_MOBIFY_REQUEST_CLASS)
                expect(requestClass).toEqual('bot')

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                expect(/window\.location is ".+\/altered\?foo=bar"/.test(text)).toBe(true)
                expect(text).toMatch('request class is "bot"')
            })
            .then(() => doLocalFetch('/test-request-processor2?a=1'))
            .then((response) => {
                expect(response.ok).toBe(true)
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                expect(/window\.location is ".+\/altered2"/.test(text)).toBe(true)
            })
    })

    test('SSRServer handles a missing request processor', () => {
        const rpPath = path.join(process.cwd(), options.buildDir, 'request-processor.js')

        // Patch fs module to pretend the the request processor doesn't exist
        const existsSync = sandbox.stub(fs, 'existsSync')
        existsSync.withArgs(rpPath).returns(false)
        existsSync.callThrough()

        server = new SSRServer(options)
        expect(server._requestProcessor).toBe(null)

        return doLocalFetch('/test-request-processor?a=1')
            .then((response) => {
                expect(response.ok).toBe(true)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                expect(/window\.location is ".+\/test-request-processor\?a=1"/.test(text)).toBe(
                    true
                )
            })
    })

    test('SSRServer handles a broken request processor', () => {
        server = new SSRServer(options)
        return doLocalFetch('/test-request-processor3?a=1').then((response) => {
            expect(response.ok).toBe(false)
            expect(response.status).toEqual(500)
        })
    })

    test('SSRServer honours any x-mobify-querystring header', () => {
        server = new SSRServer(options)

        const url = '/test-header?a=1&b=2'
        const altQS = 'z=1&y=2&x=3'
        const fetchOptions = {
            headers: {
                [X_MOBIFY_QUERYSTRING]: altQS
            }
        }

        return doLocalFetch(url, fetchOptions)
            .then((response) => {
                expect(response.ok).toBe(true)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                const match = /window\.location is ".+\/test-header\?(.+)"/.exec(text)
                expect(match).toBeDefined()
                // The location is encoded when turned into HTML
                const qs = match[1].replace(/&amp;/g, '&')
                expect(qs).toEqual(altQS)
            })
    })

    test('SSRServer uses the JSDOM custom resource loader', () => {
        const newOptions = Object.assign({}, options, {allowedUrls: [/op.js/, /op.css/]})
        newOptions.mobify = Object.assign({}, testPackageMobify)
        newOptions.mainFilename = 'main3.js'
        newOptions.mobify.ssrShared = ['*op.js', '*op2.js', '*op.css', '*op2.css', '*img.png']

        server = new SSRServer(newOptions)

        return doLocalFetch('/')
            .then((response) => {
                expect(response.ok).toBe(true)
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()

                // Get everything that's in the <head> tag
                const head = text.match(/<head>(.|\n)+<\/head>/)

                // Get the stringyfied JSON data
                const events = text.match(/{"events":.+}/)

                expect(events, 'Expected the stringified JSON data to be present').toBeTruthy()

                const data = JSON.parse(events).events

                // A script that should be loaded
                expect(
                    data.firstScript.loaded === data.firstScript.expected,
                    `Expected the first script to be loaded`
                ).toBe(true)

                // Check if the first script is in the head
                // We expect it to be true because it's a bundle
                // file and inSSRFiles returns true
                expect(/no-op\.js/.test(head), 'Expected head to contain the first script').toBe(
                    true
                )

                // A script that should be loaded
                expect(
                    data.secondScript.loaded === data.secondScript.expected,
                    `Expected the second script to be loaded`
                ).toBe(true)

                // Check if the second script is in the head
                // We expect it to be false because we're loading it
                // using file:// and it's not a bundle file
                expect(
                    /no-op2\.js/.test(head),
                    'Expected head to not contain the second script'
                ).toBe(false)

                // A script that should not be loaded
                expect(
                    data.thirdScript.loaded === data.thirdScript.expected,
                    `Expected the third script to not be loaded`
                ).toBe(true)

                // Check if the third script is in the head
                // This script is linked to https://localhost because it
                // shouldn't be loaded and it should show in the head
                expect(/no-op3\.js/.test(head), 'Expected head to contain the third script').toBe(
                    true
                )

                // A stylesheet that should be loaded
                // It should not fire a load event, because it's a link element
                expect(
                    data.firstStylesheet.loaded === data.firstStylesheet.expected,
                    `Expected the first stylesheet to not fire a load event`
                ).toBe(true)

                // Check if the first stylesheet is in the head
                expect(
                    /no-op\.css/.test(head),
                    'Expected head to contain the first stylesheet'
                ).toBe(true)

                // A stylesheet that should not be loaded
                // It should not fire a load event, because it's a link element
                expect(
                    data.secondStylesheet.loaded === data.secondStylesheet.expected,
                    `Expected the second stylesheet to not not fire a load event`
                ).toBe(true)

                // Check if the second stylesheet is in the head
                expect(
                    /no-op2\.css/.test(head),
                    'Expected head to contain the second stylesheet'
                ).toBe(true)

                // An image element - it should never be loaded
                // If this test starts to fail, it means we probably started
                // using node canvas and that's not something we want to do
                // for the SSR server, since the performance can be negatively
                // affected by images.
                // https://github.com/jsdom/jsdom#loading-subresources
                expect(
                    data.image.loaded === data.image.expected,
                    `Expected an image to not be loaded`
                ).toBe(true)

                // Check if the image is in the head
                expect(/img\.png/.test(head), 'Expected head to contain the image').toBe(true)
            })
    })

    test('SSRServer uses cached scripts', () => {
        const newOptions = Object.assign({}, options, {remote: false})
        server = new SSRServer(newOptions)

        // Spy on the _executeScript method
        const execute = sinon.spy(SSRServer.prototype, '_executeScript')

        // Clear the cache
        const mainPath = path.normalize('build/main.js')
        const vendorPath = path.normalize('build/vendor.js')
        delete scriptCache[mainPath]
        delete scriptCache[vendorPath]

        const requestPath = '/render1?abc=456'
        return doLocalFetch(requestPath).then((response) => {
            expect(response.ok).toBe(true)

            // Verify the cached scripts
            expect(mainPath in scriptCache).toBe(true)
            expect(vendorPath in scriptCache).toBe(true)
            const mainScript = scriptCache[mainPath]
            const vendorScript = scriptCache[vendorPath]

            // Reset the spy so we can track the next calls
            execute.reset()

            // Re-render
            return doLocalFetch(requestPath).then(() => {
                expect(execute.called).toBe(true)
                expect(execute.calledWith(sinon.match.any, mainScript)).toBe(true)
                expect(execute.calledWith(sinon.match.any, vendorScript)).toBe(true)
            })
        })
    })

    test('SSRServer proxying handles empty path', () => {
        // Use nock to mock out a host to which we proxy, plus
        // an alternate path on it to which we'll redirect
        const nockRedirect = nock('https://test.proxy.com')
            .get('/')
            .reply(301, '', {Location: '/another/path'})

        const nockResponse = nock('https://test.proxy.com')
            .get('/another/path')
            .reply(200, 'success')

        server = new SSRServer(options)

        // Use an empty path under the proxy root, so that we test for a
        // specific fault that occurred when proxying that empty path.
        const path = '/mobify/proxy/base/'
        return doLocalFetch(path).then((response) => {
            // We expect that the redirecting URL was fetched
            expect(
                nockRedirect.isDone(),
                'Expected that first proxy request (301 redirect) would be fetched'
            ).toBe(true)

            // We expect that the redirect was followed
            expect(
                nockResponse.isDone(),
                'Expected that second proxy request (200 OK) would be fetched'
            ).toBe(true)

            // We expect a 200 (that nock returned)
            expect(response.status).toEqual(200)
        })
    })

    test('SSRServer proxies using loopback', () => {
        const loopOptions = Object.assign({}, options, {
            mainFilename: 'main5.js'
        })
        server = new SSRServer(loopOptions)

        const nockResponse = nock('https://test.proxy.com')
            .get('/loopback/path')
            .reply(200, 'success')

        // The main JS file will issue a fetch to the URL that we provide
        // in the URL parameter.
        const path = '/test?url=/mobify/proxy/base/loopback/path'
        return doLocalFetch(path)
            .then((response) => {
                expect(response.ok).toBe(true)

                expect(nockResponse.isDone(), 'Expected the proxy host to have had a request').toBe(
                    true
                )

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()

                expect(
                    text.includes('<p>success</p>'),
                    `Expected to find "success" in HTML ${text}`
                ).toBe(true)
            })
    })

    test('SSRServer proxying follows redirect', () => {
        // Use nock to mock out a host to which we proxy, plus
        // an alternate path on it to which we'll redirect
        const nockRedirect = nock('https://test.proxy.com')
            .get('/test/path')
            .reply(301, '', {Location: '/another/path'})

        const nockResponse = nock('https://test.proxy.com')
            .get('/another/path')
            .reply(200, 'success')

        server = new SSRServer(options)

        const path = '/mobify/proxy/base/test/path'
        return doLocalFetch(path).then((response) => {
            // We expect that the redirecting URL was fetched
            expect(
                nockRedirect.isDone(),
                'Expected that first proxy request (301 redirect) would be fetched'
            ).toBe(true)

            // We expect that the redirect was followed
            expect(
                nockResponse.isDone(),
                'Expected that second proxy request (200 OK) would be fetched'
            ).toBe(true)

            // We expect a 200 (that nock returned)
            expect(response.status).toEqual(200)
        })
    })

    test('SSRServer proxying rewrites headers', () => {
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

        server = new SSRServer(options)
        const path = `/mobify/proxy/base${targetPath}`
        const outgoingHeaders = new fetch.Headers()
        outgoingHeaders.set('Host', 'localhost:4567')
        outgoingHeaders.set('Origin', 'https://localhost:4567')
        outgoingHeaders.set('Cookie', 'abc=123')
        outgoingHeaders.append('x-multi-value', 'abc')
        outgoingHeaders.append('x-multi-value', 'def')

        return doLocalFetch(path, {headers: outgoingHeaders}).then((response) => {
            // We expect that the URL was fetched
            expect(nockResponse.isDone(), 'Expected that proxy request would be fetched').toBe(true)

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
            const setCookie = response.headers.get('set-cookie')
            expect(setCookie || '', 'Expected to get a set-cookie header').toEqual('xyz=456')

            // Verify that the x-proxy-request-url header is present in
            // the response
            const requestUrl = response.headers.get(X_PROXY_REQUEST_URL)
            expect(requestUrl).toEqual(`https://test.proxy.com${targetPath}`)
        })
    })

    test('SSRServer caching proxy restricts methods', () => {
        // Use nock to mock out a host to which we proxy, though we
        // do not expect the request to be made.
        const nockResponse = nock('https://test.proxy.com')
            .get('/test/path3')
            .reply(200, 'OK')

        server = new SSRServer(options)
        const path = '/mobify/caching/base3/test/path3'

        return doLocalFetch(path, {
            // This method is not allowed
            method: 'PUT'
        }).then((response) => {
            // We expect that the URL was NOT fetched
            expect(nockResponse.isDone(), 'Expected that proxy request would not be fetched').toBe(
                false
            )

            // We expect a 405 (from the proxying code)
            expect(response.status).toEqual(405)
        })
    })

    test('SSRServer caching proxy filters headers', () => {
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

        server = new SSRServer(options)
        const path = '/mobify/caching/base3/test/path3'

        return doLocalFetch(path, {
            headers: {
                // These headers are disallowed and should be removed
                'x-mobify-access-key': '12345',
                'cache-control': 'no-cache',
                cookie: 'abc=123',
                // These headers are allowed
                'accept-encoding': 'gzip',
                'accept-language': 'en'
            }
        }).then((response) => {
            // We expect that the URL was fetched
            expect(nockResponse.isDone(), 'Expected that proxy request would be fetched').toBe(true)

            // We expect a 200 (from the proxying code)
            expect(response.status).toEqual(200)
        })
    })

    test('SSRServer proxying handles error', () => {
        server = new SSRServer(options)

        const path = '/mobify/proxy/base2/test/path'
        return doLocalFetch(path).then((response) => {
            // We expect a 500
            expect(response.status).toEqual(500)
        })
    })

    class ProxyTestServer extends SSRServer {
        requestHook(request, response, next, options) {
            expect(options).toBeDefined()
            const proxyConfigs = options.proxyConfigs
            expect(proxyConfigs).toBeDefined()
            if (request.originalUrl === '/test/path') {
                proxyConfigs[0].proxy(request, response, next)
            } else {
                next()
            }
        }
    }

    test('SSRServer proxying in requestHook', () => {
        const nockResponse = nock('https://test.proxy.com')
            .get('/test/path')
            .reply(200, function() {
                const headers = this.req.headers
                expect(headers.host).toEqual('test.proxy.com')
                expect(headers.origin).toEqual('https://test.proxy.com')
                return 'Success'
            })

        server = new ProxyTestServer(options)

        const path = '/test/path'
        const outgoingHeaders = new fetch.Headers()
        outgoingHeaders.set('Host', 'localhost:4567')
        outgoingHeaders.set('Origin', 'https://localhost:4567')
        return doLocalFetch(path, {headers: outgoingHeaders})
            .then((response) => {
                // We expect that the redirecting URL was fetched
                expect(nockResponse.isDone(), 'Expected that proxy request would be fetched').toBe(
                    true
                )

                // We expect a 200 (that nock returned)
                expect(response.status).toEqual(200)

                return response.text()
            })
            .then((body) => {
                expect(body).toEqual('Success')
            })
    })

    test('SSRServer handles /mobify/ping', () => {
        server = new SSRServer(options)

        const path = '/mobify/ping'
        return doLocalFetch(path).then((response) => {
            // We expect a 200
            expect(response.ok)
            expect(response.status).toEqual(200)
        })
    })

    const testUrl = `https://localhost:${TEST_PORT}/test`
    const xhrTestCases = [
        {
            name: 'XMLHttpRequest to a full host is allowed',
            url: testUrl,
            expectedUrl: testUrl
        },
        {
            name: 'XMLHttpRequest to a proxy path is allowed',
            url: '/mobify/proxy/base/test?abc=123',
            expectedUrl: `${LOCALHOST_BASE}/mobify/proxy/base/test?abc=123`
        }
    ]

    // Add a requestHook to the SSRServer so that we can
    // use it as a test server and make actual requests to
    // it.
    class XHRSSRServer extends SSRServer {
        requestHook(request, response, next) {
            if (request.path.startsWith('/test')) {
                console.log(`Test server responding for ${request.path}`)
                response.status(200).send('Success')
            } else {
                next()
            }
        }
    }

    const xhrOptions = _.cloneDeep(options)
    xhrOptions.mainFilename = 'main4.js'
    xhrOptions.mobify.ssrParameters.proxyConfigs[0].host = `localhost:${TEST_PORT}`
    xhrOptions.quiet = false
    xhrOptions.strictSSL = false

    xhrTestCases.forEach((testCase) =>
        test(testCase.name, () => {
            server = new XHRSSRServer(xhrOptions)
            return doLocalFetch(
                // We must encode the URL to avoid confusing ExpressJS
                `/?url=${encodeURIComponent(testCase.url)}`
            )
                .then((response) => {
                    expect(response.ok).toBe(true)

                    // Extract the response HTML as a String
                    return response.text()
                })
                .then((text) => {
                    expect(text).toBeTruthy()
                    const expected = testCase.expectedUrl
                        ? `<p>responseURL=${testCase.expectedUrl}`
                        : testCase.expectedText
                    expect(
                        text.includes(expected),
                        `Expected to find '${expected}' in HTML: ${text}`
                    ).toBe(true)
                })
        })
    )

    const optimizationTestCases = [
        {
            ...options,
            optimizeCSS: false
        },
        {
            ...options,
            optimizeCSS: true
        }
    ]
    optimizationTestCases.forEach((testOptions) =>
        test(`SSRServer with CSS optimization set to ${testOptions.optimizeCSS}`, () => {
            server = new SSRServer(testOptions)
            expect.assertions(6)

            const mock = sandbox.spy(SSRServer.Rendering.prototype, 'doCSSOptimization')

            // This will render the test fixture PWA.
            const path = `/optimizeCSS${testOptions.optimizeCSS}`
            return doLocalFetch(path)
                .then((response) => {
                    expect(response.ok).toBe(true)

                    // Extract the response HTML as a String
                    return response.text()
                })
                .then((text) => {
                    expect(text).toBeTruthy()

                    // Check that there's no error comment
                    expect(
                        text.includes('Error in rendering'),
                        'Did not expect to find an error-page comment'
                    ).toBe(false)

                    // Check that optimization was or was not called
                    expect(mock.called).toBe(testOptions.optimizeCSS)

                    // Check the inline style - if we don't optimize,
                    // we expect an empty element.
                    expect(
                        text.includes('<style id="x-inline-styles">'),
                        'Expected to find start of x-inline-styles element'
                    ).toBe(true)
                    expect(
                        text.includes('<style id="x-inline-styles"></style>'),
                        'Expected to find correct x-inline-styles element content'
                    ).toBe(!testOptions.optimizeCSS)
                })
        })
    )

    const environmentTestCases = [
        {
            BUNDLE_ID: '123',
            DEPLOY_ID: '456',
            DEPLOY_TARGET: 'test'
        },
        {}
    ]
    environmentTestCases.forEach((testCase) =>
        test('SSRServer calls requestHook, responseHook and writeResponse', () => {
            process.env = testCase

            const bundleId = testCase.BUNDLE_ID || 'development'
            const deployId = testCase.DEPLOY_ID || '0'
            const deployTarget = testCase.DEPLOY_TARGET || 'local'

            server = new SSRServer(options)
            const requestHook = sandbox.spy(server, 'requestHook')
            const responseHook = sandbox.spy(server, 'responseHook')
            const writeResponse = sandbox.spy(server, 'writeResponse')

            return doLocalFetch('/').then((response) => {
                expect(response.ok).toBe(true)
                expect(requestHook.called, 'Expected requestHook to be called').toBe(true)
                expect(responseHook.called, 'Expected responseHook to be called').toBe(true)
                expect(writeResponse.called, 'Expected writeResponse to be called').toBe(true)

                let options = requestHook.args[0][3]
                expect(options.appHostname).toEqual(`localhost:${TEST_PORT}`)
                expect(options.appOrigin).toEqual(`https://localhost:${TEST_PORT}`)
                expect(options.bundleId).toEqual(bundleId)
                expect(options.deployId).toEqual(deployId)
                expect(options.deployTarget).toEqual(deployTarget)
                expect(options.local).toBe(true)
                expect(options.fetch).toBeDefined()

                options = responseHook.args[0][2]
                expect(options.appHostname).toEqual(`localhost:${TEST_PORT}`)
                expect(options.appOrigin).toEqual(`https://localhost:${TEST_PORT}`)
                expect(options.bundleId).toEqual(bundleId)
                expect(options.deployId).toEqual(deployId)
                expect(options.deployTarget).toEqual(deployTarget)
                expect(options.local).toBe(true)
            })
        })
    )

    const scriptTestCases = [
        {
            name: 'SSRServer renders with JQuery & CaptureJS',
            jquery: true,
            capturejs: true
        },
        {
            name: 'SSRServer renders without JQuery & CaptureJS',
            jquery: false,
            capturejs: false
        }
    ]

    scriptTestCases.forEach((testCase) =>
        test(testCase.name, () => {
            const newOptions = Object.assign({}, options, {
                loadCaptureJS: testCase.capturejs,
                loadJQuery: testCase.jquery
            })
            server = new SSRServer(newOptions)

            // This will render the test fixture PWA.
            return doLocalFetch('/')
                .then((response) => {
                    expect(response.ok).toBe(true)

                    // Extract the response HTML as a String
                    return response.text()
                })
                .then((text) => {
                    // Check server-side
                    const expectJQ = `JQuery is ${testCase.jquery ? 'present' : 'missing'}`
                    expect(text.includes(expectJQ)).toBe(true)

                    const expectWP$ = `window.Progressive.$ is ${
                        testCase.jquery ? 'present' : 'missing'
                    }`
                    expect(text.includes(expectWP$)).toBe(true)

                    const expectCapture = `CaptureJS is ${testCase.jquery ? 'present' : 'missing'}`
                    expect(text.includes(expectCapture)).toBe(true)

                    // Check client-side
                    expect(text.includes('id="jquery.min.js"')).toBe(!!testCase.jquery)
                    expect(text.includes('window.Progressive.$=window.$;')).toBe(!!testCase.jquery)
                    expect(text.includes('id="capture.min.js"')).toBe(!!testCase.capturejs)
                })
        })
    )

    test('SSRServer handles missing stylesheet', () => {
        const newOptions = Object.assign({}, options, {
            stylesheetFilename: 'nosuchfile.css'
        })
        server = new SSRServer(newOptions)
        expect.assertions(3)

        return doLocalFetch('/')
            .then((response) => {
                expect(response.ok).toBe(true)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                const inlineStyle = '<style id="x-inline-styles"></style>'
                expect(
                    text.includes(inlineStyle),
                    `Expected empty element "${inlineStyle}" to be in HTML`
                ).toBe(true)
            })
    })

    test('SSRServer serves worker.js', () => {
        server = new SSRServer(options)

        return doLocalFetch('/worker.js')
            .then((response) => {
                expect(response.ok).toBe(true)
                // Extract the response text as a string
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                const workerSource = fs.readFileSync(
                    path.resolve(process.cwd(), 'src/ssr/test_fixtures/worker.js'),
                    'utf8'
                )
                expect(text).toEqual(workerSource)
            })
    })

    test('SSRServer serves worker.js.map', () => {
        server = new SSRServer(options)

        return doLocalFetch('/worker.js.map')
            .then((response) => {
                expect(response.ok).toBe(true)
                // Extract the response text as a string
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                const workerSource = fs.readFileSync(
                    path.resolve(process.cwd(), 'src/ssr/test_fixtures/worker.js.map'),
                    'utf8'
                )
                expect(text).toEqual(workerSource)
            })
    })

    test('SSRServer handles missing worker.js', () => {
        server = new SSRServer(options)

        const workerFullPath = path.resolve(process.cwd(), 'src/ssr/test_fixtures/worker.js')

        const originalExists = fs.existsSync.bind(fs)
        const exists = sandbox.stub(fs, 'existsSync')
        exists.withArgs(workerFullPath).returns(false)
        exists.callsFake(originalExists)

        return doLocalFetch('/worker.js').then((response) => {
            expect(response.ok).toBe(false)
            expect(response.status).toEqual(404)
        })
    })

    test('SSRServer serves bundle assets', () => {
        server = new SSRServer(options)
        expect.assertions(3)

        return doLocalFetch('/mobify/bundle/development/no-op.js')
            .then((response) => {
                expect(response.ok).toBe(true)

                // Extract the response HTML as a String
                return response.text()
            })
            .then((text) => {
                expect(text).toBeTruthy()
                const source = fs.readFileSync(
                    path.resolve(process.cwd(), 'src/ssr/test_fixtures/no-op.js'),
                    'utf8'
                )
                expect(text).toEqual(source)
            })
    })

    test('SSRServer serves favicon', () => {
        const newOptions = Object.assign({}, options)
        const faviconPath = path.resolve(process.cwd(), 'src/ssr/test_fixtures/favicon.ico')
        newOptions.faviconPath = faviconPath
        server = new SSRServer(newOptions)
        expect.assertions(2)

        return doLocalFetch('/favicon.ico')
            .then((response) => {
                expect(response.ok).toBe(true)

                // Extract the response data
                return response.arrayBuffer()
            })
            .then((data) => {
                const responseData = new Uint8Array(data)
                const iconData = fs.readFileSync(faviconPath)
                expect(iconData.equals(responseData)).toBe(true)
            })
    })

    test('SSRServer missing favicon', () => {
        server = new SSRServer(options)
        expect.assertions(2)

        return doLocalFetch('/favicon.ico').then((response) => {
            expect(response.ok).toBe(false)
            expect(response.status).toBe(404)
        })
    })

    test('SSRServer creates cache on demand', () => {
        server = new SSRServer(options)
        expect(server._applicationCache).toBe(null)
        const cache = server.applicationCache
        expect(cache).toBeInstanceOf(PersistentCache)
        // Verify the backwards-compatibility property works
        expect(server.persistentCache).toEqual(cache)
    })

    test('SSRServer spots missing files', () => {
        const newOptions = Object.assign({}, options)
        newOptions.mainFilename = 'main2.js'
        newOptions.mobify = Object.assign({}, testPackageMobify)

        // Remove the shared files and replace with a single glob
        // pattern
        newOptions.mobify.ssrShared = ['*op2.js']

        expect.assertions(4)

        server = new SSRServer(newOptions)
        return doLocalFetch('/')
            .then((response) => {
                expect(response.ok).toBe(true)
                return response.text()
            })
            .then((text) => {
                const notListed = 'files referenced in the document <head> are not listed'
                expect(text.includes(notListed), `Expected "${notListed}" in the HTML`).toBe(true)

                // We expect to find no-op because it's not included in
                // the ssrFiles
                expect(text.includes('no-op.js'), 'Expected to find "no-op.js" in the HTML').toBe(
                    true
                )

                // We don't expect to find no-op2 because it's included
                // in the ssrShared glob pattern
                expect(
                    text.includes('no-op2.js'),
                    'Did not expect to find "no-op2.js" in the HTML'
                ).toBe(false)
            })
    })

    /* requestHook tests */
    let requestHookPromise
    let requestHookResponse
    class RequestHookSSRServer extends SSRServer {
        requestHook(request, response, next, options) {
            requestHookResponse = response
            if (request.path === '/1') {
                this.respondFromBundle({
                    request,
                    response
                })
            } else if (request.path === '/2') {
                response.redirect(302, '/elsewhere')
            } else if (request.path === '/3') {
                throw new Error('This is an intentional error')
            } else if (request.path === '/4') {
                const result = {
                    method: request.method,
                    body: request.body
                }
                response
                    .status(200)
                    .set('Content-Type', 'application/json')
                    .send(JSON.stringify(result, null, 2))
                    .end()
            } else if (request.path === '/5') {
                // Validate the options
                expect(options.local).toBe(true)
                expect(options.bundleId).toEqual('development')
                expect(options.deployId).toEqual('0')
                expect(options.deployTarget).toEqual('local')
                expect(options.fetch).toEqual(windowFetch)
                expect(options.appHostname).toEqual(`localhost:${TEST_PORT}`)
                expect(options.appOrigin).toEqual(`https://localhost:${TEST_PORT}`)
                response
                    .status(200)
                    .set('Content-Type', 'text/plain')
                    .send('options ok')
            } else if (request.path === '/6') {
                // Respond after a delay, and fulfil requestHookPromise
                // when we're done.
                requestHookPromise = new Promise((resolve) => {
                    setTimeout(() => {
                        try {
                            response
                                .status(200)
                                .set('X-Test', 'whatever')
                                .send('Delayed')
                        } finally {
                            resolve()
                        }
                    }, 100)
                })
            } else if (request.path === '/') {
                response
                    .status(200)
                    .set('Content-Type', 'text/plain')
                    .send('root')
            } else if (request.path === '/7') {
                // Expect there to be no cookies in the request
                expect(
                    request.headers.cookie,
                    'Did not expect to get a value for the Cookie header'
                ).toBeUndefined()

                // Expect that the Host header is set correctly
                expect(request.headers.host).toEqual(server.appHostname)

                // Expect that the Origin header is set correctly,
                // if it's passed.
                if (request.headers.origin) {
                    expect(request.headers.origin).toEqual(server.appOrigin)
                }

                // Add a set-cookie header that we expect to be
                // removed
                response
                    .status(200)
                    .cookie('abc', '123')
                    .send()
            } else if (request.path === '/400') {
                response.status(400).end()
            } else if (request.path === '/404') {
                response.status(404).end()
            } else if (request.path === '/500') {
                response.status(500).end()
            } else {
                next()
            }
        }

        // Fake a UPWA rendered page
        _ssr(req, res) {
            res.status(200)
                .set('Content-Type', 'text/html')
                .send('')
        }
    }

    const requestHookTestCases = [
        {
            name: 'expect bundle redirect',
            url: '/1',
            validate: (response, server) => {
                expect(response.status).toBe(301)
                expect(
                    response.headers.get('location').endsWith('/mobify/bundle/development/1')
                ).toBe(true)
                expect(server.sendMetric.calledWith('RequestHook')).toBe(true)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(true)
            }
        },
        {
            name: 'expect elsewhere redirect',
            url: '/2',
            validate: (response, server) => {
                expect(response.status).toBe(302)
                expect(response.headers.get('location').endsWith('/elsewhere')).toBe(true)
                expect(server.sendMetric.calledWith('RequestHook')).toBe(true)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(true)
            }
        },
        {
            name: 'expect error response',
            url: '/3',
            validate: (response, server) => {
                expect(response.status).toBe(500)
                expect(server.sendMetric.calledWith('RequestHook')).toBe(false)
                expect(server.sendMetric.calledWith('RequestHookError')).toBe(true)
            }
        },
        {
            name: 'expect to handle POST (text)',
            method: 'POST',
            type: 'text/plain',
            body: 'This is plain text',
            url: '/4',
            validate: (response, server) => {
                expect(response.status).toBe(200)
                expect(response.headers.get('content-type').includes('application/json')).toBe(true)
                return response.text().then((text) => {
                    const result = JSON.parse(text)
                    expect(result.method).toEqual('POST')
                    expect(result.body).toEqual('This is plain text')
                    expect(server.sendMetric.calledWith('RequestHook')).toBe(true)
                    expect(server.sendMetric.calledWith('RequestSuccess')).toBe(true)
                })
            }
        },
        {
            name: 'expect to handle POST (json)',
            method: 'POST',
            type: 'application/json',
            body: JSON.stringify({abc: 123, def: 456}),
            url: '/4',
            validate: (response, server) => {
                expect(response.status).toBe(200)
                expect(response.headers.get('content-type').includes('application/json')).toBe(true)
                return response.text().then((text) => {
                    const result = JSON.parse(text)
                    expect(result.method).toEqual('POST')
                    expect(result.body).toEqual({abc: 123, def: 456})
                    expect(server.sendMetric.calledWith('RequestHook')).toBe(true)
                    expect(server.sendMetric.calledWith('RequestSuccess')).toBe(true)
                })
            }
        },
        {
            name: 'expect to handle POST (x-www-form-urlencoded)',
            method: 'POST',
            type: 'application/x-www-form-urlencoded',
            body: 'abc=123&def=456',
            url: '/4',
            validate: (response, server) => {
                expect(response.status).toBe(200)
                expect(response.headers.get('content-type').includes('application/json')).toBe(true)
                return response.text().then((text) => {
                    const result = JSON.parse(text)
                    expect(result.method).toEqual('POST')
                    // Note that all values are strings with url-encoding
                    expect(result.body).toEqual({abc: '123', def: '456'})
                    expect(server.sendMetric.calledWith('RequestHook')).toBe(true)
                    expect(server.sendMetric.calledWith('RequestSuccess')).toBe(true)
                })
            }
        },
        {
            name: 'check options',
            url: '/5',
            validate: (response, server) => {
                expect(response.status).toBe(200)
                expect(server.sendMetric.calledWith('RequestHook')).toBe(true)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(true)

                return response.text().then((text) => {
                    expect(text).toEqual('options ok')
                })
            }
        },
        {
            name: 'delayed response',
            url: '/6',
            validate: (response, server) => {
                // Since the response sending has been delayed, we need
                // to wait on requestHookPromise before we validate.
                return requestHookPromise.then(() => {
                    expect(response.status).toBe(200)
                    expect(server.sendMetric.calledWith('RequestHook')).toBe(true)
                    expect(server.sendMetric.calledWith('RequestSuccess')).toBe(true)

                    return response.text().then((text) => {
                        expect(text).toEqual('Delayed')
                    })
                })
            }
        },
        {
            name: 'strip cookies',
            url: '/7',
            headers: {
                cookie: 'xyz=456'
            },
            validate: (response) => {
                expect(response.status).toBe(200)
                expect(
                    response.headers.has('set-cookie'),
                    'Did not expect a Set-Cookie header in the response'
                ).toBe(false)
            }
        },
        {
            name: 'fix up host and origin',
            url: '/7',
            headers: {
                host: 'somewhere.over.the.rainbow',
                origin: 'https://somewhere.over.the.rainbow'
            },
            validate: (response) => {
                expect(response.status).toBe(200)
                expect(
                    response.headers.has('set-cookie'),
                    'Did not expect a Set-Cookie header in the response'
                ).toBe(false)
            }
        },
        {
            name: 'expect UPWA to handle /999',
            url: '/999',
            validate: (response, server) => {
                expect(response.status).toBe(200)
                expect(response.headers.get('content-type').includes('text/html')).toBe(true)
                expect(server.sendMetric.calledWith('RequestHook')).toBe(false)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(true)
            }
        },
        {
            name: 'expect requestHook to handle /',
            url: '/',
            validate: (response, server) => {
                expect(response.status).toBe(200)
                expect(response.headers.get('content-type').includes('text/plain')).toBe(true)
                expect(server.sendMetric.calledWith('RequestHook')).toBe(true)
            }
        },
        {
            name: 'expect POST to / to be rejected',
            method: 'POST',
            url: '/',
            validate: (response) => {
                expect(response.status).toBe(405)
            }
        },
        {
            name: 'expect 400',
            url: '/400',
            validate: (response, server) => {
                expect(response.status).toBe(400)
                expect(server.sendMetric.calledWith('RequestFailed400')).toBe(true)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(false)
            }
        },
        {
            name: 'expect 404',
            url: '/404',
            validate: (response, server) => {
                expect(response.status).toBe(404)
                expect(server.sendMetric.calledWith('RequestFailed404')).toBe(true)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(false)
            }
        },
        {
            name: 'expect 500',
            url: '/500',
            validate: (response, server) => {
                expect(response.status).toBe(500)
                expect(server.sendMetric.calledWith('RequestFailed500')).toBe(true)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(false)
            }
        },
        {
            name: 'expect 405 for POST to non-root path',
            url: '/otherpath',
            method: 'POST',
            validate: (response, server) => {
                expect(response.status).toBe(405)
                expect(server.sendMetric.calledWith('RequestFailed400')).toBe(true)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(false)
            }
        },
        {
            name: 'expect 405 for POST to root',
            url: '/',
            method: 'POST',
            validate: (response, server) => {
                expect(response.status).toBe(405)
                expect(server.sendMetric.calledWith('RequestFailed400')).toBe(true)
                expect(server.sendMetric.calledWith('RequestSuccess')).toBe(false)
            }
        }
    ]

    requestHookTestCases.forEach((testCase) =>
        test(`SSRServer requestHook & metrics: ${testCase.name}`, () => {
            server = new RequestHookSSRServer(options)
            server.sendMetric = sandbox.stub()
            const fetchOptions = {
                redirect: 'manual',
                method: testCase.method || 'GET',
                headers: new fetch.Headers()
            }

            if (testCase.type) {
                fetchOptions.headers.set('Content-Type', testCase.type)
            }
            if (testCase.body) {
                fetchOptions.body = testCase.body
            }
            if (testCase.headers) {
                Object.entries(testCase.headers).forEach(([key, value]) => {
                    fetchOptions.headers.set(key, value)
                })
            }

            return doLocalFetch(testCase.url, fetchOptions)
                .then((response) => {
                    expect(requestHookResponse).toBeDefined()

                    // Wait until the response has fully completed - even
                    // though we have received it, some event handlers
                    // on it may not yet have fired. We can check the
                    // afterResponseCalled flag in the Response's locals
                    // object to see if the final function has been called.
                    return new Promise((resolve) => {
                        const wait = () => {
                            if (requestHookResponse.locals.afterResponseCalled) {
                                resolve(response)
                            } else {
                                setTimeout(wait, 5)
                            }
                        }
                        wait()
                    })
                })
                .then((response) => testCase.validate(response, server))
                .then(() => {
                    expect(server.sendMetric.calledWith('RequestTime')).toBe(true)
                })
        })
    )

    test('windowFetch rejects a Request object with a relative URL', () => {
        const url = `${PROXY_PATH_PREFIX}/base/path1`

        // Mock the request in case the test fails (we don't
        // want any network I/O).
        nock('https://www.merlinspotions.com')
            .get('/path1')
            .reply(200)

        getWindowFetchOptions().appOrigin = LOCALHOST_BASE

        return windowFetch(new Request(url))
            .then(() => {
                expect(true, 'Did not expect fetch to succeed').toBe(false)
            })
            .catch((err) => {
                expect(
                    err.message.includes('Request'),
                    'Expected that fetch rejected with an error about a ' +
                        `Request object, but got error message "${err.message}"`
                ).toBe(true)
            })
    })
})

describe('SSRServer persistent caching', () => {
    const options = {
        buildDir: './src/ssr/test_fixtures',
        routes: [/\//],
        mobify: testPackageMobify,
        optimizeCSS: true,
        sslFilePath: './src/ssr/test_fixtures/localhost.pem',
        quiet: true,
        port: TEST_PORT,
        fetchAgents: {
            https: httpsAgent
        },
        unsupportedBrowserRedirect: 'https://mobify.com'
    }

    class CachingSSRServer extends SSRServer {
        _ssr(req, res) {
            this.ssrCalled = true
            const status = parseInt(req.query.status || 200)
            let rendering
            switch (req.query.type) {
                case 'precompressed':
                    res.status(status)
                    res.setHeader('content-type', 'application/javascript')
                    res.setHeader('content-encoding', 'gzip')
                    res.send(zlib.gzipSync(fs.readFileSync(path.join(testFixtures, 'main-big.js'))))
                    break

                case 'image':
                    // Binary response
                    res.status(status)
                    res.setHeader('content-type', 'image/png')
                    res.send(fs.readFileSync(path.join(testFixtures, 'mobify.png')))
                    break

                case 'html':
                    // HTML response
                    res.setHeader('x-rendered', 'true')
                    res.setHeader('cache-control', 's-maxage=60')
                    rendering = {
                        isErrorResponse: false,
                        elapsedRenderTime: 0,
                        html: [
                            '<html>',
                            '<head><title>Test!</title></head>',
                            '<body>',
                            'Fake rendered page',
                            '</body>',
                            '</html>'
                        ]
                    }
                    this.writeResponse(req, res, rendering, {statusCode: status})
                    break

                default:
                    res.sendStatus(status)
                    break
            }

            this._completeResponse(res)
        }

        requestHook(request, response, next) {
            const key = request.query.cacheKey
            if (request.path === '/cacheme') {
                return this.getResponseFromCache({
                    request,
                    response,
                    key,
                    namespace: 'test'
                }).then((entry) => {
                    this.mostRecentKey = entry.key
                    this.mostRecentNamespace = entry.namespace
                    if (!entry.found) {
                        if (!request.query.noCache) {
                            const options = {
                                request,
                                response,
                                key,
                                namespace: entry.namespace
                            }

                            if (request.query.shouldcacheresponse) {
                                options.shouldCacheResponse = (req, res) => res.statusCode !== 400
                            }

                            this.cacheResponseWhenDone(options)
                        }
                        next()
                    } else {
                        if (entry.status !== 500) {
                            this.sendCachedResponse(entry)
                        } else {
                            next()
                        }
                    }
                })
            }
            next()
        }

        responseHook(request, response) {
            // Set a header here so that we can verify async behaviour.
            response.setHeader('x-response-hook-called', 'true')
        }
    }

    const sandbox = sinon.sandbox.create()
    let server
    afterEach(() => {
        sandbox.restore()
        if (server) {
            server.close()
            server = null
        }
    })

    beforeEach(() => {
        server = new CachingSSRServer(options)
        server.ssrCalled = false
    })

    const testCases = [
        {
            name: 'HTML response is cached',
            url: '/cacheme?type=html&shouldcacheresponse=1',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'x-rendered': 'true',
                'content-type': 'text/html; charset=utf-8'
            },
            expectToBeCached: true,
            expectSSRCalled: true
        },
        {
            name: 'HTML response is cached with explicit key',
            url: '/cacheme?type=html&cacheKey=abcdefghijkl',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'x-rendered': 'true',
                'content-type': 'text/html; charset=utf-8'
            },
            expectToBeCached: true,
            expectSSRCalled: true
        },
        {
            name: 'Binary response is cached',
            url: '/cacheme?type=image&shouldcacheresponse=1',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'content-type': 'image/png'
            },
            expectToBeCached: true,
            expectSSRCalled: true
        },
        {
            name: 'Response without caching',
            url: '/cacheme?type=image&noCache=1',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'content-type': 'image/png'
            },
            expectToBeCached: false,
            expectSSRCalled: true
        },
        {
            name: 'Response with cache put failure',
            url: '/cacheme?type=image&a=1',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'false',
                'content-type': 'image/png'
            },
            expectToBeCached: false,
            expectSSRCalled: true,
            forcePutFailure: true
        },
        {
            name: 'Response from cache',
            url: '/cacheme?type=html',
            expectOk: true,
            expectHeaders: {
                'x-precached': 'true',
                'x-mobify-from-cache': 'true',
                'content-type': 'text/html; charset=utf-8'
            },
            expectToBeCached: true,
            expectSSRCalled: false,
            preCache: {
                cacheKey: '12345678',
                data: Buffer.from('<html>456</html>'),
                metadata: {
                    status: 200,
                    headers: {
                        'x-precached': 'true',
                        'content-type': 'text/html; charset=utf-8'
                    }
                }
            }
        },
        {
            name: 'Response from cache (no headers)',
            url: '/cacheme?type=html&headers=none',
            expectOk: true,
            expectHeaders: {
                'x-mobify-from-cache': 'true'
            },
            expectToBeCached: true,
            expectSSRCalled: false,
            preCache: {
                cacheKey: 'abcdefgh',
                data: Buffer.from('<html>123</html>')
            }
        },
        {
            name: 'Empty response from cache',
            url: '/cacheme?type=none',
            expectOk: true,
            expectHeaders: {
                'x-precached': 'true',
                'x-mobify-from-cache': 'true'
            },
            expectToBeCached: true,
            expectSSRCalled: false,
            preCache: {
                cacheKey: '87654321',
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
        test(testCase.name, () => {
            let responseHeaders

            let url = testCase.url

            let initialPromise
            const preCache = testCase.preCache
            if (preCache) {
                initialPromise = server.applicationCache.put({
                    namespace: 'test',
                    key: preCache.cacheKey,
                    metadata: preCache.metadata,
                    data: preCache.data
                })
                url += `&cacheKey=${testCase.preCache.cacheKey}`
            } else {
                initialPromise = Promise.resolve()
            }

            if (testCase.forcePutFailure) {
                sandbox.stub(server.applicationCache, 'put')
                server.applicationCache.put
                    .onFirstCall()
                    .callsFake(() => Promise.reject('Fake put error'))
                server.applicationCache.put.callThrough()
            }

            return (
                initialPromise
                    .then(() => doLocalFetch(url))
                    // Wait for any caching to complete
                    .then((response) => server._waitForResponses().then(() => response))
                    // Handle and verify the response
                    .then((response) => {
                        expect(response.ok).toEqual(testCase.expectOk)

                        expect(
                            server.ssrCalled,
                            `Expected ssrCalled to be ${testCase.expectSSRCalled} but got ${server.ssrCalled}`
                        ).toEqual(testCase.expectSSRCalled)

                        responseHeaders = response.headers
                        Object.entries(testCase.expectHeaders || {}).forEach(([key, value]) => {
                            const actual = responseHeaders.get(key)
                            expect(
                                actual,
                                `Expected response header "${key}" to be "${value}" but got "${actual}"`
                            ).toEqual(value)
                        })

                        const cacheKey = server.mostRecentKey
                        const cacheNamespace = server.mostRecentNamespace
                        expect(cacheKey).toBeTruthy()
                        expect(cacheNamespace).toBeTruthy()
                        return Promise.all([
                            response.arrayBuffer(),
                            server.applicationCache.get({
                                key: cacheKey,
                                namespace: cacheNamespace
                            })
                        ])
                    })
                    // Verify the response data against the cache
                    .then(([responseData, cached]) => {
                        expect(responseData).toBeDefined()
                        expect(cached).toBeDefined()
                        expect(
                            cached.found,
                            `Expected cached.found to be ${testCase.expectToBeCached} but got ${cached.found}`
                        ).toEqual(testCase.expectToBeCached)

                        if (testCase.expectToBeCached) {
                            const headers = cached.metadata && cached.metadata.headers
                            responseHeaders.entries(([key, value]) => {
                                expect(headers && headers[key]).toEqual(value)
                            })

                            const responseAsBuffer = Buffer.from(responseData)
                            if (responseAsBuffer.length) {
                                expect(cached.data).toEqual(responseAsBuffer)
                            } else {
                                expect(cached.data).toBeFalsy()
                            }
                        }
                    })
            )
        })
    )

    test('Cached 500 error response is ignored', () => {
        const url = '/cacheme?status=500&type=html'

        // Fetch the response - this will cache a 500
        return (
            doLocalFetch(url)
                // Wait for any caching to complete
                .then((response) => server._waitForResponses().then(() => response))
                // Verify we got the 500 that we expect
                .then((response) => {
                    expect(response.status).toEqual(500)
                    expect(response.headers.get('x-mobify-from-cache')).toEqual('false')

                    // Verify that the 500 response was cached
                    return server.applicationCache.get({
                        key: server.mostRecentKey,
                        namespace: server.mostRecentNamespace
                    })
                })
                .then((entry) => {
                    expect(entry.found).toBe(true)
                    expect(entry.metadata.status).toEqual(500)

                    // Repeat the fetch - the entry should not be used
                    return doLocalFetch(url)
                })
                .then((response) => {
                    expect(response.status).toEqual(500)
                    expect(response.headers.get('x-mobify-from-cache')).toBeFalsy()
                })
        )
    })

    test('400 error response is not cached', () => {
        const url = '/cacheme?status=400&type=html&shouldcacheresponse=1'

        // Fetch the response - this will return a 400 that should not be cached
        return (
            doLocalFetch(url)
                // Wait for any caching to complete
                .then((response) => server._waitForResponses().then(() => response))
                // Verify we got the 400 that we expect
                .then((response) => {
                    expect(response.status).toEqual(400)
                    expect(response.headers.get('x-mobify-from-cache')).toEqual('false')

                    // Verify that the response was not cached
                    return server.applicationCache.get({
                        key: server.mostRecentKey,
                        namespace: server.mostRecentNamespace
                    })
                })
                .then((entry) => {
                    expect(entry.found).toBe(false)
                })
        )
    })

    test('Caching of compressed responses', () => {
        // ADN-118 reported that a cached response was correctly sent
        // the first time, but was corrupted the second time. This
        // test is specific to that issue.
        const url = '/cacheme?type=html&shouldcacheresponse=1'

        let firstResponseText
        return (
            doLocalFetch(url)
                // Wait for any caching to complete
                .then((response) => server._waitForResponses().then(() => response))
                // Verify we got the response
                .then((response) => {
                    expect(response.status).toEqual(200)
                    expect(response.headers.get('x-mobify-from-cache')).toEqual('false')
                    expect(response.headers.get('content-encoding')).toEqual('gzip')

                    return response.text()
                })
                .then((text) => {
                    // Save the response body
                    firstResponseText = text

                    // Verify that the response was cached
                    return server.applicationCache.get({
                        key: server.mostRecentKey,
                        namespace: server.mostRecentNamespace
                    })
                })
                .then((entry) => {
                    expect(entry.found).toBe(true)
                    expect(entry.data.toString()).toEqual(firstResponseText)

                    // Repeat the fetch
                    return doLocalFetch(url)
                })
                // Wait for any caching to complete
                .then((response) => server._waitForResponses().then(() => response))
                // Verify we got the response
                .then((response) => {
                    expect(response.status).toEqual(200)
                    expect(response.headers.get('x-mobify-from-cache')).toEqual('true')
                    expect(response.headers.get('content-encoding')).toEqual('gzip')
                    return response.text()
                })
                .then((text) => {
                    expect(text).toEqual(firstResponseText)
                })
        )
    })

    test('Compressed responses are not re-compressed', () => {
        const url = '/cacheme?type=precompressed&shouldcacheresponse=1'

        let responseText
        return (
            doLocalFetch(url)
                // Wait for any caching to complete
                .then((response) => server._waitForResponses().then(() => response))
                // Verify we got the response
                .then((response) => {
                    expect(response.status).toEqual(200)
                    expect(response.headers.get('x-mobify-from-cache')).toEqual('false')
                    expect(response.headers.get('content-encoding')).toEqual('gzip')

                    return response.text()
                })
                .then((text) => {
                    responseText = text
                    // Verify that the response was cached
                    return server.applicationCache.get({
                        key: server.mostRecentKey,
                        namespace: server.mostRecentNamespace
                    })
                })
                .then((entry) => {
                    expect(entry.found).toBe(true)
                    const uncompressed = zlib.gunzipSync(entry.data)
                    expect(uncompressed.toString()).toEqual(responseText)
                })
        )
    })

    test('Try to send non-cached response', () => {
        expect(() => server.sendCachedResponse(new CachedResponse({}))).toThrow('non-cached')
    })
})

describe('generateCacheKey', () => {
    let headers
    const request = {
        url: undefined,
        query: {},
        get: (key) => headers[key]
    }

    beforeEach(() => {
        headers = {}
        request.url = '/test?a=1'
        setRemote(false)
    })

    test('returns expected results', () => {
        request.url = '/test/1?id=abc'

        expect(SSRServer.generateCacheKey(request).indexOf('/test/1')).toEqual(0)
    })

    test('path affects key', () => {
        request.url = '/test2a/'
        const result1 = SSRServer.generateCacheKey(request)
        request.url = '/testab/'
        expect(SSRServer.generateCacheKey(request)).not.toEqual(result1)
    })

    test('query affects key', () => {
        request.url = '/test3?a=1'
        const result1 = SSRServer.generateCacheKey(request)
        request.url = '/test3?a=2'
        expect(SSRServer.generateCacheKey(request)).not.toEqual(result1)
    })

    test('user agent affects key locally', () => {
        const result1 = SSRServer.generateCacheKey(request)
        headers['user-agent'] =
            'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
        expect(SSRServer.generateCacheKey(request)).not.toEqual(result1)
        // query string and device type is hashed
        expect(SSRServer.generateCacheKey(request)).toEqual(
            '/test/90dbd5d83ae3a790c57333a47252507ecaf7dfad87fd3172d2dd1bdf9c73018c'
        )
    })

    test('CloudFront device headers affects key remotely', () => {
        setRemote(true)
        const result1 = SSRServer.generateCacheKey(request)
        headers['CloudFront-Is-Desktop-Viewer'] = 'false'
        headers['CloudFront-Is-Mobile-Viewer'] = 'true'
        headers['CloudFront-Is-SmartTV-Viewer'] = 'false'
        headers['CloudFront-Is-Tablet-Viewer'] = 'false'
        expect(SSRServer.generateCacheKey(request)).not.toEqual(result1)
        expect(SSRServer.generateCacheKey(request)).toEqual(
            '/test/90dbd5d83ae3a790c57333a47252507ecaf7dfad87fd3172d2dd1bdf9c73018c'
        )
    })

    test('multiple CloudFront device headers affect key remotely', () => {
        setRemote(true)
        headers['CloudFront-Is-Desktop-Viewer'] = 'false'
        headers['CloudFront-Is-Mobile-Viewer'] = 'true'
        headers['CloudFront-Is-SmartTV-Viewer'] = 'false'
        headers['CloudFront-Is-Tablet-Viewer'] = 'true'

        expect(SSRServer.generateCacheKey(request)).toEqual(
            '/test/36aa12995507268baf7f2369cba7bd6092120597cef8283771e9813a9dfb78a6'
        )
    })

    test('request class affects key', () => {
        const result1 = SSRServer.generateCacheKey(request)
        headers['x-mobify-request-class'] = 'bot'
        expect(SSRServer.generateCacheKey(request)).not.toEqual(result1)

        expect(SSRServer.generateCacheKey(request, {ignoreRequestClass: true})).toEqual(result1)
    })

    test('extras affect key', () => {
        const result1 = SSRServer.generateCacheKey(request)
        expect(SSRServer.generateCacheKey(request, {extras: ['123']})).not.toEqual(result1)
    })
})

// We import the polyfills just to exercise the code
test('Polyfills', () => {
    polyfills.applyPolyfills()
    expect(window.CustomEvent).toBeDefined()
    expect(Array.prototype.includes).toBeDefined()
})

describe('ScriptTag', () => {
    test('Supports inline scripts', () => {
        const attrs = {id: 'some-id'}
        const content = 'console.log("foo")'
        const tag = new ScriptTag(attrs, content)
        expect(tag).toEqual(`<script id="some-id" type="text/javascript">${content}</script>`)
        expect(tag.hash).toEqual(hashInlineScript(content))
    })

    test('Supports external scripts', () => {
        const attrs = {src: 'https://www.example.com/some-script.js'}
        const tag = new ScriptTag(attrs)
        expect(tag).toEqual(
            '<script src="https://www.example.com/some-script.js" type="text/javascript"></script>'
        )
        expect(tag.hash).toBe(null)
    })
})
