/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
'use strict'

const {Readable} = require('stream')
const querystring = require('querystring')

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const PASSWORDLESS_LOGIN_PATH = /\/oauth2\/passwordless\/login/
/** Max time to wait for Cloudflare siteverify; avoids gateway timeout (504) when siteverify is slow. Configurable via TURNSTILE_VERIFY_TIMEOUT_MS (default 10000). */
const DEFAULT_SITEVERIFY_TIMEOUT_MS = 10_000
function getSiteverifyTimeoutMs() {
    const env = process.env.TURNSTILE_VERIFY_TIMEOUT_MS
    if (env == null || env === '') return DEFAULT_SITEVERIFY_TIMEOUT_MS
    const n = parseInt(env, 10)
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_SITEVERIFY_TIMEOUT_MS
}

/**
 * Buffers the request body and parses as JSON or application/x-www-form-urlencoded.
 * Sets req._parsedBody (object) and req._bodyContentType ('json' | 'form').
 * req body stream is consumed; caller must replace it if forwarding.
 */
function bufferAndParseBody(req, res, next) {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        const contentType = (req.headers['content-type'] || '').toLowerCase().split(';')[0].trim()

        try {
            if (!raw.trim()) {
                req._parsedBody = {}
                req._bodyContentType = 'json'
                return next()
            }
            if (contentType === 'application/x-www-form-urlencoded') {
                req._parsedBody = querystring.parse(raw)
                req._bodyContentType = 'form'
            } else {
                req._parsedBody = JSON.parse(raw)
                req._bodyContentType = 'json'
            }
            next()
        } catch (e) {
            res.status(400).json({message: 'Invalid JSON body'})
        }
    })
    req.on('error', next)
}

/**
 * Verifies a Turnstile token with Cloudflare Siteverify API.
 * Uses a timeout to avoid gateway timeouts (504) when siteverify is slow.
 * @param {string} token - cf-turnstile-response token from the client
 * @param {string} secret - Turnstile secret key
 * @param {string} [remoteip] - Optional client IP
 * @returns {Promise<{ success: boolean, 'error-codes'?: string[] }>}
 */
async function verifyTurnstileToken(token, secret, remoteip) {
    const body = JSON.stringify({
        secret,
        response: token,
        ...(remoteip && {remoteip})
    })
    const controller = new AbortController()
    const timeoutMs = getSiteverifyTimeoutMs()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const response = await fetch(SITEVERIFY_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body,
            signal: controller.signal
        })
        return response.json()
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Express middleware that for POST /oauth2/passwordless/login:
 * 1. Buffers and parses the JSON body
 * 2. If TURNSTILE_SECRET_KEY is set and body has turnstileResponse, verifies the token with Cloudflare; returns 403 if invalid
 * 3. Strips turnstileResponse from the body
 * 4. Replaces the request stream with the modified body so the downstream proxy forwards it correctly
 *
 * Requires env TURNSTILE_SECRET_KEY when Turnstile is used (client sends turnstileResponse).
 */
function turnstilePasswordlessVerifyMiddleware(req, res, next) {
    if (req.method !== 'POST' || !req.path?.match(PASSWORDLESS_LOGIN_PATH)) {
        return next()
    }

    const middlewareStart = Date.now()
    console.info('[Turnstile] passwordless/login request received')

    bufferAndParseBody(req, res, (err) => {
        if (err) return next(err)
        const body = req._parsedBody
        if (!body || typeof body !== 'object') {
            return next()
        }

        const secret = process.env.TURNSTILE_SECRET_KEY
        const token = body.turnstileResponse

        const run = async () => {
            if (secret && token) {
                try {
                    const verifyStart = Date.now()
                    const result = await verifyTurnstileToken(
                        token,
                        secret,
                        req.ip || req.connection?.remoteAddress
                    )
                    const verifyMs = Date.now() - verifyStart
                    if (!result.success) {
                        const errorCodes = result['error-codes'] || []
                        console.warn(
                            '[Turnstile] verification failed:',
                            errorCodes.join(', ') || 'unknown'
                        )
                        return res.status(403).json({
                            message: 'Turnstile verification failed',
                            'error-codes': errorCodes
                        })
                    }
                    console.info(`[Turnstile] verification succeeded (${verifyMs}ms)`)
                } catch (e) {
                    const isTimeout = e.name === 'AbortError'
                    console.warn(
                        '[Turnstile] siteverify error:',
                        isTimeout ? 'timeout' : e.message
                    )
                    return res.status(502).json({
                        message: isTimeout
                            ? 'Turnstile verification timed out'
                            : 'Turnstile verification error'
                    })
                }
            } else if (secret && !token) {
                console.warn('[Turnstile] 403: token required but not sent (secret is set)')
                return res.status(403).json({message: 'Turnstile token required'})
            }

            const totalMs = Date.now() - middlewareStart
            console.info(`[Turnstile] forwarding to SLAS (middleware took ${totalMs}ms)`)

            delete body.turnstileResponse
            const modifiedRaw =
                req._bodyContentType === 'form'
                    ? querystring.stringify(body)
                    : JSON.stringify(body)
            // Update Content-Length so the proxy sends the correct body length to SLAS.
            // Without this, the original (larger) Content-Length is forwarded and SLAS waits for
            // more bytes, then times out and resets the connection (ECONNRESET / 504).
            const byteLength = Buffer.byteLength(modifiedRaw, 'utf8')
            req.headers['content-length'] = String(byteLength)
            const stream = Readable.from([modifiedRaw])
            // Replace req.pipe so the downstream proxy sends our modified body to SLAS
            req.pipe = function (dest, options) {
                stream.pipe(dest, options)
                return dest
            }
            next()
        }

        run().catch(next)
    })
}

module.exports = turnstilePasswordlessVerifyMiddleware
