/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Distributed tracing for PWA Kit.
 *
 * Self-contained OpenTelemetry setup that runs alongside the existing
 * `server_timing` tracing without disturbing it:
 *   - Own NodeTracerProvider + SimpleSpanProcessor(MrtConsoleSpanExporter).
 *   - Tracer obtained via provider.getTracer() (NOT the global trace.getTracer()).
 *   - W3CTraceContextPropagator instance used directly for extract/inject.
 *   - NEVER calls provider.register() or propagation.setGlobalPropagator(),
 *     so the existing B3 global propagator and server_timing path are untouched.
 *   - Installs a global AsyncHooksContextManager (once, lazily) so spans
 *     propagate across async boundaries.
 *
 * Gated on getOTELConfig().enabled. Extract-only: a request without an incoming
 * traceparent produces no DT span (no fresh-root minting).
 */
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node'
import {SimpleSpanProcessor} from '@opentelemetry/sdk-trace-base'
import {Resource} from '@opentelemetry/resources'
import {context, trace, SpanStatusCode} from '@opentelemetry/api'
import {W3CTraceContextPropagator} from '@opentelemetry/core'
import {AsyncHooksContextManager} from '@opentelemetry/context-async-hooks'
import {MrtConsoleSpanExporter} from './mrt-console-span-exporter'
import {getOTELConfig} from '../../utils/opentelemetry-config'
import {parseOrganizationId} from '../../utils/organization-id'
import logger from '../../utils/logger-instance'

const SERVICE_NAME = 'pwa-kit-react-sdk'

let tracer = null
let contextManagerInitialized = false
const propagator = new W3CTraceContextPropagator()

export const isDistributedTracingEnabled = () => getOTELConfig().enabled

const getTracer = () => {
    if (tracer) return tracer

    // Set up AsyncHooksContextManager for context propagation across async boundaries
    if (!contextManagerInitialized) {
        const contextManager = new AsyncHooksContextManager()
        contextManager.enable()
        context.setGlobalContextManager(contextManager)
        contextManagerInitialized = true
    }

    // Resource attributes sourced from the MRT-provided runtime env. BUNDLE_ID
    // is a deploy identifier (numeric), not a semver — MRT exposes no semver var.
    const resource = new Resource({
        'service.name': SERVICE_NAME,
        'service.namespace': process.env.MOBIFY_PROPERTY_ID || '',
        'service.version': process.env.BUNDLE_ID || '',
        'service.instance.id': process.env.AWS_LAMBDA_FUNCTION_NAME || '',
        'deployment.environment': process.env.DEPLOY_TARGET || ''
    })

    const provider = new NodeTracerProvider({resource})
    provider.addSpanProcessor(new SimpleSpanProcessor(new MrtConsoleSpanExporter()))
    tracer = provider.getTracer(SERVICE_NAME)
    return tracer
}

export const extractContext = (headers) => {
    try {
        return propagator.extract(context.active(), headers || {}, {
            get: (carrier, key) => carrier[key],
            // W3CTraceContextPropagator.extract only reads via get(), never keys() —
            // this is required by the TextMapGetter shape but unreachable in practice.
            /* istanbul ignore next */
            keys: (carrier) => Object.keys(carrier)
        })
    } catch (error) {
        logger.warn('DT extract failed', {
            namespace: 'distributed-tracing.extractContext',
            additionalProperties: {error: error.message}
        })
        return context.active()
    }
}

