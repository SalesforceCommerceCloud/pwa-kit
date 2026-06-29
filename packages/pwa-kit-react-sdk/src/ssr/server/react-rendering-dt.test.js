/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The @jest-environment comment block *MUST* be the first line of the file for the tests to pass.
// That conflicts with the monorepo header rule, so we must disable the rule!
/* eslint-disable header/header */

/**
 * Tests for the distributed-tracing wiring in react-rendering.js.
 * These verify that the render function correctly invokes the DT module
 * based on the OTEL_TRACING_ENABLED flag, independently from server_timing.
 *
 * Strategy: mock the DT module and opentelemetry-server to capture calls,
 * and DON'T invoke the inner fn (performRender) since its execution is
 * tested separately in react-rendering.test.js. This isolates the wiring
 * decision logic from the rendering internals.
 */

const mockWithServerSpan = jest.fn()
const mockWithChildSpan = jest.fn()
const mockExtractContext = jest.fn()
const mockIsDistributedTracingEnabled = jest.fn()
const mockSetActiveSpanAttribute = jest.fn()
const mockTracePerformance = jest.fn()

jest.mock('./distributed-tracing', () => ({
    isDistributedTracingEnabled: (...args) => mockIsDistributedTracingEnabled(...args),
    extractContext: (...args) => mockExtractContext(...args),
    withServerSpan: (...args) => mockWithServerSpan(...args),
    withChildSpan: (...args) => mockWithChildSpan(...args),
    setActiveSpanAttribute: (...args) => mockSetActiveSpanAttribute(...args)
}))

jest.mock('./opentelemetry-server', () => ({
    shutdownServerTracing: jest.fn(),
    tracePerformance: (...args) => mockTracePerformance(...args)
}))

// Mock everything that performRender needs so it doesn't blow up if reached.
// jest.mock factories must require() inline (hoisted above imports) and define
// minimal mock components — disable the rules that conflict with that pattern,
// matching react-rendering.test.js.
/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-empty-function, react/prop-types */
jest.mock('../universal/compatibility', () => {
    const React = require('react')
    class MockAppConfig extends React.Component {
        static restore() {}
        static initAppState() {
            return Promise.resolve({appState: {}, error: null})
        }
        static freeze() {
            return undefined
        }
        static extraGetPropsArgs() {
            return {}
        }
        static getHOCsInUse() {
            return []
        }
        render() {
            return this.props.children || null
        }
    }
    return {getAppConfig: () => MockAppConfig}
})

jest.mock('../universal/routes', () => {
    const React = require('react')
    class TestPage extends React.Component {
        static getProps() {
            return Promise.resolve()
        }
        static getTemplateName() {
            return 'test'
        }
        render() {
            return React.createElement('div', null, 'test')
        }
    }
    return [{path: '/', component: TestPage, exact: true}]
})
/* eslint-enable @typescript-eslint/no-var-requires, @typescript-eslint/no-empty-function, react/prop-types */

jest.mock('@loadable/server', () => ({
    ChunkExtractor: class {
        collectChunks(jsx) {
            return jsx
        }
        getScriptElements() {
            return []
        }
        getLinkElements() {
            return []
        }
        getStyleElements() {
            return []
        }
    }
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-server', () => ({
    isRemote: () => false,
    getCustomGlobalPreferences: () => Promise.resolve({}),
    getCustomSitePreferences: () => Promise.resolve({}),
    isMrtDataStoreEnabled: () => false
}))

const mockGetConfig = jest.fn(() => ({app: {}}))
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: (...args) => mockGetConfig(...args)
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-shared', () => ({
    proxyConfigs: []
}))

jest.mock('@salesforce/pwa-kit-runtime/ssr/server/constants', () => ({
    NO_CACHE: 'no-cache'
}))

import {render} from './react-rendering'

