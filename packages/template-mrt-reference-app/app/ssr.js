/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Notes on this test app 🧠
 *
 * HTTP requests to **all** paths except those listed below will return
 * a JSON response containing useful diagnostic values from the request
 * and the context in which the request is handled. Values are **whitelisted**,
 * so if you want to view a new header or environment variable you will need
 * to add it to the appropriate whitelist. Do **NOT** expose any values that
 * contain potentially sensitive information (such as API keys or AWS
 * credentials), especially from the environment. The deployed server is
 * globally accessible.
 *
 * -   `/exception`: Throws a custom error whose textual representation (visible in the HTTP response) is the same diagnostic information described above.
 * -   `/cache`: Returns the same diagnostic data, but will store it (as text) in an S3 object in the application cache, then retrieve it and return it. This tests access to the application cache.
 * -   `/auth/<anything>`: Requires HTTP basic authentication with the username `mobify` and the password `supersecret`
 * -   `/auth/logout`: Returns a 401 response that will remove any existing authentication data for a target
 *
 * The app will normally use the 'context.succeed' callback to return a
 * response to the Lambda integration code. If the query parameter `directcallback`
 * is set to any non-empty value, it will use the callback passed to the Lambda
 * entry point instead. This allows testing of different SDK or code methods
 * of generating responses.
 *
 * A `Cache-Control: no-cache` header is added to **all** responses, so CloudFront
 * will never cache any of the responses from this test server. You therefore
 * don't need to add cachebreakers when running tests.
 *
 * A test bundle file is available at `/mobify/bundle/<BUNDLE_NUMBER>/assets/mobify.png`
 * where BUNDLE_NUMBER is the most recently published bundle number.
 */

const path = require('path')
const {getRuntime} = require('@salesforce/pwa-kit-runtime/ssr/server/express')
const pkg = require('../package.json')
const basicAuth = require('express-basic-auth')
const fetch = require('cross-fetch')
const {isolationTests} = require('./isolation-actions')

/**
 * Custom error class
 */
class IntentionalError extends Error {
    constructor(diagnostics, ...params) {
        super(...params)
        this.message = JSON.stringify(diagnostics, null, 2)
        this.name = 'IntentionalError'
    }
}

const ENVS_TO_EXPOSE = [
    'aws_execution_env',
    'aws_lambda_function_memory_size',
    'aws_lambda_function_name',
    'aws_lambda_function_version',
    'aws_lambda_log_group_name',
    'aws_lambda_log_stream_name',
    'aws_region',
    'bundle_id',
    // These "customer" defined environment variables are set by the Manager
    // and expected by the MRT smoke test suite
    'customer_*',
    'deploy_id',
    'deploy_target',
    'external_domain_name',
    'mobify_property_id',
    'mrt_allow_cookies',
    'node_env',
    'node_options',
    'tz'
]

const BADSSL_TLS1_1_URL = 'https://tls-v1-1.badssl.com:1011/'
const BADSSL_TLS1_2_URL = 'https://tls-v1-2.badssl.com:1012/'

const sortObjectKeys = (o) => {
    return Object.assign(
        {},
        ...Object.keys(o)
            .sort()
            .map((k) => ({[k]: o[k]}))
    )
}

/**
 * Shallow-clone the given object such that the only keys on the
 * clone are those in the given whitelist, and so that the keys are
 * in alphanumeric sort order.
 * @param o the object to clone
 * @param whitelist an Array of strings for keys that should be included.
 * If a string ends in a '*', the key may contain zero or more characters
 * matched by the '*' (i.e., it must start with the whitelist string up to
 * but not including the '*')
 * @return {{}}
 */
const filterAndSortObjectKeys = (o, whitelist) =>
    o &&
    Object.keys(o)
        // Include only whitelisted keys
        .filter((key) => {
            const keylc = key.toLowerCase().trim()
            return whitelist.some(
                (pattern) =>
                    // wildcard matching
                    (pattern.endsWith('*') && keylc.startsWith(pattern.slice(0, -1))) ||
                    pattern === keylc // equality matching
            )
        })
        // Sort the remaining keys
        .sort()
        // Include values
        .reduce((acc, key) => {
            acc[key] = o[key]
            return acc
        }, {})

/**
 * Return a JSON-serializable object with key diagnostic values from a request
 */
const jsonFromRequest = (req) => {
    return {
        args: req.query,
        protocol: req.protocol,
        method: req.method,
        path: req.path,
        query: req.query,
        route_path: req.route.path,
        body: req.body,
        headers: sortObjectKeys(req.headers),
        ip: req.ip,
        env: filterAndSortObjectKeys(process.env, ENVS_TO_EXPOSE),
        timestamp: new Date().toISOString()
    }
}

