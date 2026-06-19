/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* global WEBPACK_TARGET */

/**
 * Returns the current W3C `traceparent` for outbound SCAPI/SLAS propagation, or
 * undefined when unavailable (browser, tracing disabled, or no active span).
 *
 * The distributed-tracing module is server-only (it pulls in Node OpenTelemetry),
 * so it is required lazily behind a server guard. `WEBPACK_TARGET` is a build-time
 * constant (DefinePlugin) that lets webpack strip this branch — and the require —
 * out of the client bundle entirely.
 *
 * @returns {string|undefined} the active span's traceparent, or undefined
 */
export const getServerTraceparent = () => {
    if (typeof WEBPACK_TARGET !== 'undefined' && WEBPACK_TARGET !== 'node') return undefined
    if (typeof window !== 'undefined') return undefined
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const dt = require('@salesforce/pwa-kit-react-sdk/ssr/server/distributed-tracing')
        return dt.getCurrentTraceparent() || undefined
    } catch {
        return undefined
    }
}
