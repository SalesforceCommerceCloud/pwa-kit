/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Tests cannot run if this require is converted to an import
/* eslint-disable @typescript-eslint/no-var-requires */
const request = require('supertest')
const {LambdaClient, InvokeCommand} = require('@aws-sdk/client-lambda')
const {S3Client, GetObjectCommand} = require('@aws-sdk/client-s3')
const {
    CloudWatchLogsClient,
    CreateLogStreamCommand,
    AccessDeniedException
} = require('@aws-sdk/client-cloudwatch-logs')
const {mockClient} = require('aws-sdk-client-mock')
const {ServiceException} = require('@smithy/smithy-client')

class AccessDenied extends ServiceException {
    constructor(options) {
        super({...options, name: 'AccessDenied'})
    }
}

describe('server', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let originalEnv, app, server
    const lambdaMock = mockClient(LambdaClient)
    const s3Mock = mockClient(S3Client)
    const logsMock = mockClient(CloudWatchLogsClient)
    beforeEach(() => {
        originalEnv = process.env
        process.env = Object.assign({}, process.env, {
            MRT_ALLOW_COOKIES: 'true',
            LISTEN_ADDRESS: '',
            BUNDLE_ID: '1',
            DEPLOY_TARGET: 'test',
            EXTERNAL_DOMAIN_NAME: 'test.com',
            MOBIFY_PROPERTY_ID: 'test',
            AWS_LAMBDA_FUNCTION_NAME: 'pretend-to-be-remote',
            AWS_REGION: 'us-east-2'
        })

        const ssr = require('./ssr')
        app = ssr.app
        server = ssr.server
        lambdaMock.reset()
        s3Mock.reset()
        logsMock.reset()
    })
    afterEach(() => {
        process.env = originalEnv
        jest.restoreAllMocks()
    })
    test.each([
        ['/', 200, 'application/json; charset=utf-8'],
        ['/tls', 200, 'application/json; charset=utf-8'],
        ['/exception', 500, 'text/html; charset=utf-8'],
        ['/cache', 200, 'application/json; charset=utf-8'],
        ['/cookie', 200, 'application/json; charset=utf-8'],
        ['/multi-cookies', 200, 'application/json; charset=utf-8'],
        ['/set-response-headers', 200, 'application/json; charset=utf-8'],
        ['/isolation', 200, 'application/json; charset=utf-8'],
        ['/memtest', 200, 'application/json; charset=utf-8'],
        ['/streaming-large', 200, 'application/json; charset=utf-8']
    ])('Path %p should render correctly', (path, expectedStatus, expectedContentType) => {
        return request(app)
            .get(path)
            .expect(expectedStatus)
            .expect('Content-Type', expectedContentType)
    })

    test('Path "/cache" has Cache-Control set', () => {
        return request(app).get('/cache').expect('Cache-Control', 's-maxage=60')
    })

    test('Path "/cache/:duration" has Cache-Control set correctly', () => {
        return request(app).get('/cache/123').expect('Cache-Control', 's-maxage=123')
    })

    test('All responses have Server header set to "mrt ref app"', () => {
        return request(app).get('/').expect('Server', 'mrt ref app')
    })

    test('Path "/headers" echoes request headers', async () => {
        const response = await request(app).get('/headers').set('Random-Header', 'random')

        expect(response.body.headers['random-header']).toBe('random')
    })

    test('Path "/cookie" sets cookie', async () => {
        return await request(app)
            .get('/cookie?name=test-cookie&value=test-value')
            .expect('set-cookie', 'test-cookie=test-value; Path=/')
    })

    test('Path "/multi-cookies" sets multiple cookies', async () => {
        const response = await request(app).get('/multi-cookies')
        const setCookieHeaders = response.headers['set-cookie']
        expect(setCookieHeaders).toBeDefined()
        expect(Array.isArray(setCookieHeaders)).toBe(true)
        expect(setCookieHeaders.length).toBeGreaterThanOrEqual(3)
        // Check that the first cookie is set using res.cookie (includes Path=/)
        expect(setCookieHeaders.some((cookie) => cookie.includes('test-cookie=test-value'))).toBe(
            true
        )
        // Check that the appended cookies are present
        expect(setCookieHeaders.some((cookie) => cookie.includes('test-value2'))).toBe(true)
        expect(setCookieHeaders.some((cookie) => cookie.includes('test-value3'))).toBe(true)
    })

    test('Path "/set-response-headers" sets response header', () => {
        return request(app)
            .get('/set-response-headers?header1=value1&header2=test-value')
            .expect('header1', 'value1')
            .expect('header2', 'test-value')
    })

    test('Path "/isolation" succeeds', async () => {
        jest.spyOn(console, 'error')
        lambdaMock.on(InvokeCommand).rejects(new AccessDeniedException())
        s3Mock.on(GetObjectCommand).rejects(new AccessDenied())
        logsMock.on(CreateLogStreamCommand).rejects(new AccessDeniedException())
        const params = `FunctionName=name&Bucket=bucket&Key=key&logGroupName=lgName`
        const response = await request(app).get(`/isolation?${params}`)
        expect(response.body.origin).toBe(true)
        expect(response.body.storage).toBe(true)
        expect(response.body.logs).toBe(true)
    })

    test('Path "/isolation" succeeds with Region', async () => {
        jest.spyOn(console, 'error')
        lambdaMock.on(InvokeCommand).rejects(new AccessDeniedException())
        s3Mock.on(GetObjectCommand).rejects(new AccessDenied())
        logsMock.on(CreateLogStreamCommand).rejects(new AccessDeniedException())
        const params = `FunctionName=name&Bucket=bucket&Key=key&logGroupName=lgName&Region=us-west-1`
        const response = await request(app).get(`/isolation?${params}`)
        expect(response.body.origin).toBe(true)
        expect(response.body.storage).toBe(true)
        expect(response.body.logs).toBe(true)
    })

    test('Path "/isolation" fails', async () => {
        jest.spyOn(console, 'error')
        lambdaMock.on(InvokeCommand).resolves()
        s3Mock.on(GetObjectCommand).resolves()
        logsMock.on(CreateLogStreamCommand).resolves()
        const params = `FunctionName=name&Bucket=bucket&Key=key&logGroupName=lgName`
        const response = await request(app).get(`/isolation?${params}`)
        expect(response.body.origin).toBe(false)
        expect(response.body.storage).toBe(false)
        expect(response.body.logs).toBe(false)
        const errors = [
            'Lambda isolation test failed!',
            'S3 isolation test failed!',
            'Log group isolation test failed!'
        ]
        const calls = console.error.mock.calls.map((call) => call[0])
        expect(errors.some((error) => calls.includes(error))).toBe(true)
    })

    test('Check incoming headers are lowercase', async () => {
        const response = await request(app)
            .get('/headers')
            .set('Random-Header', 'random')
            .set('Another-Mixed-Case-Header', 'value')
            .set('UPPERCASE-HEADER', 'test')
        for (const header in response.body.headers) {
            expect(header).toBe(header.toLowerCase())
        }
    })

    test('Path "/ssr-shared" serves the example.json file', async () => {
        const response = await request(app).get('/ssr-shared')
        expect(response.body.message).toBe(
            'This file is used in the E2E tests to verify that correct header values are set.'
        )
    })

    test('Path "/streaming-large" returns streaming: false', async () => {
        const response = await request(app).get('/streaming-large')
        expect(response.status).toBe(200)
        expect(response.body).toEqual({streaming: false})
    })
})
