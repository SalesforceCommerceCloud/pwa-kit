/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * CDN Simulator Middleware for Local Development
 *
 * Simulates CDN edge transformer behavior for testing httpOnly cookie implementation
 *
 * Features:
 * 1. Transforms SLAS token responses (strips tokens from JSON, sets httpOnly cookies)
 * 2. Injects Authorization header for SCAPI calls (reads from httpOnly cookies)
 *
 * Enable with: ENABLE_CDN_SIMULATOR=true npm start
 */

const ENABLE_SIMULATOR = process.env.ENABLE_CDN_SIMULATOR === 'true'

/**
 * Parse cookies from cookie header string
 */
function parseCookies(cookieHeader) {
    const cookies = {}
    if (!cookieHeader) return cookies

    cookieHeader.split(';').forEach((cookie) => {
        const [key, ...valueParts] = cookie.trim().split('=')
        if (key && valueParts.length > 0) {
            cookies[key] = decodeURIComponent(valueParts.join('='))
        }
    })

    return cookies
}

/**
 * Check if request is for a SLAS token endpoint
 * Handles both direct and proxied paths:
 * - /mobify/proxy/api/shopper/auth/v1/organizations/.../oauth2/token
 * - /oauth2/token (direct)
 */
function isSlasTokenEndpoint(pathname) {
    const isMatch = pathname.match(/\/oauth2\/(token|authorize|login)/)
    if (isMatch) {
        console.log(`[CDN Sim] 🎯 Detected SLAS token endpoint: ${pathname}`)
    }
    return isMatch
}

/**
 * Check if request is for a SCAPI endpoint
 */
function isScapiEndpoint(pathname) {
    // Extract the actual API path from proxy path
    // /mobify/proxy/api/shopper/... → /shopper/...
    const apiPath = pathname.replace(/^\/mobify\/proxy\/[^/]+/, '')
    return apiPath.match(/^\/(shopper|checkout|search|account|basket)/)
}

/**
 * Inject Authorization header from httpOnly cookie
 */
function injectAuthorizationHeader(req) {
    const cookies = parseCookies(req.headers.cookie || '')

    if (cookies.access_token && !req.headers.authorization) {
        req.headers.authorization = `Bearer ${cookies.access_token}`

        const pathname = req.url.replace(/\?.*$/, '')
        console.log(`[CDN Sim] 🔑 Injected Authorization header for ${pathname}`)
        return true
    }

    return false
}

/**
 * Transform SLAS token response
 * Extracts tokens from JSON body and sets them as httpOnly cookies
 */
function transformSlasResponse(res) {
    const originalWrite = res.write
    const originalEnd = res.end
    const chunks = []

    // Capture response chunks
    res.write = function (chunk, ...args) {
        if (chunk) {
            chunks.push(Buffer.from(chunk))
        }
        return true // Don't write yet
    }

    // Transform on end
    res.end = function (chunk, ...args) {
        if (chunk) {
            chunks.push(Buffer.from(chunk))
        }

        const responseBody = Buffer.concat(chunks).toString('utf8')
        console.log('[CDN Sim] 📦 Intercepted response body length:', responseBody.length)

        // Try to parse as JSON
        try {
            const data = JSON.parse(responseBody)
            console.log('[CDN Sim] ✓ Successfully parsed JSON response')
            console.log('[CDN Sim] 🔍 Response has access_token:', !!data.access_token)

            // Check if it's a SLAS token response
            if (data && data.access_token) {
                console.log('[CDN Sim] 🔐 Transforming SLAS token response')

                // Extract tokens
                const {access_token, refresh_token, id_token, idp_access_token, ...safeBody} =
                    data

                // Set httpOnly cookies
                const isProduction = process.env.NODE_ENV === 'production'

                if (access_token) {
                    res.cookie('access_token', access_token, {
                        httpOnly: true,
                        secure: isProduction,
                        sameSite: 'Lax',
                        path: '/',
                        maxAge: 30 * 60 * 1000 // 30 minutes
                    })
                    console.log('[CDN Sim]   ✓ Set access_token cookie (httpOnly)')
                }

                if (refresh_token) {
                    res.cookie('refresh_token', refresh_token, {
                        httpOnly: true,
                        secure: isProduction,
                        sameSite: 'Lax',
                        path: '/',
                        maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days
                    })
                    console.log('[CDN Sim]   ✓ Set refresh_token cookie (httpOnly)')
                }

                if (id_token) {
                    res.cookie('id_token', id_token, {
                        httpOnly: true,
                        secure: isProduction,
                        sameSite: 'Lax',
                        path: '/',
                        maxAge: 30 * 60 * 1000
                    })
                    console.log('[CDN Sim]   ✓ Set id_token cookie (httpOnly)')
                }

                if (idp_access_token) {
                    res.cookie('idp_access_token', idp_access_token, {
                        httpOnly: true,
                        secure: isProduction,
                        sameSite: 'Lax',
                        path: '/',
                        maxAge: 60 * 60 * 1000 // 1 hour
                    })
                    console.log('[CDN Sim]   ✓ Set idp_access_token cookie (httpOnly)')
                }

                // Return stripped response
                const strippedResponse = JSON.stringify(safeBody)
                console.log('[CDN Sim]   ✓ Stripped tokens from response body')

                // Set correct content-length
                res.setHeader('Content-Length', Buffer.byteLength(strippedResponse))

                // Send transformed response
                originalWrite.call(res, strippedResponse)
                return originalEnd.call(res)
            }
        } catch (e) {
            // Not JSON or parsing error, pass through
            console.log('[CDN Sim] ⚠️  Failed to parse response as JSON:', e.message)
            console.log('[CDN Sim] Response body preview:', responseBody.substring(0, 200))
        }

        // Pass through original response
        console.log('[CDN Sim] → Passing through original response')
        chunks.forEach((chunk) => originalWrite.call(res, chunk))
        return originalEnd.call(res, ...args)
    }
}

/**
 * Main CDN simulator middleware factory
 */
export function createCdnSimulator() {
    if (!ENABLE_SIMULATOR) {
        console.log(
            '💤 CDN Simulator: DISABLED (set ENABLE_CDN_SIMULATOR=true to enable)'
        )
        return (req, res, next) => next()
    }

    console.log('🔧 CDN Simulator: ENABLED (development mode)')
    console.log('   - Transforming SLAS token responses → httpOnly cookies')
    console.log('   - Injecting Authorization headers from cookies')
    console.log('')

    return (req, res, next) => {
        const pathname = req.url.split('?')[0]

        // Debug logging for all requests to API endpoints
        if (pathname.includes('/mobify/proxy') || pathname.includes('/oauth2')) {
            console.log(`[CDN Sim] 📨 Request: ${req.method} ${pathname}`)
        }

        // Part 1: Inject Authorization header for SCAPI calls
        if (isScapiEndpoint(pathname)) {
            injectAuthorizationHeader(req)
        }

        // Part 2: Transform SLAS token responses
        if (isSlasTokenEndpoint(pathname)) {
            transformSlasResponse(res)
        }

        next()
    }
}