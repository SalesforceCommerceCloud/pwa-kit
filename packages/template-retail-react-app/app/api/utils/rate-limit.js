/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Rate Limiting Middleware for Express Payments Proxy Endpoints
 *
 * Provides defense-in-depth rate limiting to protect against:
 * - Basket creation exhaustion attacks
 * - Computational resource exhaustion via repeated calculations
 * - Payment brute force attempts
 *
 * Note: Uses in-memory store by default. For distributed rate limiting
 * across multiple Managed Runtime instances, configure a Redis store.
 */

import rateLimit from 'express-rate-limit'

/**
 * Generates a rate limit key combining IP and site ID for more granular limiting.
 *
 * @param {Object} req - Express request object
 * @returns {string} Rate limit key
 */
const keyGenerator = (req) => {
    const siteId = req.query.siteId || req.body?.siteId || 'default'
    return `${req.ip}-${siteId}`
}

/**
 * Standard rate limit response format.
 *
 * @param {string} message - Error message
 * @returns {Object} Error response object
 */
const createRateLimitResponse = (message) => ({
    error: 'RATE_LIMITED',
    message,
    retryAfter: 'See Retry-After header'
})

/**
 * Rate limiter for basket creation endpoint.
 * Limit: 10 requests per minute per IP+siteId
 *
 * Rationale: Legitimate users create 1-2 baskets per session.
 * This limit allows for retries while preventing flood attacks.
 */
export const basketCreationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: createRateLimitResponse('Too many basket creation requests. Please try again later.'),
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    keyGenerator,
    handler: (req, res, next, options) => {
        console.warn(`[Rate Limit] Basket creation limit exceeded for ${keyGenerator(req)}`)
        res.status(options.statusCode).json(options.message)
    }
})

/**
 * Rate limiter for basket calculation endpoint.
 * Limit: 30 requests per minute per IP+siteId
 *
 * Rationale: Multiple calculations may occur during checkout
 * (address changes, shipping method selection, coupon application).
 */
export const calculateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: createRateLimitResponse('Too many calculation requests. Please try again later.'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res, next, options) => {
        console.warn(`[Rate Limit] Calculate limit exceeded for ${keyGenerator(req)}`)
        res.status(options.statusCode).json(options.message)
    }
})

/**
 * Rate limiter for payment submission endpoint.
 * Limit: 5 requests per minute per IP+siteId
 *
 * Rationale: Legitimate users submit 1-2 payments per checkout.
 * Low limit provides additional layer on top of Adyen's fraud detection.
 */
export const paymentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: createRateLimitResponse('Too many payment requests. Please try again later.'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res, next, options) => {
        console.warn(`[Rate Limit] Payment limit exceeded for ${keyGenerator(req)}`)
        res.status(options.statusCode).json(options.message)
    }
})

/**
 * Rate limiter for shipping address/method endpoints.
 * Limit: 60 requests per minute per IP+siteId
 *
 * Rationale: Higher limit for read/update operations that have
 * lower abuse potential and may be called frequently during checkout.
 */
export const shippingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: createRateLimitResponse('Too many shipping requests. Please try again later.'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res, next, options) => {
        console.warn(`[Rate Limit] Shipping limit exceeded for ${keyGenerator(req)}`)
        res.status(options.statusCode).json(options.message)
    }
})

/**
 * Rate limiter for basket read operations.
 * Limit: 60 requests per minute per IP+siteId
 *
 * Rationale: Read operations have low abuse potential but
 * may be polled during checkout flows.
 */
export const basketReadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: createRateLimitResponse('Too many basket read requests. Please try again later.'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res, next, options) => {
        console.warn(`[Rate Limit] Basket read limit exceeded for ${keyGenerator(req)}`)
        res.status(options.statusCode).json(options.message)
    }
})
