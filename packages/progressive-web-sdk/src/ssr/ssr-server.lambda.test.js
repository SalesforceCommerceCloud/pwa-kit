/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* global jest, describe, test */

/* eslint-env jest */
/* eslint import/no-commonjs:0 */
/* eslint max-nested-callbacks:0 */

// Mock static assets (require path is relative to the 'ssr' directory)
const mockStaticAssets = {}
jest.mock('../static/assets.json', () => mockStaticAssets, {virtual: true})

// We use require() for the ssr-server since we have to mock a module
// that it needs.
const {SSRServer} = require('./ssr-server')
const AWSTestUtils = require('aws-lambda-test-utils')
const crypto = require('crypto')
const fs = require('fs')
const nock = require('nock')
const https = require('https')
const sinon = require('sinon')
const path = require('path')
const zlib = require('zlib')

const {X_HEADERS_TO_REMOVE} = require('../utils/ssr-proxy-utils')

const TEST_PORT = 3446

const testPackageMobify = {
    pageNotFoundURL: '/page-not-found',
    ssrEnabled: true,
    ssrOnly: ['main.js.map', 'ssr.js', 'ssr.js.map', 'vendor.js.map'],
    ssrShared: ['main.css', 'main.js', 'ssr-loader.js', 'vendor.js', 'worker.js'],
    ssrParameters: {
        proxyProtocol1: 'http',
        proxyHost1: 'test.proxy.com',
        proxyPath1: 'base',
        proxyProtocol2: 'https',
        // This is intentionally an unreachable host
        proxyHost2: '0.0.0.0',
        proxyPath2: 'base2'
    }
}

// Set up the mocked staticAssets object
SSRServer.SCRIPT_FILES.forEach((scriptPath) => {
    const base = path.basename(scriptPath)
    mockStaticAssets[base] = `// no-op (${base})\n`
})
mockStaticAssets['jquery.min.js'] = '// Fake JQuery\nwindow.$ = () => false\n'
mockStaticAssets['capture.min.js'] = '// Fake CaptureJS\nwindow.Capture = () => false\n'

// Some of our tests require that the 'temp' directory
// exists.
const tempDir = path.resolve(process.cwd(), 'temp')
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
}
const testFixtures = path.resolve(process.cwd(), 'src/ssr/test_fixtures')

/**
 * An HTTPS.Agent that allows self-signed certificates
 * @type {module:https.Agent}
 */
export const httpsAgent = new https.Agent({
    rejectUnauthorized: false
})

