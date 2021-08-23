/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env jest */
/* eslint max-nested-callbacks:0 */

// Mock static assets (require path is relative to the 'ssr' directory)
const mockStaticAssets = {}
jest.mock('../static/assets.json', () => mockStaticAssets, {virtual: true})

// We use require() for the ssr-server since we have to mock a module
// that it needs.
const {createApp, createLambdaHandler} = require('./express')
const AWSTestUtils = require('aws-lambda-test-utils')
const crypto = require('crypto')
const nock = require('nock')
const https = require('https')
const path = require('path')
const zlib = require('zlib')

const {X_HEADERS_TO_REMOVE} = require('../../utils/ssr-proxying')

const TEST_PORT = 3446

const testPackageMobify = {
    ssrEnabled: true,
    ssrOnly: ['main.js.map', 'ssr.js', 'ssr.js.map', 'vendor.js.map'],
    ssrShared: ['main.js', 'ssr-loader.js', 'vendor.js', 'worker.js'],
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

const testFixtures = path.resolve(process.cwd(), 'src/ssr/server/test_fixtures')

/**
 * An HTTPS.Agent that allows self-signed certificates
 * @type {module:https.Agent}
 */
export const httpsAgent = new https.Agent({
    rejectUnauthorized: false
})

describe('SSRServer Lambda integration', () => {
    let savedEnvironment
    let server

    beforeAll(() => {
        savedEnvironment = Object.assign({}, process.env)
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
            MOBIFY_PROPERTY_ID: 'test',
            AWS_LAMBDA_FUNCTION_NAME: 'pretend-to-be-remote'
        }
    })

    afterEach(() => {
        nock.cleanAll()
        if (server) {
            server.close()
        }
    })

    const fakeBinaryPayload = crypto.randomBytes(16)
    const jsPayload = '// This is JavaScript'
    const redirectTarget =
        '/webapp/wcs/stores/servlet/prod_55555_10001_048010312563_-1002?shipToCntry=AU'

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
            },
            route: (req, res) => {
                res.send('<html></html>')
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
            },
            route: (req, res) => {
                // Return a binary payload
                res.status(200)
                    .set('Content-Type', 'image/png')
                    .send(fakeBinaryPayload)
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
            },
            route: (req, res) => {
                // Return a gzipped binary payload
                res.status(200)
                    .set('Content-Type', 'image/png')
                    .set('Content-Encoding', 'gzip')
                    .send(zlib.gzipSync(fakeBinaryPayload))
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
            },
            route: (req, res) => {
                // Return a gzipped binary payload using a non-binary
                // content type.
                res.status(200)
                    .set('Content-Type', 'text/plain')
                    .set('Content-Encoding', 'gzip')
                    .send(zlib.gzipSync(fakeBinaryPayload))
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
            },
            route: (req, res) => {
                // Return JS text
                res.status(200)
                    .set('Content-Type', 'application/javascript')
                    .send(Buffer.from(jsPayload, 'utf8'))
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
            },
            route: () => {
                throw new Error('Should never hit this line')
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
            },
            route: (req, res) => {
                res.redirect(301, redirectTarget)
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
            },
            route: (req, res) => {
                res.redirect(redirectTarget)
            }
        }
    ]

    lambdaTestCases.forEach((testCase) =>
        test(testCase.name, () => {
            const app = createApp({
                buildDir: testFixtures,
                mainFilename: 'main-big.js',
                mobify: testPackageMobify,
                sslFilePath: path.join(testFixtures, 'localhost.pem'),
                quiet: true,
                port: TEST_PORT,
                fetchAgents: {
                    https: httpsAgent
                }
            })
            app.get('/*', testCase.route)

            const {handler, server: srv} = createLambdaHandler(app)
            server = srv

            // Set up the mock proxy
            nock('http://test.proxy.com')
                .get('/test1')
                .reply(200, 'success1', {'Content-Type': 'text/plain'})

            // Ensure that this server sends metrics and that we can
            // track them.
            const metrics = []
            app.metrics._CW = {
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
                    handler(event, context, (err, response) =>
                        err ? reject(err) : resolve(response)
                    )
                })
                    // The callback function gets passed an error object and
                    // the API Gateway response.
                    .then((response) => {
                        // We expect all metrics to have been sent
                        expect(app.metrics.queueLength).toBe(0)

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
        const app = createApp({
            buildDir: testFixtures,
            mobify: testPackageMobify,
            sslFilePath: path.join(testFixtures, 'localhost.pem'),
            quiet: true,
            port: TEST_PORT,
            fetchAgents: {
                https: httpsAgent
            }
        })

        const route = (req, res) => {
            // Return the request headers as JSON
            res.status(200)
                .set('Content-Type', 'application/json')
                .send(JSON.stringify(req.headers))
        }
        app.get('/*', route)

        const {handler, server: srv} = createLambdaHandler(app)
        server = srv

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

        const call = (event) =>
            new Promise((resolve) => handler(event, context, (err, response) => resolve(response)))

        return call(event).then((response) => {
            expect(response.statusCode).toBe(200)
            const decodedBody = response.isBase64Encoded ? atob(response.body) : response.body
            const reqHeaders = JSON.parse(decodedBody)
            X_HEADERS_TO_REMOVE.forEach((key) => expect(reqHeaders[key]).toBeUndefined())
        })
    })

    test('Lambda reuse behaviour', () => {
        const route = jest.fn((req, res) => {
            res.send('<html/>')
        })

        const app = createApp({
            buildDir: testFixtures,
            mobify: testPackageMobify,
            sslFilePath: path.join(testFixtures, 'localhost.pem'),
            quiet: true,
            port: TEST_PORT,
            fetchAgents: {
                https: httpsAgent
            }
        })
        app.get('/*', route)

        const collectGarbage = jest.spyOn(app, '_collectGarbage')
        const sendMetric = jest.spyOn(app, 'sendMetric')
        const {handler, server: srv} = createLambdaHandler(app)
        server = srv

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
            new Promise((resolve) => handler(event, context, (err, response) => resolve(response)))

        return Promise.resolve()
            .then(() => call(event))
            .then((response) => {
                // First request - Lambda container created
                expect(response.statusCode).toBe(200)
                expect(collectGarbage.mock.calls.length).toBe(0)
                expect(route.mock.calls.length).toBe(1)
                expect(sendMetric).toHaveBeenCalledWith('LambdaCreated')
                expect(sendMetric).not.toHaveBeenCalledWith('LambdaReused')
            })
            .then(() => call(event))
            .then((response) => {
                // Second call - Lambda container reused
                expect(response.statusCode).toBe(200)
                expect(collectGarbage.mock.calls.length).toBe(1)
                expect(route.mock.calls.length).toBe(2)
                expect(sendMetric).toHaveBeenCalledWith('LambdaCreated')
                expect(sendMetric).toHaveBeenCalledWith('LambdaReused')
            })
    })
})
