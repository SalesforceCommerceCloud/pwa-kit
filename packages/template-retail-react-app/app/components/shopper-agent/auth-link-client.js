/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {isTrustedSCRTDomain} from './salesforce-domain-allowlist.js'

const SCRT_AUTH_LINK_PATH = '/iamessage/api/v2/authorization/authlink'
const SCRT_FETCH_TIMEOUT_MS = 10000

/**
 * Validate and canonicalize the configured SCRT2 URL before sending a bearer token to it.
 * The configuration must identify an HTTPS origin, not an arbitrary base URL.
 *
 * @param {string} scrt2Url - Configured SCRT2 origin
 * @returns {string} Canonical SCRT2 origin
 */
export const normalizeScrt2Origin = (scrt2Url) => {
    if (!scrt2Url || typeof scrt2Url !== 'string') {
        throw new Error('INVALID_SCRT2_URL')
    }

    let url
    try {
        url = new URL(scrt2Url.trim())
    } catch {
        throw new Error('INVALID_SCRT2_URL')
    }

    if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.port ||
        url.pathname !== '/' ||
        url.search ||
        url.hash ||
        !isTrustedSCRTDomain(url.origin)
    ) {
        throw new Error('INVALID_SCRT2_URL')
    }

    return url.origin
}

/**
 * Retrieve an auth link key directly from SCRT2 using the Commerce Client JWT.
 *
 * @param {Object} options - Request options
 * @param {string} options.commerceClientJWT - JWT stored by the Commerce Client widget
 * @param {string} options.scrt2Url - Configured SCRT2 origin
 * @returns {Promise<{auth_link_key: string}>} SCRT2 auth link response
 */
export const callAuthLink = async ({commerceClientJWT, scrt2Url}) => {
    if (typeof commerceClientJWT !== 'string' || !commerceClientJWT.trim()) {
        throw new Error('MISSING_COMMERCE_CLIENT_JWT')
    }

    const scrt2Origin = normalizeScrt2Origin(scrt2Url)
    const controller = typeof AbortController === 'function' ? new AbortController() : null
    const timeoutId = controller
        ? setTimeout(() => controller.abort(), SCRT_FETCH_TIMEOUT_MS)
        : null

    try {
        const response = await fetch(`${scrt2Origin}${SCRT_AUTH_LINK_PATH}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${commerceClientJWT.trim()}`
            },
            credentials: 'omit',
            cache: 'no-store',
            redirect: 'error',
            referrerPolicy: 'no-referrer',
            ...(controller ? {signal: controller.signal} : {})
        })

        if (!response.ok) {
            throw new Error(`AUTH_LINK_HTTP_${response.status}`)
        }

        let body
        try {
            body = await response.json()
        } catch (error) {
            if (error?.name === 'AbortError') throw error
            throw new Error('INVALID_AUTH_LINK_RESPONSE')
        }

        // SCRT2 has returned the key under both snake_case (`auth_link_key`) and
        // camelCase (`authLinkKey`); accept either so a response-shape difference
        // does not silently break token bridging downstream.
        const authLinkKey =
            typeof body?.auth_link_key === 'string'
                ? body.auth_link_key
                : typeof body?.authLinkKey === 'string'
                ? body.authLinkKey
                : null

        if (!authLinkKey || !authLinkKey.trim()) {
            throw new Error('INVALID_AUTH_LINK_RESPONSE')
        }

        return {auth_link_key: authLinkKey.trim()}
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error('AUTH_LINK_TIMEOUT')
        }
        throw error
    } finally {
        if (timeoutId) clearTimeout(timeoutId)
    }
}
