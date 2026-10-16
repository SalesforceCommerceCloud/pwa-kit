/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1'])

export const isLoopbackHostname = (hostname) => LOOPBACK_HOSTNAMES.has(hostname)

/**
 * TODO (before merging to develop): This is temporary starter-branch support
 * for testing a locally built Commerce Client against the local PWA Kit app.
 * Remove this module unless that contributor workflow is intentionally productized.
 *
 * Resolve an explicitly configured local Commerce Client script to its exact
 * asset origin. Local assets are permitted only in development; deployed and
 * test builds always fail closed.
 */
export const getLocalCommerceClientAssetOrigin = (
    scriptSourceUrl,
    nodeEnv = process.env.NODE_ENV
) => {
    if (nodeEnv !== 'development') {
        return null
    }

    try {
        const {hostname, origin, protocol} = new URL(scriptSourceUrl)
        return isLoopbackHostname(hostname) && ['http:', 'https:'].includes(protocol)
            ? origin
            : null
    } catch {
        return null
    }
}

/**
 * Return the exact local asset origin for relevant CSP directives. Consumers
 * should spread this result rather than reimplementing the development policy.
 */
export const getLocalCommerceClientCspSources = (commerceAgent, nodeEnv = process.env.NODE_ENV) => {
    const origin = getLocalCommerceClientAssetOrigin(
        commerceAgent?.commerceClientScriptSourceUrl,
        nodeEnv
    )
    return origin ? [origin] : []
}
