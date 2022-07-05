/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env jest */

// Mock static assets (require path is relative to the 'ssr' directory)
const mockStaticAssets = {}
jest.mock('../static/assets.json', () => mockStaticAssets, {virtual: true})

// We use require() for the ssr-server since we have to mock a module
// that it needs.
const {RemoteServerFactory} = require('./build-remote-server')
const AWSMockContext = require('aws-lambda-mock-context')
const createEvent = require('@serverless/event-mocks').default
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

const call = async (fn, ...args) =>
    new Promise((resolve, reject) =>
        fn(...args, (err, response) => (err ? reject(err) : resolve(response)))
    )

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
                // Proxying is disabled for remote execution.
                expect(response.statusCode).toBe(501)
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
        test(testCase.name, async () => {
            const options = {
                buildDir: testFixtures,
                mainFilename: 'main-big.js',
                mobify: testPackageMobify,
                sslFilePath: path.join(testFixtures, 'localhost.pem'),
                quiet: true,
                port: TEST_PORT,
                fetchAgents: {
                    https: httpsAgent
                }
            }

            const {handler, app, server: srv} = RemoteServerFactory.createHandler(
                options,
                (app) => {
                    app.get('/*', testCase.route)
                }
            )

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
                metrics.some((metric) => metric.MetricData.some((data) => data.MetricName === name))

            // Set up a fake event and a fake context for the Lambda call
            const event = createEvent('aws:apiGateway', {
                path: testCase.path,
                body: undefined
            })
            delete event.queryStringParameters

            // Add a fake X-Amz-Cf-Id header
            event.headers['X-Amz-Cf-Id'] = '1234567'

            const context = AWSMockContext({
                functionName: 'SSRTest'
            })

            const response = await call(handler, event, context)
            // We expect all metrics to have been sent
            expect(app.metrics.queueLength).toBe(0)
            // We're not asserting which metrics were sent, just
            // checking if any were sent. As of DESKTOP-434, every
            // request will send metrics.
            expect(metrics.length).toBeGreaterThan(0)
            // We check for some specific metrics here
            expect(metricSent('LambdaCreated')).toBe(true)
            // We expect a context property to have been set false
            expect(context.callbackWaitsForEmptyEventLoop).toBe(false)
            // Check the response
            testCase.validate(response)
        })
    )

    test('Lambda integration strips rogue headers', async () => {
        const options = {
            buildDir: testFixtures,
            mobify: testPackageMobify,
            sslFilePath: path.join(testFixtures, 'localhost.pem'),
            quiet: true,
            port: TEST_PORT,
            fetchAgents: {
                https: httpsAgent
            }
        }

        const {handler, server: srv} = RemoteServerFactory.createHandler(options, (app) => {
            const route = (req, res) => {
                // Return the request headers as JSON
                res.status(200)
                    .set('Content-Type', 'application/json')
                    .send(JSON.stringify(req.headers))
            }
            app.get('/*', route)
        })
        server = srv

        // Set up a fake event and a fake context for the Lambda call
        const event = createEvent('aws:apiGateway', {
            path: '/headers',
            body: undefined,
            // Other x-headers are added by AWSServerlessExpress
            headers: {
                'x-api-key': '1234567890'
            }
        })
        delete event.queryStringParameters

        const context = AWSMockContext({
            functionName: 'SSRTest'
        })

        const response = await call(handler, event, context)
        expect(response.statusCode).toBe(200)
        const decodedBody = response.isBase64Encoded ? atob(response.body) : response.body
        const reqHeaders = JSON.parse(decodedBody)
        X_HEADERS_TO_REMOVE.forEach((key) => expect(reqHeaders[key]).toBeUndefined())
    })

    test('Lambda reuse behaviour', async () => {
        const route = jest.fn((req, res) => {
            res.send('<html/>')
        })

        const options = {
            buildDir: testFixtures,
            mobify: testPackageMobify,
            sslFilePath: path.join(testFixtures, 'localhost.pem'),
            quiet: true,
            port: TEST_PORT,
            fetchAgents: {
                https: httpsAgent
            }
        }

        const {app, handler, server: srv} = RemoteServerFactory.createHandler(options, (app) => {
            app.get('/*', route)
        })

        const collectGarbage = jest.spyOn(app, '_collectGarbage')
        const sendMetric = jest.spyOn(app, 'sendMetric')
        server = srv

        // Set up a fake event and a fake context for the Lambda call
        const event = createEvent('aws:apiGateway', {
            path: '/',
            body: undefined
        })
        delete event.queryStringParameters

        const context = AWSMockContext({
            functionName: 'SSRTest'
        })

        const call = (evt) =>
            new Promise((resolve, reject) =>
                handler(evt, context, (err, response) => (err ? reject(err) : resolve(response)))
            )

        // First request - Lambda container created
        const firstResponse = await call(event)
        expect(firstResponse.statusCode).toBe(200)
        expect(collectGarbage).toHaveBeenCalledTimes(0)
        expect(route).toHaveBeenCalledTimes(1)
        expect(sendMetric).toHaveBeenCalledWith('LambdaCreated')
        expect(sendMetric).not.toHaveBeenCalledWith('LambdaReused')

        // Second call - Lambda container reused
        const secondResponse = await call(event)
        expect(secondResponse.statusCode).toBe(200)
        expect(collectGarbage).toHaveBeenCalledTimes(1)
        expect(route).toHaveBeenCalledTimes(2)
        expect(sendMetric).toHaveBeenCalledWith('LambdaCreated')
        expect(sendMetric).toHaveBeenCalledWith('LambdaReused')
    })
})
