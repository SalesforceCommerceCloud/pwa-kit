/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Enhanced fetch wrapper that automatically:
 * 1. Adds the sfdc_server_timing header when server timing is enabled
 * 2. Captures Server-Timing headers from API responses
 * 3. Integrates with OpenTelemetry tracing
 * 
 * @module enhanced-fetch
 */

import logger from './logger-instance'
import {createChildSpan, endSpan} from './opentelemetry'

/**
 * Check if server timing is enabled based on request context
 * @param {Object} context - Request context containing req object
 * @returns {boolean}
 */
const shouldTrackPerformance = (context) => {
    if (typeof window !== 'undefined') {
        // Client-side: check URL params
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.has('__server_timing') || process.env.SERVER_TIMING
    }
    
    // Server-side: check from context
    return context?.req?.query?.__server_timing !== undefined || process.env.SERVER_TIMING
}

/**
 * Enhanced fetch function that captures timing data
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} context - Context containing req, res, and performanceTimer
 * @returns {Promise<Response>}
 */
export const enhancedFetch = async (url, options = {}, context = {}) => {
    const {performanceTimer, req} = context
    const trackPerformance = shouldTrackPerformance(context)
    
    // Add sfdc_server_timing header if performance tracking is enabled
    if (trackPerformance) {
        options.headers = {
            ...options.headers,
            'sfdc_server_timing': '1'
        }
    }

    let span = null
    const spanName = `fetch-${new URL(url, 'http://localhost').pathname}`
    
    // Create OpenTelemetry span if performance tracking is enabled
    if (trackPerformance) {
        span = createChildSpan(spanName, {
            'http.method': options.method || 'GET',
            'http.url': url,
            'http.scheme': new URL(url, 'http://localhost').protocol.slice(0, -1),
            'http.target': new URL(url, 'http://localhost').pathname
        })
    }

    try {
        const response = await fetch(url, options)
        
        // Capture Server-Timing headers if performance tracking is enabled
        if (trackPerformance && performanceTimer) {
            // Determine source based on URL
            let source = 'api'
            if (url.includes('commercecloud.salesforce.com')) {
                source = 'scapi'
            } else if (url.includes('/ocapi/')) {
                source = 'ocapi'
            } else if (url.includes('/slas/')) {
                source = 'slas'
            }
            
            performanceTimer.addApiTimingFromResponse(response, source)

            // Add Server-Timing information to the span
            const serverTimingHeader = response.headers?.get
                ? response.headers.get('Server-Timing')
                : response.headers?.['server-timing'] || response.headers?.['Server-Timing']
            
            if (serverTimingHeader && span) {
                span.setAttributes({
                    'server.timing': serverTimingHeader,
                    'api.source': source
                })
            }
        }

        // Add span attributes for successful responses
        if (span) {
            span.setAttributes({
                'http.status_code': response.status,
                'http.response.size': response.headers.get('content-length') || 0
            })
        }

        return response
    } catch (error) {
        // Log fetch errors and add to span
        logger.error('Enhanced fetch error', {
            url,
            error: error.message,
            namespace: 'enhanced-fetch'
        })

        if (span) {
            span.setAttributes({
                'error': true,
                'error.message': error.message
            })
        }

        throw error
    } finally {
        // Always end the span
        if (span) {
            endSpan(span)
        }
    }
}

/**
 * Create a fetch function bound to a specific context
 * @param {Object} context - Context containing req, res, and performanceTimer
 * @returns {Function} - Bound fetch function
 */
export const createContextualFetch = (context) => {
    return (url, options) => enhancedFetch(url, options, context)
}
