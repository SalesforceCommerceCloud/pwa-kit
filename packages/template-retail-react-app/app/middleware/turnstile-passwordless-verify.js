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
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
const PASSWORDLESS_LOGIN_PATH = /\/oauth2\/passwordless\/login/
/** Google reCAPTCHA test secret – siteverify always passes. Use only when RECAPTCHA_USE_TEST_KEYS=true. */
const RECAPTCHA_TEST_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
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
 * Verifies a reCAPTCHA token with Google siteverify API.
 * @param {string} token - recaptcha response token from the client
 * @param {string} secret - reCAPTCHA secret key
 * @param {string} [remoteip] - Optional client IP
 * @returns {Promise<{ success: boolean, 'error-codes'?: string[] }>}
 */
async function verifyRecaptchaToken(token, secret, remoteip) {
    const params = new URLSearchParams({secret, response: token})
    if (remoteip) params.set('remoteip', remoteip)
    const controller = new AbortController()
    const timeoutMs = getSiteverifyTimeoutMs()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const response = await fetch(RECAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: params.toString(),
            signal: controller.signal
        })
        return response.json()
    } finally {
        clearTimeout(timeoutId)
    }
}

/** Header that a trusted private client (BFF) may send to skip captcha. Value must match PASSWORDLESS_TRUSTED_CLIENT_SECRET. */
const TRUSTED_CLIENT_HEADER = 'x-passwordless-trusted-client'

/**
 * Returns true if the request is from a trusted private client (BFF) that may skip captcha.
 * The BFF must send header X-Passwordless-Trusted-Client with value equal to PASSWORDLESS_TRUSTED_CLIENT_SECRET.
 */
function isTrustedPrivateClient(req) {
    const secret = process.env.PASSWORDLESS_TRUSTED_CLIENT_SECRET
    if (!secret) return false
    const value = req.get && req.get(TRUSTED_CLIENT_HEADER)
    return value === secret
}

/**
 * Express middleware that for POST /oauth2/passwordless/login:
 * 1. Buffers and parses the request body
 * 2. If request is from a trusted private client (header X-Passwordless-Trusted-Client matches PASSWORDLESS_TRUSTED_CLIENT_SECRET), skip captcha and forward to SLAS. This allows a BFF to call the API without a browser captcha token.
 * 3. Otherwise, if body has turnstileResponse: verify with Cloudflare (when TURNSTILE_SECRET_KEY set); if recaptchaResponse: verify with Google (when RECAPTCHA_SECRET_KEY set). Returns 403 if invalid. When a captcha secret is set, the token is mandatory for public clients.
 * 4. Strips turnstileResponse and recaptchaResponse from the body
 * 5. Replaces the request stream with the modified body and updates Content-Length for the downstream proxy
 *
 * Set TURNSTILE_SECRET_KEY for Turnstile; set RECAPTCHA_SECRET_KEY for Google reCAPTCHA.
 * For reCAPTCHA automated tests: set RECAPTCHA_USE_TEST_KEYS=true (client) and RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe (server; Google test secret – siteverify always passes). Never use in production.
 * Set PASSWORDLESS_TRUSTED_CLIENT_SECRET and have the BFF send it in X-Passwordless-Trusted-Client to allow server-to-server calls without captcha.
 */
function turnstilePasswordlessVerifyMiddleware(req, res, next) {
    if (req.method !== 'POST' || !req.path?.match(PASSWORDLESS_LOGIN_PATH)) {
        return next()
    }

    const middlewareStart = Date.now()
    console.info('[Captcha] passwordless/login request received')

    bufferAndParseBody(req, res, (err) => {
        if (err) return next(err)
        const body = req._parsedBody
        if (!body || typeof body !== 'object') {
            return next()
        }

        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
        // POC: use test secret when RECAPTCHA_SECRET_KEY not set (siteverify always passes with test keys)
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || RECAPTCHA_TEST_SECRET
        const turnstileToken = body.turnstileResponse
        const recaptchaToken = body.recaptchaResponse
        const remoteip = req.ip || req.connection?.remoteAddress
        const trustedPrivateClient = isTrustedPrivateClient(req)

        const run = async () => {
            // Trusted private client (BFF): skip captcha requirement and verification; still strip any token from body
            if (trustedPrivateClient) {
                console.info('[Captcha] trusted private client (BFF) – skipping captcha')
                // Fall through to strip and forward
            } else if (turnstileToken) {
                if (turnstileSecret) {
                    try {
                        const verifyStart = Date.now()
                        const result = await verifyTurnstileToken(
                            turnstileToken,
                            turnstileSecret,
                            remoteip
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
                }
            } else if (turnstileSecret && !recaptchaToken) {
                console.warn('[Turnstile] 403: token required but not sent (secret is set; public client must send captcha)')
                return res.status(403).json({message: 'Turnstile token required'})
            }

            if (!trustedPrivateClient && recaptchaToken) {
                if (recaptchaSecret) {
                    try {
                        const verifyStart = Date.now()
                        const result = await verifyRecaptchaToken(
                            recaptchaToken,
                            recaptchaSecret,
                            remoteip
                        )
                        const verifyMs = Date.now() - verifyStart
                        if (!result.success) {
                            const errorCodes = result['error-codes'] || []
                            console.warn(
                                '[reCAPTCHA] verification failed:',
                                errorCodes.join(', ') || 'unknown'
                            )
                            return res.status(403).json({
                                message: 'reCAPTCHA verification failed',
                                'error-codes': errorCodes
                            })
                        }
                        console.info(`[reCAPTCHA] verification succeeded (${verifyMs}ms)`)
                    } catch (e) {
                        const isTimeout = e.name === 'AbortError'
                        console.warn(
                            '[reCAPTCHA] siteverify error:',
                            isTimeout ? 'timeout' : e.message
                        )
                        return res.status(502).json({
                            message: isTimeout
                                ? 'reCAPTCHA verification timed out'
                                : 'reCAPTCHA verification error'
                        })
                    }
                }
            } else if (!trustedPrivateClient && recaptchaSecret && !turnstileToken) {
                console.warn('[reCAPTCHA] 403: token required but not sent (secret is set; public client must send captcha)')
                return res.status(403).json({message: 'reCAPTCHA token required'})
            }

            const totalMs = Date.now() - middlewareStart
            console.info(`[Captcha] forwarding to SLAS (middleware took ${totalMs}ms)`)

            delete body.turnstileResponse
            delete body.recaptchaResponse
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