describe('SSRServer Lambda integration', () => {
    const savedEnvironment = Object.assign({}, process.env)
    const sandbox = sinon.sandbox.create()
    let server
    afterEach(() => {
        sandbox.restore()
        nock.cleanAll()
        if (server) {
            server.close()
            server = null
        }
    })
    afterAll(() => {
        process.env = savedEnvironment
    })
    beforeEach(() => {
        // Ensure the environment is set up
        process.env = {
            LISTEN_ADDRESS: '',
            BUNDLE_ID: 1,
            DEPLOY_TARGET: 'test',
            EXTERNAL_DOMAIN_NAME: 'test.com',
            MOBIFY_PROPERTY_ID: 'test'
        }
    })

    const fakeBinaryPayload = crypto.randomBytes(16)
    const jsPayload = '// This is JavaScript'
    const redirectTarget =
        '/webapp/wcs/stores/servlet/prod_55555_10001_048010312563_-1002?shipToCntry=AU'

    class TestSSRServer extends SSRServer {
        requestHook(request, response, next) {
            if (request.path === '/mobify.png') {
                // Return a binary payload
                response
                    .status(200)
                    .set('Content-Type', 'image/png')
                    .send(fakeBinaryPayload)
            } else if (request.path === '/mobify.png.gzip') {
                // Return a gzipped binary payload
                response
                    .status(200)
                    .set('Content-Type', 'image/png')
                    .set('Content-Encoding', 'gzip')
                    .send(zlib.gzipSync(fakeBinaryPayload))
            } else if (request.path === '/mobify.png.astext') {
                // Return a gzipped binary payload using a non-binary
                // content type.
                response
                    .status(200)
                    .set('Content-Type', 'text/plain')
                    .set('Content-Encoding', 'gzip')
                    .send(zlib.gzipSync(fakeBinaryPayload))
            } else if (request.path === '/mobify.js') {
                // Return JS text
                response
                    .status(200)
                    .set('Content-Type', 'application/javascript')
                    .send(Buffer.from(jsPayload, 'utf8'))
            } else if (request.path === '/headers') {
                // Return the request headers as JSON
                response
                    .status(200)
                    .set('Content-Type', 'application/json')
                    .send(JSON.stringify(request.headers))
            } else if (request.path === '/redirect301') {
                response.redirect(301, redirectTarget)
            } else if (request.path === '/redirect302') {
                response.redirect(redirectTarget)
            } else {
                next()
            }
        }
    }

    const lambdaTestCases = [
        {
            name: 'plain HTML response',
            path: '/',
            validate: (response) => {
                expect(response.statusCode).toBe(200)
                expect(response.isBase64Encoded).toBe(false)
                const contentType = response.headers['content-type']
                expect(contentType).toBeDefined()
                expect(contentType.startsWith('text/html')).toBe(true)
                expect(response.headers['content-encoding']).toBeFalsy()
                expect(response.body.includes('<html>')).toBe(true)
            }
        },
        {
            name: 'binary response',
            path: '/mobify.png',
            validate: (response) => {
                expect(response.statusCode).toBe(200)
                expect(response.isBase64Encoded).toBe(true)
                expect(response.headers['content-type']).toEqual('image/png')
                expect(response.headers['content-encoding']).toBeFalsy()
                const data = Buffer.from(response.body, 'base64')
                expect(data).toEqual(fakeBinaryPayload)
            }
        },
        {
            name: 'binary gzipped response',
            path: '/mobify.png.gzip',
            validate: (response) => {
                expect(response.statusCode).toBe(200)
                expect(response.isBase64Encoded).toBe(true)
                const headers = response.headers
                expect(headers).toBeDefined()
                expect(headers['content-type']).toEqual('image/png')
                expect(headers['content-encoding']).toEqual('gzip')
                const data = Buffer.from(response.body, 'base64')
                const unzipped = zlib.gunzipSync(data)
                expect(unzipped).toEqual(fakeBinaryPayload)
            }
        },
        {
            name: 'binary gzipped text response',
            path: '/mobify.png.astext',
            validate: (response) => {
                expect(response.statusCode).toBe(200)
                expect(response.isBase64Encoded).toBe(true)
                const headers = response.headers
                expect(headers).toBeDefined()
                const contentType = headers['content-type']
                expect(contentType).toBeDefined()
                expect(contentType.startsWith('text/plain')).toBe(true)
                expect(headers['content-encoding']).toEqual('gzip')
                const data = Buffer.from(response.body, 'base64')
                const unzipped = zlib.gunzipSync(data)
                expect(unzipped).toEqual(fakeBinaryPayload)
            }
        },
        {
            name: 'Javascript response',
            path: '/mobify.js',
            validate: (response) => {
                expect(response.statusCode).toBe(200)
                expect(response.isBase64Encoded).toBe(true)
                const headers = response.headers
                expect(headers).toBeDefined()
                const contentType = headers['content-type']
                expect(contentType).toBeDefined()
                expect(contentType.startsWith('application/javascript')).toBe(true)
                expect(headers['content-encoding']).toBeFalsy()
                const js = Buffer.from(response.body, 'base64').toString()
                expect(js).toEqual(jsPayload)
            }
        },
        {
            name: 'proxied text response',
            path: '/mobify/proxy/base/test1',
            validate: (response) => {
                expect(response.statusCode).toBe(200)
                expect(response.isBase64Encoded).toBe(false)
                expect(response.headers['content-type']).toEqual('text/plain')
                expect(response.headers['content-encoding']).toBeFalsy()
                expect(response.body).toEqual('success1')
            }
        },
        {
            name: 'redirect 301',
            path: '/redirect301',
            validate: (response) => {
                expect(response.statusCode).toBe(301)
                expect(response.isBase64Encoded).toBe(false)
                expect(response.headers.location).toEqual(redirectTarget)
                expect(response.headers['content-length']).toBe('0')
            }
        },
        {
            name: 'redirect 302',
            path: '/redirect302',
            validate: (response) => {
                expect(response.statusCode).toBe(302)
                expect(response.isBase64Encoded).toBe(false)
                expect(response.headers.location).toEqual(redirectTarget)
                expect(response.headers['content-length']).toBe('0')
            }
        }
    ]

    lambdaTestCases.forEach((testCase) =>
        test(testCase.name, () => {
            server = new TestSSRServer({
                buildDir: testFixtures,
                mainFilename: 'main-big.js',
                routes: [/\//],
                mobify: testPackageMobify,
                optimizeCSS: false,
                sslFilePath: path.join(testFixtures, 'localhost.pem'),
                quiet: true,
                port: TEST_PORT,
                remote: true,
                fetchAgents: {
                    https: httpsAgent
                }
            })

            // Set up the mock proxy
            nock('http://test.proxy.com')
                .get('/test1')
                .reply(200, 'success1', {'Content-Type': 'text/plain'})

            // Ensure that this server sends metrics and that we can
            // track them.
            const metrics = []
            server.metrics._CW = {
                putMetricData: (params, callback) => {
                    metrics.push(params)
                    callback(null)
                }
            }
            const metricSent = (name) =>
                !!metrics.find(
                    (metric) => !!metric.MetricData.find((data) => data.MetricName === name)
                )

            // Set up a fake event and a fake context for the Lambda call
            const event = AWSTestUtils.mockEventCreator.createAPIGatewayEvent({
                path: testCase.path,
                body: undefined
            })

            if (event.queryStringParameters) {
                delete event.queryStringParameters
            }

            // Add a fake X-Amz-Cf-Id header
            event.headers['X-Amz-Cf-Id'] = '1234567'

            const context = AWSTestUtils.mockContextCreator({
                functionName: 'SSRTest'
            })

            return (
                new Promise((resolve, reject) => {
                    // Callback for when the response is done
                    const callback = (err, response) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(response)
                        }
                    }

                    // Call the Lambda entry point
                    const lambdaEntry = SSRServer.get(server)
                    lambdaEntry(event, context, callback)
                })
                    // The callback function gets passed an error object and
                    // the API Gateway response.
                    .then((response) => {
                        // We expect all metrics to have been sent
                        expect(server.metrics.queueLength).toBe(0)

                        // We're not asserting which metrics were sent, just
                        // checking if any were sent. As of DESKTOP-434, every
                        // request will send metrics.
                        expect(!!metrics.length).toBe(true)

                        // We check for some specific metrics here
                        expect(metricSent('LambdaCreated')).toBe(true)

                        // We expect a context property to have been set false
                        expect(context.callbackWaitsForEmptyEventLoop).toBe(false)

                        // Check the response
                        testCase.validate(response)
                    })
            )
        })
    )

    test('Lambda integration strips rogue headers', () => {
        server = new TestSSRServer({
            buildDir: testFixtures,
            routes: [/\//],
            mobify: testPackageMobify,
            optimizeCSS: true,
            sslFilePath: path.join(testFixtures, 'localhost.pem'),
            quiet: true,
            port: TEST_PORT,
            remote: true,
            fetchAgents: {
                https: httpsAgent
            }
        })

        // Set up a fake event and a fake context for the Lambda call
        const event = AWSTestUtils.mockEventCreator.createAPIGatewayEvent({
            path: '/headers',
            body: undefined,
            // Other x-headers are added by AWSServerlessExpress
            headers: {
                'x-api-key': '1234567890'
            }
        })

        if (event.queryStringParameters) {
            delete event.queryStringParameters
        }

        const context = AWSTestUtils.mockContextCreator({
            functionName: 'SSRTest'
        })

        const lambdaEntry = SSRServer.get(server)
        const call = (event) =>
            new Promise((resolve) =>
                lambdaEntry(event, context, (err, response) => resolve(response))
            )

        return call(event).then((response) => {
            expect(response.statusCode).toBe(200)
            const decodedBody = response.isBase64Encoded ? atob(response.body) : response.body
            const reqHeaders = JSON.parse(decodedBody)
            X_HEADERS_TO_REMOVE.forEach((key) => expect(reqHeaders[key]).toBeUndefined())
        })
    })

    test('Lambda reuse behaviour', () => {
        server = new TestSSRServer({
            buildDir: testFixtures,
            routes: [/\//],
            mobify: testPackageMobify,
            optimizeCSS: true,
            sslFilePath: path.join(testFixtures, 'localhost.pem'),
            quiet: true,
            port: TEST_PORT,
            remote: true,
            fetchAgents: {
                https: httpsAgent
            }
        })

        const collectGarbage = sandbox.stub(server, 'collectGarbage')
        const sendMetric = sandbox.stub(server, 'sendMetric')
        const _renderPage = sandbox.stub(server, '_renderPage').callsFake(() => Promise.resolve())
        const lambdaEntry = SSRServer.get(server)

        // Set up a fake event and a fake context for the Lambda call
        const event = AWSTestUtils.mockEventCreator.createAPIGatewayEvent({
            path: '/',
            body: undefined
        })

        if (event.queryStringParameters) {
            delete event.queryStringParameters
        }

        const context = AWSTestUtils.mockContextCreator({
            functionName: 'SSRTest'
        })

        const call = (event) =>
            new Promise((resolve) =>
                lambdaEntry(event, context, (err, response) => resolve(response))
            )

        // First request - Lambda container created
        return call(event)
            .then((response) => {
                expect(response.statusCode).toBe(200)
                expect(collectGarbage.callCount).toBe(0)
                expect(_renderPage.callCount).toBe(1)
                expect(sendMetric.calledWith('LambdaCreated')).toBe(true)
                expect(sendMetric.calledWith('LambdaReused')).toBe(false)
                sendMetric.reset()

                // Second call - Lambda container reused
                return call(event)
            })
            .then((response) => {
                expect(response.statusCode).toBe(200)
                expect(collectGarbage.callCount).toBe(1)
                expect(_renderPage.callCount).toBe(2)
                expect(sendMetric.calledWith('LambdaCreated')).toBe(false)
                expect(sendMetric.calledWith('LambdaReused')).toBe(true)
            })
    })
})