export const withServerSpan = async (req, res, parentCtx, fn) => {
    if (!isDistributedTracingEnabled()) return fn()

    // Extract-only: if the incoming request carried no valid W3C traceparent,
    // the extracted context has no active span context. Do not mint a fresh root
    // span — just run fn(). eCDN is the trusted trace generator in production.
    const incoming = trace.getSpan(parentCtx)?.spanContext()
    if (!incoming || !incoming.traceId) return fn()

    const t = getTracer()
    const method = req.method || 'GET'
    const urlPath = (req.originalUrl || req.url || '/').split('?')[0]
    const serverAddress = req.headers?.host || ''

    const attributes = {
        'http.request.method': method,
        'url.path': urlPath
    }

    if (serverAddress) {
        attributes['server.address'] = serverAddress
    }

    // Custom attributes from res.locals
    if (res.locals?.site?.id) {
        attributes['site_name'] = res.locals.site.id
    }
    // realm and instance type are derived from the configured organizationId
    // (shape f_ecom_<realm>_<instanceType>), which react-rendering exposes on
    // res.locals. Downstream (MRT) composes service.instance.id from these.
    const {realm, instanceType} = parseOrganizationId(res.locals?.organizationId)
    if (realm) {
        attributes['realm'] = realm
    }
    if (instanceType) {
        attributes['instance_type'] = instanceType
    }

    // Name on method only; the concrete path stays in url.path and the route
    // template in http.route, so the span name has low cardinality.
    const span = t.startSpan(`ssr.render ${method}`, {attributes}, parentCtx)

    // Set http.response.status_code on response finish (once-guard)
    let statusCaptured = false
    if (res && typeof res.on === 'function') {
        res.on('finish', () => {
            if (!statusCaptured) {
                statusCaptured = true
                try {
                    span.setAttribute('http.response.status_code', res.statusCode)
                } catch {
                    // non-essential
                }
            }
        })
    }

    return context.with(trace.setSpan(parentCtx, span), async () => {
        try {
            const sc = span.spanContext()
            if (sc) {
                const flags = sc.traceFlags.toString(16).padStart(2, '0')
                const traceparent = `00-${sc.traceId}-${sc.spanId}-${flags}`
                // Expose the traceparent as a plain string for outbound propagation:
                // the template reads res.locals.traceparent and forwards it on the
                // CommerceApiProvider `headers` prop. Set inside the active span so it
                // carries this request's trace id.
                if (res?.locals) {
                    res.locals.traceparent = traceparent
                }
                if (res && typeof res.setHeader === 'function') {
                    res.setHeader('traceparent', traceparent)
                }
            }
        } catch {
            // traceparent exposure is non-essential
        }
        try {
            return await fn()
        } catch (error) {
            span.setStatus({code: SpanStatusCode.ERROR, message: error.message})
            throw error
        } finally {
            // Fallback: capture the final status code in case the response
            // 'finish' event never fired (e.g. error path). The once-guard on
            // the finish handler makes a double-set harmless.
            try {
                if (res?.statusCode) {
                    span.setAttribute('http.response.status_code', res.statusCode)
                }
            } catch {
                // non-essential
            }
            span.end()
        }
    })
}

export const withChildSpan = async (name, fn) => {
    if (!isDistributedTracingEnabled()) return fn()
    const t = getTracer()
    const span = t.startSpan(name, undefined, context.active())
    try {
        return await context.with(trace.setSpan(context.active(), span), async () => await fn(span))
    } catch (error) {
        span.setStatus({code: SpanStatusCode.ERROR, message: error.message})
        throw error
    } finally {
        span.end()
    }
}

/**
 * Sets an attribute on the currently-active span, if any. Used for attributes
 * that are only known partway through the render (e.g. `http.route`, which is
 * resolved after route matching, inside the server span). No-op when tracing is
 * disabled or there is no active span.
 *
 * @param {string} key
 * @param {string|number|boolean} value
 */
export const setActiveSpanAttribute = (key, value) => {
    if (!isDistributedTracingEnabled()) return
    try {
        const span = trace.getSpan(context.active())
        if (span && value != null && value !== '') {
            span.setAttribute(key, value)
        }
    } catch {
        // attributes are non-essential — never break request handling
    }
}

/**
 * Returns the W3C `traceparent` string for the currently-active span, or null
 * if tracing is disabled or there is no active span. Must be called from within
 * the active server-span context (e.g. during SSR inside withServerSpan).
 *
 * Used for outbound propagation: the template passes this as a callable header
 * value so each SCAPI request carries the current span's traceparent.
 *
 * @returns {string|null} e.g. "00-<traceId>-<spanId>-01"
 */
export const getCurrentTraceparent = () => {
    if (!isDistributedTracingEnabled()) return null
    try {
        const sc = trace.getSpan(context.active())?.spanContext()
        if (!sc || !sc.traceId) return null
        const flags = sc.traceFlags.toString(16).padStart(2, '0')
        return `00-${sc.traceId}-${sc.spanId}-${flags}`
    } catch {
        return null
    }
}
