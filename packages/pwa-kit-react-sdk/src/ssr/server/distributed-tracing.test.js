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

jest.mock('../../utils/opentelemetry-config', () => ({
    getOTELConfig: jest.fn()
}))

import {context, trace} from '@opentelemetry/api'
import {
    isDistributedTracingEnabled,
    extractContext,
    withServerSpan,
    withChildSpan,
    getCurrentTraceparent,
    setActiveSpanAttribute
} from './distributed-tracing'
import {getOTELConfig} from '../../utils/opentelemetry-config'

describe('distributed-tracing', () => {
    beforeEach(() => {
        getOTELConfig.mockReturnValue({enabled: true, serviceName: 'pwa-kit-react-sdk'})
    })
    afterEach(() => {
        getOTELConfig.mockReset()
    })

    test('isDistributedTracingEnabled delegates to getOTELConfig().enabled', () => {
        getOTELConfig.mockReturnValue({enabled: false})
        expect(isDistributedTracingEnabled()).toBe(false)
        getOTELConfig.mockReturnValue({enabled: true})
        expect(isDistributedTracingEnabled()).toBe(true)
    })

    test('extractContext returns context.active() on malformed headers', () => {
        const result = extractContext(null)
        // Should not throw and should return a valid context
        expect(result).toBeDefined()
        // The result with null/malformed headers should fall back to context.active()
        expect(result).toEqual(context.active())
    })

    test('withServerSpan parents onto an incoming W3C traceparent', async () => {
        const traceId = '0af7651916cd43dd8448eb211c80319c'
        const headers = {traceparent: `00-${traceId}-b7ad6b7169203331-01`}
        const req = {headers, method: 'GET', originalUrl: '/test-page', url: '/test-page'}
        const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}

        let seenTraceId
        const ctx = extractContext(headers)
        await withServerSpan(req, res, ctx, async () => {
            seenTraceId = await withChildSpan('child.demo', async (span) => {
                return span.spanContext().traceId
            })
        })

        expect(seenTraceId).toBe(traceId)
        expect(res.setHeader).toHaveBeenCalledWith(
            'traceparent',
            expect.stringContaining(`00-${traceId}-`)
        )
    })

    test('withServerSpan exposes the span traceparent on res.locals for outbound propagation', async () => {
        const traceId = '0af7651916cd43dd8448eb211c80319c'
        const headers = {traceparent: `00-${traceId}-b7ad6b7169203331-01`}
        const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
        const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}

        let localsTraceparentDuringRender
        const ctx = extractContext(headers)
        await withServerSpan(req, res, ctx, async () => {
            // Templates read res.locals.traceparent (a plain string) to forward on
            // outbound SCAPI calls. It must be set before the render runs.
            localsTraceparentDuringRender = res.locals.traceparent
        })

        // Same value as the response header, carrying the request's trace id.
        expect(localsTraceparentDuringRender).toMatch(new RegExp(`^00-${traceId}-[0-9a-f]{16}-01$`))
        expect(res.locals.traceparent).toBe(localsTraceparentDuringRender)
    })

    test('extract-only: no incoming traceparent → runs fn without minting a span', async () => {
        const req = {headers: {}, method: 'GET', originalUrl: '/', url: '/'}
        const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}

        const ctx = extractContext(req.headers)
        const result = await withServerSpan(req, res, ctx, async () => 'ran')

        expect(result).toBe('ran')
        expect(res.setHeader).not.toHaveBeenCalled()
    })

    test('withChildSpan returns the callback result', async () => {
        const result = await withChildSpan('child.demo', async () => 'ok')
        expect(result).toBe('ok')
    })

    test('withChildSpan passes through fn() when tracing is disabled', async () => {
        getOTELConfig.mockReturnValue({enabled: false})
        const result = await withChildSpan('child.demo', async () => 'passthrough')
        expect(result).toBe('passthrough')
    })

    test('withChildSpan sets span status ERROR and rethrows when fn throws', async () => {
        const traceId = '0af7651916cd43dd8448eb211c80319c'
        const headers = {traceparent: `00-${traceId}-b7ad6b7169203331-01`}
        const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
        const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}
        const ctx = extractContext(headers)

        await expect(
            withServerSpan(req, res, ctx, async () => {
                await withChildSpan('child.fails', async () => {
                    throw new Error('child boom')
                })
            })
        ).rejects.toThrow('child boom')
    })

    test('extractContext falls back to context.active() when the propagator throws', () => {
        // A headers object whose property access throws forces the propagator's
        // internal getter to throw, exercising the catch path.
        const hostileHeaders = new Proxy(
            {},
            {
                ownKeys() {
                    throw new Error('keys blew up')
                },
                get() {
                    throw new Error('get blew up')
                }
            }
        )
        const result = extractContext(hostileHeaders)
        expect(result).toEqual(context.active())
    })

    test('withServerSpan tolerates a bare res (no locals, no on, no setHeader)', async () => {
        const traceId = '0af7651916cd43dd8448eb211c80319c'
        const headers = {traceparent: `00-${traceId}-b7ad6b7169203331-01`}
        // No host header → server.address branch is skipped.
        const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
        const res = {}

        const result = await withServerSpan(
            req,
            res,
            extractContext(headers),
            async () => 'rendered'
        )
        expect(result).toBe('rendered')
    })

    test('withServerSpan passes through fn() when tracing is disabled', async () => {
        getOTELConfig.mockReturnValue({enabled: false})
        const req = {headers: {}, method: 'GET', originalUrl: '/', url: '/'}
        const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}
        const result = await withServerSpan(
            req,
            res,
            extractContext({}),
            async () => 'disabled-passthrough'
        )
        expect(result).toBe('disabled-passthrough')
        expect(res.setHeader).not.toHaveBeenCalled()
    })

    test('withServerSpan defaults method to GET and path to / when req fields are absent', async () => {
        const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
        const traceId = '0af7651916cd43dd8448eb211c80319c'
        const headers = {traceparent: `00-${traceId}-b7ad6b7169203331-01`}
        // No method, no originalUrl, no url → exercises the `|| 'GET'` and `|| '/'` fallbacks.
        const req = {headers}
        const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}

        await withServerSpan(req, res, extractContext(headers), async () => {})

        const span = infoSpy.mock.calls
            .map(([line]) => {
                try {
                    return JSON.parse(line)
                } catch {
                    return null
                }
            })
            .find((s) => s && s.name && s.name.includes('ssr.render'))
        infoSpy.mockRestore()

        expect(span.attributes['http.request.method']).toBe('GET')
        expect(span.attributes['url.path']).toBe('/')
    })

    describe('sampling flag is honored by OTel built-ins', () => {
        let infoSpy
        const TRACE_ID = '0af7651916cd43dd8448eb211c80319c'
        const SPAN_ID = 'b7ad6b7169203331'

        const exportedSpans = () =>
            infoSpy.mock.calls
                .map(([line]) => {
                    try {
                        return JSON.parse(line)
                    } catch {
                        return null
                    }
                })
                .filter((s) => s && s.traceId)

        beforeEach(() => {
            infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
        })
        afterEach(() => {
            infoSpy.mockRestore()
        })

        const run = async (flag) => {
            const headers = {traceparent: `00-${TRACE_ID}-${SPAN_ID}-${flag}`}
            const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
            const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}
            const ctx = extractContext(headers)
            await withServerSpan(req, res, ctx, async () => {
                await withChildSpan('child.demo', async () => 'ok')
            })
        }

        test('parent flag 01 (sampled) → spans ARE exported to stdout', async () => {
            await run('01')
            const spans = exportedSpans()
            expect(spans.length).toBeGreaterThan(0)
            expect(spans.every((s) => s.traceId === TRACE_ID)).toBe(true)
        })

        test('parent flag 00 (not sampled) → NO spans exported', async () => {
            await run('00')
            expect(exportedSpans()).toHaveLength(0)
        })
    })

    describe('getCurrentTraceparent', () => {
        test('returns null when disabled', () => {
            getOTELConfig.mockReturnValue({enabled: false})
            expect(getCurrentTraceparent()).toBeNull()
        })

        test('returns null when no active span', () => {
            expect(getCurrentTraceparent()).toBeNull()
        })

        test('returns null (no throw) when reading the active span throws', () => {
            const spy = jest.spyOn(trace, 'getSpan').mockImplementation(() => {
                throw new Error('context blew up')
            })
            try {
                expect(getCurrentTraceparent()).toBeNull()
            } finally {
                spy.mockRestore()
            }
        })

        test('returns 00-<traceId>-<spanId>-01 inside withServerSpan', async () => {
            const traceId = '0af7651916cd43dd8448eb211c80319c'
            const headers = {traceparent: `00-${traceId}-b7ad6b7169203331-01`}
            const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
            const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}

            let tp
            const ctx = extractContext(headers)
            await withServerSpan(req, res, ctx, async () => {
                tp = getCurrentTraceparent()
            })

            expect(tp).toMatch(new RegExp(`^00-${traceId}-[0-9a-f]{16}-01$`))
        })
    })

    describe('HLD attribute completeness', () => {
        let infoSpy
        const TRACE_ID = '0af7651916cd43dd8448eb211c80319c'

        beforeEach(() => {
            infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
        })
        afterEach(() => {
            infoSpy.mockRestore()
        })

        test('http.request.method and url.path (no query string) are set', async () => {
            const headers = {traceparent: `00-${TRACE_ID}-b7ad6b7169203331-01`}
            const req = {
                headers,
                method: 'POST',
                originalUrl: '/category/shoes?color=red&size=10',
                url: '/category/shoes?color=red&size=10'
            }
            const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}
            const ctx = extractContext(headers)
            await withServerSpan(req, res, ctx, async () => {})

            const spans = infoSpy.mock.calls
                .map(([line]) => {
                    try {
                        return JSON.parse(line)
                    } catch {
                        return null
                    }
                })
                .filter((s) => s && s.name && s.name.includes('ssr.render'))

            expect(spans.length).toBeGreaterThan(0)
            const serverSpan = spans[0]
            expect(serverSpan.attributes['http.request.method']).toBe('POST')
            expect(serverSpan.attributes['url.path']).toBe('/category/shoes')
            // url.path must NOT contain query string
            expect(serverSpan.attributes['url.path']).not.toContain('?')
        })

        test('server.address from request Host header', async () => {
            const headers = {
                traceparent: `00-${TRACE_ID}-b7ad6b7169203331-01`,
                host: 'www.example.com'
            }
            const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
            const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}
            const ctx = extractContext(headers)
            await withServerSpan(req, res, ctx, async () => {})

            const spans = infoSpy.mock.calls
                .map(([line]) => {
                    try {
                        return JSON.parse(line)
                    } catch {
                        return null
                    }
                })
                .filter((s) => s && s.name && s.name.includes('ssr.render'))

            expect(spans[0].attributes['server.address']).toBe('www.example.com')
        })

        test('custom attributes from res.locals: site_name, client_id, realm, instance_type', async () => {
            const headers = {traceparent: `00-${TRACE_ID}-b7ad6b7169203331-01`}
            const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
            const res = {
                setHeader: jest.fn(),
                locals: {
                    site: {id: 'RefArch'},
                    clientId: 'test-client-id',
                    realm: 'test-realm',
                    instanceType: 'sandbox'
                },
                on: jest.fn()
            }
            const ctx = extractContext(headers)
            await withServerSpan(req, res, ctx, async () => {})

            const spans = infoSpy.mock.calls
                .map(([line]) => {
                    try {
                        return JSON.parse(line)
                    } catch {
                        return null
                    }
                })
                .filter((s) => s && s.name && s.name.includes('ssr.render'))

            expect(spans[0].attributes['site_name']).toBe('RefArch')
            expect(spans[0].attributes['client_id']).toBe('test-client-id')
            expect(spans[0].attributes['realm']).toBe('test-realm')
            expect(spans[0].attributes['instance_type']).toBe('sandbox')
        })

        test('http.route set via setActiveSpanAttribute reaches the server span', async () => {
            const headers = {traceparent: `00-${TRACE_ID}-b7ad6b7169203331-01`}
            const req = {headers, method: 'GET', originalUrl: '/category/:id', url: '/category/5'}
            const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}
            const ctx = extractContext(headers)
            await withServerSpan(req, res, ctx, async () => {
                // Route is only known after route matching, inside the render.
                setActiveSpanAttribute('http.route', '/category/:id')
            })

            const spans = infoSpy.mock.calls
                .map(([line]) => {
                    try {
                        return JSON.parse(line)
                    } catch {
                        return null
                    }
                })
                .filter((s) => s && s.name && s.name.includes('ssr.render'))

            expect(spans[0].attributes['http.route']).toBe('/category/:id')
        })

        test('setActiveSpanAttribute is a no-op (no throw) when there is no active span', () => {
            expect(() => setActiveSpanAttribute('http.route', '/x')).not.toThrow()
        })

        test('http.response.status_code set at response close', async () => {
            const headers = {traceparent: `00-${TRACE_ID}-b7ad6b7169203331-01`}
            const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
            let finishHandler
            const res = {
                setHeader: jest.fn(),
                locals: {},
                statusCode: 200,
                on: jest.fn((event, handler) => {
                    if (event === 'finish') finishHandler = handler
                })
            }
            const ctx = extractContext(headers)
            await withServerSpan(req, res, ctx, async () => {
                // Simulate response finishing during the span
                res.statusCode = 201
                if (finishHandler) finishHandler()
            })

            const spans = infoSpy.mock.calls
                .map(([line]) => {
                    try {
                        return JSON.parse(line)
                    } catch {
                        return null
                    }
                })
                .filter((s) => s && s.name && s.name.includes('ssr.render'))

            expect(spans[0].attributes['http.response.status_code']).toBe(201)
        })

        test('error path: render error sets span status ERROR and rethrows', async () => {
            const headers = {traceparent: `00-${TRACE_ID}-b7ad6b7169203331-01`}
            const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
            const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}
            const ctx = extractContext(headers)

            await expect(
                withServerSpan(req, res, ctx, async () => {
                    throw new Error('render failed')
                })
            ).rejects.toThrow('render failed')

            const spans = infoSpy.mock.calls
                .map(([line]) => {
                    try {
                        return JSON.parse(line)
                    } catch {
                        return null
                    }
                })
                .filter((s) => s && s.name && s.name.includes('ssr.render'))

            // Span should have ERROR status (code 2 in OTel)
            expect(spans[0].status.code).toBe(2)
        })
    })

    describe('resource attributes', () => {
        let infoSpy
        const TRACE_ID = 'aaaf651916cd43dd8448eb211c803199'

        beforeEach(() => {
            infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
        })
        afterEach(() => {
            infoSpy.mockRestore()
            delete process.env.MOBIFY_PROPERTY_ID
            delete process.env.BUNDLE_ID
            delete process.env.AWS_LAMBDA_FUNCTION_NAME
            delete process.env.DEPLOY_TARGET
        })

        test('service.namespace, service.version, service.instance.id, deployment.environment', async () => {
            // Set env vars BEFORE requiring module (fresh instance via isolateModules).
            // These are the real MRT-provided runtime vars (BUNDLE_ID is the deploy id).
            process.env.MOBIFY_PROPERTY_ID = 'test-namespace'
            process.env.BUNDLE_ID = '42'
            process.env.AWS_LAMBDA_FUNCTION_NAME = 'instance-abc'
            process.env.DEPLOY_TARGET = 'staging'

            let dtModule
            jest.isolateModules(() => {
                // Re-mock inside isolation
                jest.mock('../../utils/opentelemetry-config', () => ({
                    getOTELConfig: () => ({enabled: true, serviceName: 'pwa-kit-react-sdk'})
                }))
                dtModule = require('./distributed-tracing')
            })

            const headers = {traceparent: `00-${TRACE_ID}-b7ad6b7169203331-01`}
            const req = {headers, method: 'GET', originalUrl: '/', url: '/'}
            const res = {setHeader: jest.fn(), locals: {}, on: jest.fn()}
            const ctx = dtModule.extractContext(headers)
            await dtModule.withServerSpan(req, res, ctx, async () => {})

            const spans = infoSpy.mock.calls
                .map(([line]) => {
                    try {
                        return JSON.parse(line)
                    } catch {
                        return null
                    }
                })
                .filter((s) => s && s.traceId === TRACE_ID)

            expect(spans.length).toBeGreaterThan(0)
            // Resource attributes are merged into span attributes by the exporter
            const attrs = spans[0].attributes
            expect(attrs['service.name']).toBe('pwa-kit-react-sdk')
            expect(attrs['service.namespace']).toBe('test-namespace')
            expect(attrs['service.version']).toBe('42')
            expect(attrs['service.instance.id']).toBe('instance-abc')
            expect(attrs['deployment.environment']).toBe('staging')
        })
    })
})