describe('react-rendering distributed-tracing wiring', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetConfig.mockReturnValue({app: {}})
        mockIsDistributedTracingEnabled.mockReturnValue(false)
        mockExtractContext.mockReturnValue({})
        // By default, withServerSpan does NOT call fn() — prevents performRender from running.
        // This isolates the entry-point wiring tests from render internals.
        mockWithServerSpan.mockImplementation(() => Promise.resolve())
        mockWithChildSpan.mockImplementation((name, fn) => fn())
        // tracePerformance also doesn't call fn by default
        mockTracePerformance.mockImplementation(() => Promise.resolve())
    })

    test('OTEL_TRACING_ENABLED=true + no __server_timing → DT withServerSpan called; tracePerformance NOT called', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(true)

        const req = {
            headers: {traceparent: '00-abc-def-01'},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {locals: {requestId: 'test-id'}}
        const next = jest.fn()

        await render(req, res, next)

        expect(mockIsDistributedTracingEnabled).toHaveBeenCalled()
        expect(mockExtractContext).toHaveBeenCalledWith(req.headers)
        expect(mockWithServerSpan).toHaveBeenCalledWith(
            req,
            res,
            expect.anything(),
            expect.any(Function)
        )
        expect(mockTracePerformance).not.toHaveBeenCalled()
    })

    test('OTEL_TRACING_ENABLED=true → withChildSpan injected on res.locals for per-query SSR spans', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(true)

        const req = {
            headers: {traceparent: '00-abc-def-01'},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {locals: {requestId: 'test-id'}}
        const next = jest.fn()

        await render(req, res, next)

        // The universal with-react-query layer reads res.locals.__withChildSpan to
        // span each SSR query without importing the server-only DT module.
        expect(typeof res.locals.__withChildSpan).toBe('function')
        res.locals.__withChildSpan('scapi:test', () => 'ran')
        expect(mockWithChildSpan).toHaveBeenCalledWith('scapi:test', expect.any(Function))
    })

    test('OTEL_TRACING_ENABLED=true → organizationId from config injected on res.locals', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(true)
        mockGetConfig.mockReturnValue({
            app: {commerceAPI: {parameters: {organizationId: 'f_ecom_bjnl_prd'}}}
        })

        const req = {
            headers: {traceparent: '00-abc-def-01'},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {locals: {requestId: 'test-id'}}
        const next = jest.fn()

        await render(req, res, next)

        // withServerSpan derives realm / instance type from res.locals.organizationId.
        expect(res.locals.organizationId).toBe('f_ecom_bjnl_prd')
    })

    test('OTEL_TRACING_ENABLED=true + no organizationId in config → res.locals.organizationId unset', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(true)
        mockGetConfig.mockReturnValue({app: {commerceAPI: {parameters: {}}}})

        const req = {
            headers: {traceparent: '00-abc-def-01'},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {locals: {requestId: 'test-id'}}
        const next = jest.fn()

        await render(req, res, next)

        expect(res.locals.organizationId).toBeUndefined()
    })

    test('OTEL_TRACING_ENABLED unset → no withChildSpan injected on res.locals', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(false)

        const req = {
            headers: {},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {
            locals: {requestId: 'test-id'},
            setHeader: jest.fn(),
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            on: jest.fn(),
            statusCode: 200
        }
        const next = jest.fn()

        await render(req, res, next)

        expect(res.locals.__withChildSpan).toBeUndefined()
    })

    test('OTEL_TRACING_ENABLED=true + __server_timing → both DT and server_timing execute', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(true)
        // When DT is on, withServerSpan calls fn (which calls runRender, which calls tracePerformance)
        mockWithServerSpan.mockImplementation((req, res, ctx, fn) => fn())

        const req = {
            headers: {traceparent: '00-abc-def-01'},
            method: 'GET',
            originalUrl: '/?__server_timing',
            url: '/?__server_timing',
            query: {__server_timing: ''},
            path: '/'
        }
        const res = {locals: {requestId: 'test-id'}}
        const next = jest.fn()

        await render(req, res, next)

        expect(mockWithServerSpan).toHaveBeenCalled()
        expect(mockTracePerformance).toHaveBeenCalled()
    })

    test('OTEL_TRACING_ENABLED unset → DT never invoked', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(false)
        // tracePerformance also won't be called (no __server_timing in query)
        // render would call performRender directly; intercept via next
        // We need to let performRender start, which will fail gracefully (no route)
        // So just verify DT functions are never called

        const req = {
            headers: {},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {
            locals: {requestId: 'test-id'},
            setHeader: jest.fn(),
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            on: jest.fn(),
            statusCode: 200
        }
        const next = jest.fn()

        // performRender will run but hit the "no route match" path
        await render(req, res, next)

        expect(mockExtractContext).not.toHaveBeenCalled()
        expect(mockWithServerSpan).not.toHaveBeenCalled()
    })

    test('http.route is set on the active span after route matching', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(true)

        let serverSpanFn
        mockWithServerSpan.mockImplementation((req, res, ctx, fn) => {
            serverSpanFn = fn
            return Promise.resolve()
        })

        const req = {
            headers: {traceparent: '00-abc-def-01'},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {
            locals: {requestId: 'test-id'},
            setHeader: jest.fn(),
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            on: jest.fn(),
            statusCode: 200
        }
        const next = jest.fn()

        await render(req, res, next)
        await serverSpanFn()

        // The matched route path ('/' from the mocked routes) is reported as http.route.
        expect(mockSetActiveSpanAttribute).toHaveBeenCalledWith('http.route', '/')
    })

    test('child spans: withChildSpan called with route-match, getProps and render-to-string inside withServerSpan', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(true)

        // Capture the fn passed to withServerSpan, then inspect the withChildSpan calls
        // made when that fn executes (within the server span context)
        const childSpanNames = []
        mockWithChildSpan.mockImplementation((name, fn) => {
            childSpanNames.push(name)
            return fn()
        })

        let serverSpanFn
        mockWithServerSpan.mockImplementation((req, res, ctx, fn) => {
            serverSpanFn = fn
            return Promise.resolve()
        })

        const req = {
            headers: {traceparent: '00-abc-def-01'},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {
            locals: {requestId: 'test-id'},
            setHeader: jest.fn(),
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            on: jest.fn(),
            statusCode: 200
        }
        const next = jest.fn()

        await render(req, res, next)

        // serverSpanFn is the runRender callback passed to withServerSpan
        expect(serverSpanFn).toBeDefined()

        // Now execute it — this runs performRender (which calls withChildSpan)
        await serverSpanFn()

        expect(childSpanNames).toContain('route-match')
        expect(childSpanNames).toContain('getProps')
        expect(childSpanNames).toContain('render-to-string')
    })

    test('off = no-op: render works normally without DT (no throw)', async () => {
        mockIsDistributedTracingEnabled.mockReturnValue(false)

        const req = {
            headers: {},
            method: 'GET',
            originalUrl: '/',
            url: '/',
            query: {},
            path: '/'
        }
        const res = {
            locals: {requestId: 'test-id'},
            setHeader: jest.fn(),
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            on: jest.fn(),
            statusCode: 200
        }
        const next = jest.fn()

        // Should not throw — render completes without DT
        await expect(render(req, res, next)).resolves.not.toThrow()

        expect(mockExtractContext).not.toHaveBeenCalled()
        expect(mockWithServerSpan).not.toHaveBeenCalled()
    })
})
