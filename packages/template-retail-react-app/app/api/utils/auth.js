/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * SLAS Token Security - Server-side Authentication Utilities
 *
 * This module provides utilities for extracting SLAS tokens from HTTP-only cookies
 * on the server side, ensuring tokens are never exposed to client-side JavaScript.
 *
 * Cookie naming convention: cc-at_{SiteID}
 * - cc-at = Commerce Cloud Access Token
 * - SiteID = The site identifier (e.g., RefArch)
 */

/**
 * Extracts the SLAS access token from HTTP-only cookies.
 *
 * @param {Object} req - Express request object
 * @param {string} siteId - The site identifier used in the cookie name
 * @returns {string|null} The access token if found, null otherwise
 */
export const extractAccessToken = (req, siteId) => {
    if (!req.cookies) {
        console.error('[Auth] Cookie parser middleware not configured')
        return null
    }

    if (!siteId) {
        console.warn('[Auth] Site ID is required to extract access token')
        return null
    }

    const cookieName = `cc-at_${siteId}`
    const token = req.cookies[cookieName]

    if (!token) {
        console.warn('[Auth] Token not found in cookie:', cookieName)
        return null
    }

    return token
}

/**
 * Extracts the site ID from the request.
 * Checks query parameters first, then falls back to headers.
 *
 * @param {Object} req - Express request object
 * @returns {string|null} The site ID if found, null otherwise
 */
export const extractSiteId = (req) => {
    if (req.query?.siteId) {
        return req.query.siteId
    }

    if (req.headers['x-site-id']) {
        return req.headers['x-site-id']
    }

    if (req.body?.siteId) {
        return req.body.siteId
    }

    return null
}

/**
 * Creates authorization headers for Commerce Cloud API requests.
 *
 * @param {string} token - The access token
 * @returns {Object} Headers object with Authorization
 */
export const createAuthHeaders = (token) => {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}
