/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* -------------------------------------------------------------------------
 * Shared Salesforce domain allowlists for the shopper-agent proxies.
 *
 * SSRF/CSRF prevention: the Token Bridge proxy and the browser-side auth-link
 * client both need to validate that a URL's host belongs to trusted Salesforce
 * infrastructure before they fetch it (SSRF) or trust it as a request Origin
 * (CSRF). They talk to two DIFFERENT host families, so there are two validators:
 *
 *   - isTrustedSalesforceDomain — Core My Domain (`*.salesforce.com`). Used by
 *     the Token Bridge proxy for its upstream (AGENT_MYDOMAIN) and for its CSRF
 *     Origin check (the Storefront Preview iframe is served from Core).
 *   - isTrustedSCRTDomain — SCRT2 (`*.salesforce-scrt.com`). Used by the
 *     auth-link client to validate the configured scrt2Url before the browser
 *     sends the Commerce Client JWT to it; the /iamessage/* endpoint lives on
 *     SCRT2, a different host from Core's My Domain.
 *
 * These lists previously lived (and drifted) as copies inside each caller. They
 * are consolidated here so there is a single source of truth. This module is
 * intentionally free of React and of `@salesforce/retail-react-app/...`
 * self-referential imports so it can be loaded by `app/ssr.js` under bare
 * `babel-node` during local development, same as its importers.
 * ------------------------------------------------------------------------- */

/**
 * Validate that a URL's hostname is a trusted Salesforce **Core** domain
 * (`*.salesforce.com`, incl. `*.my.salesforce.com` and `*.pc-rnd.salesforce.com`).
 *
 * Used for the Token Bridge proxy's CSRF Origin check (the Storefront Preview
 * iframe is served from Core's My Domain) and for its upstream SSRF check
 * (AGENT_MYDOMAIN). Deliberately does NOT include SCRT2 suffixes — see
 * isTrustedSCRTDomain for those.
 *
 * @param {string} candidateUrl - The full URL to check (e.g., https://org.my.salesforce.com)
 * @returns {boolean} - True if the host is a trusted Salesforce Core domain, false otherwise
 */
export function isTrustedSalesforceDomain(candidateUrl) {
    try {
        const url = new URL(candidateUrl)
        const host = url.hostname.toLowerCase()

        // Allowlist: Salesforce Core production, sandbox, and developer domains
        return (
            host.endsWith('.salesforce.com') ||
            host.endsWith('.my.salesforce.com') ||
            host.endsWith('.pc-rnd.salesforce.com')
        )
    } catch {
        // Invalid URL
        return false
    }
}

/**
 * Validate that a URL's hostname is a trusted **SCRT2** domain
 * (`*.salesforce-scrt.com`, incl. `*.my.salesforce-scrt.com` and
 * `*.pc-rnd.salesforce-scrt.com`).
 *
 * Used by the auth-link client to validate the configured scrt2Url before the
 * browser sends the Commerce Client JWT to it. SCRT2 is a different host family
 * from Core's My Domain, so this is a separate list from isTrustedSalesforceDomain
 * — do NOT merge them into one broader allowlist.
 *
 * @param {string} candidateUrl - The full URL to check (e.g., https://org.my.salesforce-scrt.com)
 * @returns {boolean} - True if the host is a trusted SCRT2 domain, false otherwise
 */
export function isTrustedSCRTDomain(candidateUrl) {
    try {
        const url = new URL(candidateUrl)
        const host = url.hostname.toLowerCase()

        // Allowlist: SCRT2 production, sandbox, and developer domains
        return (
            host.endsWith('.salesforce-scrt.com') ||
            host.endsWith('.my.salesforce-scrt.com') ||
            host.endsWith('.pc-rnd.salesforce-scrt.com')
        )
    } catch {
        // Invalid URL
        return false
    }
}