/**
 * Express handler that returns a JSON response with diagnostic values
 */
const echo = (req, res) => res.json(jsonFromRequest(req))

/**
 * Express handler that throws an IntentionalError
 */
const exception = (req) => {
    // Intentionally throw an exception so that we can check for it
    // in logs.
    throw new IntentionalError(jsonFromRequest(req))
}

/**
 * Express handler that makes 2 requests to badssl TLS testing domains
 * to verify that our applications can only make requests to domains with
 * updated TLS versions.
 */
const tlsVersionTest = async (_, res) => {
    let response11 = await fetch(BADSSL_TLS1_1_URL)
        .then((res) => res.ok)
        .catch(() => false)
    let response12 = await fetch(BADSSL_TLS1_2_URL)
        .then((res) => res.ok)
        .catch(() => false)
    res.header('Content-Type', 'application/json')
    res.send(JSON.stringify({'tls1.1': response11, 'tls1.2': response12}, null, 4))
}

/**
 * Express handler that enables the cache and returns a JSON response with diagnostic values.
 */
const cacheTest = async (req, res) => {
    let duration = req.params.duration || '60'
    res.set('Cache-Control', `s-maxage=${duration}`)
    res.json(jsonFromRequest(req))
}

/**
 * Express handler that sets a simple cookie and returns a JSON response with
 * diagnostic values. This set cache control to private to prevent CloudFront
 * caching as we expect customers to do for personalized responses. Use
 * ?name=test-name&value=test-value to set a cookie.
 */
const cookieTest = async (req, res) => {
    if (Object.hasOwn(req.query, 'name')) {
        res.cookie(req.query.name, req.query?.value)
    }
    res.set('Cache-Control', 'private, max-age=60')
    res.json(jsonFromRequest(req))
}

/**
 * Express handler that sets single and multi-value response headers
 * and returns a JSON response with diagnostic values.
 * Use ?header1=value1&header2=value2 to set two response headers.
 * Use ?header3=value4&header3=value5 to set multi value headers
 */
const responseHeadersTest = async (req, res) => {
    for (const [key, value] of Object.entries(req.query)) {
        // If value is an array then a multi-value header will be created
        res.set(key, value)
    }
    res.json(jsonFromRequest(req))
}

/**
 * Express handler that echos back a JSON response with
 * headers supplied in the request.
 */
const headerTest = async (req, res) => {
    res.json({headers: sortObjectKeys(req.headers)})
}

/**
 * Logging middleware; logs request and response headers (and response status).
 */
const loggingMiddleware = (req, res, next) => {
    // Log request headers
    console.log(`Request: ${req.method} ${req.originalUrl}`)
    console.log(`Request headers: ${JSON.stringify(req.headers, null, 2)}`)
    // Arrange to log response status and headers
    res.on('finish', () => {
        const statusCode = res._header ? String(res.statusCode) : String(-1)
        console.log(`Response status: ${statusCode}`)
        if (res.headersSent) {
            const headers = JSON.stringify(res.getHeaders(), null, 2)
            console.log(`Response headers: ${headers}`)
        }
    })

    return next()
}

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development,
    // except by Safari.
    protocol: 'http',

    mobify: pkg.mobify
}

const runtime = getRuntime()

const {handler, app, server} = runtime.createHandler(options, (app) => {
    app.get('/favicon.ico', runtime.serveStaticFile('static/favicon.ico'))

    // Add middleware to explicitly suppress caching on all responses (done
    // before we invoke the handlers)
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-cache')
        return next()
    })

    // Add middleware to log request and response headers
    app.use(loggingMiddleware)

    // Configure routes
    app.all('/exception', exception)
    app.get('/tls', tlsVersionTest)
    app.get('/cache', cacheTest)
    app.get('/cache/:duration(\\d+)', cacheTest)
    app.get('/cookie', cookieTest)
    app.get('/headers', headerTest)
    app.get('/isolation', isolationTests)
    app.get('/set-response-headers', responseHeadersTest)

    // Add a /auth/logout path that will always send a 401 (to allow clearing
    // of browser credentials)
    app.all('/auth/logout', (req, res) => res.status(401).send('Logged out'))
    // Add auth middleware to the /auth paths only
    app.use(
        '/auth*',
        basicAuth({
            users: {mobify: 'supersecret'},
            challenge: true,
            // Use a realm that is different per target
            realm: process.env.EXTERNAL_DOMAIN_NAME || 'echo-test'
        })
    )
    app.all('/auth*', echo)
    // All other paths/routes invoke echo directly
    app.all('/*', echo)
    app.set('json spaces', 4)
})

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
exports.get = handler
exports.server = server

exports.app = app
