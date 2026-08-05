/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* -------------------------------------------------------------------------
 * Commerce Client component-override configuration.
 *
 * Both the browser (which forwards the override option to the widget) and
 * `app/ssr.js` (which allows the hosted script's origin in the CSP) resolve the
 * override config through here, so the policy can never allow an origin the
 * widget would refuse to load.
 *
 * This module is intentionally free of imports — in particular the
 * `@salesforce/retail-react-app/...` self-referential ones used elsewhere in
 * `app/utils` — so `app/ssr.js` can load it under bare `babel-node`, which has
 * no webpack aliases. See the same note in
 * `app/components/shopper-agent/token-bridge.js`.
 * ---------------------------------------------------------------------- */

/**
 * Validates that a URL uses HTTPS (required for override scripts).
 * Unlike the widget script, override scripts can be hosted on any domain
 * (customer's own CDN).
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL uses HTTPS
 */
export const validateOverridesUrl = (url) => {
    try {
        const parsed = new URL(url)
        return parsed.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Resolves the widget's component-override option from config. The widget accepts a
 * single override source, so `cc_overrides` and `cc_overridesUrl` are mutually
 * exclusive: an inline map wins and the hosted script URL is dropped when both are set.
 *
 * A hosted script URL is only returned when it passes `validateOverridesUrl`, so a
 * non-HTTPS or malformed value is dropped rather than forwarded to the widget.
 *
 * @param {Object} [commerceAgent] - Commerce agent configuration object
 * @param {Object} [commerceAgent.cc_overrides] - Inline map of override keys (e.g. `ProductTile`) to registered custom element tag names
 * @param {string} [commerceAgent.cc_overridesUrl] - HTTPS URL of a hosted override script
 * @returns {Object} `{overrides}`, `{overridesUrl}`, or an empty object when neither is configured
 */
export const resolveCommerceClientOverrideOptions = ({cc_overrides, cc_overridesUrl} = {}) => {
    if (cc_overrides && Object.keys(cc_overrides).length) {
        return {overrides: cc_overrides}
    }

    if (cc_overridesUrl && validateOverridesUrl(cc_overridesUrl)) {
        return {overridesUrl: cc_overridesUrl}
    }

    return {}
}

/**
 * Resolves the Content-Security-Policy `script-src` sources needed for a merchant-hosted
 * component-override script. The widget loads that script in the browser, so its origin
 * must be allowed by the policy or it is blocked before it can register
 * `window.CimulateOverrides`.
 *
 * Returns an origin rather than the configured URL because CSP source expressions cannot
 * carry a query string or fragment. Empty whenever no hosted script is in effect — an
 * inline `cc_overrides` map wins, the URL fails validation, or nothing is configured —
 * so the policy is never widened beyond what the widget actually loads.
 *
 * @param {Object} [commerceAgent] - Commerce agent configuration object
 * @returns {string[]} `[origin]` for a valid hosted override script, otherwise an empty array
 */
export const getCommerceClientOverridesCspSources = (commerceAgent) => {
    const {overridesUrl} = resolveCommerceClientOverrideOptions(commerceAgent)

    return overridesUrl ? [new URL(overridesUrl).origin] : []
}
