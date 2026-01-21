/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * SLAS Token Security - Error Handling Utilities
 *
 * This module provides standardized error handling for proxy endpoints,
 * ensuring consistent error responses and proper logging.
 */

/**
 * Standard error response structure
 */
export class ApiError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message)
        this.name = 'ApiError'
        this.statusCode = statusCode
        this.code = code
        this.details = details
    }

    toJSON() {
        return {
            error: this.code,
            message: this.message,
            ...(this.details && {details: this.details})
        }
    }
}

/**
 * Common error types for proxy endpoints
 */
export const ErrorTypes = {
    UNAUTHORIZED: (message = 'Authentication required') =>
        new ApiError(message, 401, 'UNAUTHORIZED'),

    FORBIDDEN: (message = 'Access denied') => new ApiError(message, 403, 'FORBIDDEN'),

    NOT_FOUND: (message = 'Resource not found') => new ApiError(message, 404, 'NOT_FOUND'),

    BAD_REQUEST: (message = 'Invalid request', details = null) =>
        new ApiError(message, 400, 'BAD_REQUEST', details),

    INTERNAL_ERROR: (message = 'Internal server error') =>
        new ApiError(message, 500, 'INTERNAL_ERROR'),

    UPSTREAM_ERROR: (message = 'Upstream service error', details = null) =>
        new ApiError(message, 502, 'UPSTREAM_ERROR', details),

    TIMEOUT: (message = 'Request timeout') => new ApiError(message, 504, 'TIMEOUT')
}

/**
 * Wraps an async handler to catch errors and pass them to the error handler.
 *
 * @param {Function} fn - Async handler function
 * @returns {Function} Wrapped handler that catches errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

/**
 * Handles upstream API response errors and converts them to ApiErrors.
 *
 * @param {Response} response - Fetch response object
 * @param {string} context - Context description for error messages
 * @throws {ApiError} If response is not ok
 */
export const handleUpstreamResponse = async (response, context = 'API call') => {
    if (!response.ok) {
        let errorDetails = null

        try {
            errorDetails = await response.json()
        } catch {
            try {
                errorDetails = await response.text()
            } catch {
                errorDetails = null
            }
        }

        const statusCode = response.status
        let errorType

        switch (statusCode) {
            case 400:
                errorType = ErrorTypes.BAD_REQUEST
                break
            case 401:
                errorType = ErrorTypes.UNAUTHORIZED
                break
            case 403:
                errorType = ErrorTypes.FORBIDDEN
                break
            case 404:
                errorType = ErrorTypes.NOT_FOUND
                break
            default:
                errorType = ErrorTypes.UPSTREAM_ERROR
        }

        throw errorType(`${context} failed with status ${statusCode}`, errorDetails)
    }

    return response
}

/**
 * Express error handling middleware for proxy endpoints.
 * Should be registered after all routes.
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandlerMiddleware = (err, req, res, next) => {
    // Log the error for debugging
    console.error(`[Proxy Error] ${req.method} ${req.path}:`, {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        details: err.details, // Include upstream error details for debugging
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })

    // Handle ApiError instances
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json(err.toJSON())
    }

    // Handle unexpected errors
    return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    })
}

/**
 * Logs proxy request for debugging and auditing.
 *
 * @param {string} endpoint - The proxy endpoint being called
 * @param {string} method - HTTP method
 * @param {Object} params - Request parameters (sanitized)
 */
export const logProxyRequest = (endpoint, method, params = {}) => {
    // Sanitize params to remove sensitive data
    const sanitizedParams = {...params}
    delete sanitizedParams.token
    delete sanitizedParams.accessToken
    delete sanitizedParams.authorization

    console.log(`[Proxy Request] ${method} ${endpoint}`, sanitizedParams)
}
