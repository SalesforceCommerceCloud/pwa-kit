/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import cookie from 'cookie'
import {X_GRANT_TYPE, X_SITE_ID} from './constants'
import logger from '../../utils/logger-instance'

const DEDUP_TIMEOUT_MS = 30000

/**
 * Creates a deferred promise — a promise with externally accessible resolve/reject.
 * @private
 */
function createDeferred() {
    let resolve, reject
    const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
    })
    return {promise, resolve, reject}
}

/**
 * Extracts a deduplication key for refresh token requests.
 * Returns null if the request should not be deduplicated (not a refresh_token grant,
 * missing siteId, or missing refresh token cookie).
 * @private
 */
export function getRefreshDeduplicationKey(req) {
    // Only deduplicate refresh_token grant type requests
    if (req.headers?.[X_GRANT_TYPE] !== 'refresh_token') return null

    const siteId = req.headers?.[X_SITE_ID]
    if (!siteId) return null

    const cookieHeader = req.headers?.cookie
    if (!cookieHeader) return null

    const cookies = cookie.parse(cookieHeader)
    // Try registered refresh token first, then guest (same order as setRefreshTokenHeader)
    const refreshToken = cookies[`cc-nx_${siteId}`] || cookies[`cc-nx-g_${siteId}`]
    if (!refreshToken) return null

    return `refresh:${siteId}:${refreshToken}`
}

/**
 * Creates Express middleware that deduplicates concurrent refresh token requests.
 *
 * When HttpOnly session cookies are enabled, the server proxy handles token refresh.
 * If multiple browser components detect an expired access token simultaneously, they
 * may each send a refresh request. This middleware ensures only the first request is
 * forwarded to SLAS — subsequent requests with the same refresh token wait for the
 * in-flight request to complete and receive the same response (including Set-Cookie
 * headers for the new HttpOnly tokens).
 *
 * Deduplication key: siteId + refresh token cookie value. Requests from different
 * sessions (different refresh tokens) are never coalesced.
 *
 * @returns {Function} Express middleware
 */
export function createRefreshTokenDeduplicator() {
    const pending = new Map()

    return function deduplicateRefreshTokenRequests(req, res, next) {
        const key = getRefreshDeduplicationKey(req)
        if (!key) return next()

        const existing = pending.get(key)
        if (existing) {
            // Another refresh request with the same token is already in flight.
            // Wait for it to complete and replay its response.
            logger.info('Deduplicating refresh token request (waiting for in-flight request)', {
                namespace: 'refreshTokenDeduplication'
            })
            existing.promise.then(
                (result) => {
                    if (res.headersSent) return
                    for (const cookieStr of result.cookies) {
                        res.append('set-cookie', cookieStr)
                    }
                    if (result.contentType) {
                        res.set('content-type', result.contentType)
                    }
                    res.status(result.statusCode)
                    res.end(result.body)
                },
                () => {
                    if (res.headersSent) return
                    res.status(500).json({message: 'Token refresh failed'})
                }
            )
            return
        }

        // First request with this key: create a deferred and capture the response.
        const deferred = createDeferred()
        pending.set(key, deferred)

        const timeout = setTimeout(() => {
            pending.delete(key)
            deferred.reject(new Error('Refresh token deduplication timeout'))
        }, DEDUP_TIMEOUT_MS)

        const cleanup = () => {
            clearTimeout(timeout)
            pending.delete(key)
        }

        // Wrap res.end to capture the final response after all processing
        // (including setHttpOnlySessionCookies in the response interceptor).
        const originalEnd = res.end
        res.end = function (chunk, encoding, callback) {
            const result = {
                statusCode: res.statusCode,
                cookies: [].concat(res.getHeader('set-cookie') || []),
                contentType: res.getHeader('content-type'),
                body: chunk
            }
            cleanup()
            deferred.resolve(result)
            return originalEnd.call(this, chunk, encoding, callback)
        }

        next()
    }
}
