/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    COMMERCE_CLIENT_CDN_BASE_URL,
    COMMERCE_CLIENT_OPEN_STATE_KEY
} from '@salesforce/retail-react-app/app/constants'
import {validateOverridesUrl} from '@salesforce/retail-react-app/app/utils/commerce-client-overrides'

const onClient = typeof window !== 'undefined'

/**
 * Launch the chat using the embedded service bootstrap API
 *
 * When the floating chat button is hidden (hideChatButtonOnLoad=true), this function
 * first shows the chat button via utilAPI.showChatButton() before launching the chat,
 * ensuring the chat window opens correctly.
 *
 * @function launchChat
 * @returns {void}
 */
export function launchChat() {
    if (!onClient) return

    try {
        const utilAPI = window.embeddedservice_bootstrap?.utilAPI
        if (!utilAPI) return

        const hideChatButtonOnLoad =
            window.embeddedservice_bootstrap?.settings?.hideChatButtonOnLoad === true
        if (hideChatButtonOnLoad && typeof utilAPI.showChatButton === 'function') {
            utilAPI.showChatButton()
        }

        if (typeof utilAPI.launchChat === 'function') {
            utilAPI.launchChat()
        }
    } catch (error) {
        console.error('Shopper Agent: Error launching chat', error)
    }
}

/**
 * Open the shopper agent chat window
 *
 * Programmatically opens the embedded messaging widget by finding and clicking
 * the embedded service chat button. This function can be called from custom
 * UI elements like header buttons.
 *
 * @function openShopperAgent
 * @returns {void}
 */
export function openShopperAgent() {
    if (!onClient) return

    try {
        launchChat()
    } catch (error) {
        console.error('Shopper Agent: Error opening agent', error)
    }
}

/**
 * Resets Embedded Messaging (MIAW) when the Commerce shopper session **type** changes between
 * guest and registered (login, registration, or logout). Calls Salesforce
 * `userVerificationAPI.clearSession`, which ends the active messaging session and returns the
 * client to the floating action button (FAB) baseline.
 *
 * **Short-term (current):** Full session clear is the supported API for auth transitions; the
 * public `utilAPI` does not expose a “minimize only” method.
 *
 * **Long-term (product):** Optionally explore keeping the channel open and re-issuing identity
 * tokens (`setIdentityToken`) versus requiring a new conversation after verification—see
 * Messaging for Web User Verification and `onEmbeddedMessagingIdentityTokenExpired`.
 *
 * @see https://developer.salesforce.com/docs/service/messaging-web/references/m4w-reference/userVerificationAPI.html
 * @returns {void}
 */
export function resetEmbeddedMessagingForCommerceSessionChange() {
    if (typeof window === 'undefined') {
        return
    }

    try {
        const clearSession = window.embeddedservice_bootstrap?.userVerificationAPI?.clearSession
        if (typeof clearSession !== 'function') {
            return
        }
        void Promise.resolve(clearSession(true)).catch((err) => {
            console.error('Shopper Agent: clearSession after Commerce auth transition failed', err)
        })
    } catch (error) {
        console.error(
            'Shopper Agent: reset embedded messaging after Commerce auth transition failed',
            error
        )
    }
}

/**
 * Show or hide the Commerce Client messaging widget.
 *
 * Uses the SDK exposed on `window.CimulateMessaging.eventHandlers`. Passing no
 * argument toggles the widget; pass `true`/`false` to explicitly set its state.
 *
 * @function openCommerceClientWidget
 * @param {boolean} [show=true] - Whether to show (true) or hide (false) the widget
 * @returns {void}
 */
export function openCommerceClientWidget(show = true) {
    if (!onClient) return

    try {
        const components = window.CimulateMessaging?.eventHandlers?.components
        if (components && typeof components.toggleWidgetOpen === 'function') {
            components.toggleWidgetOpen(show)
        }
    } catch (error) {
        console.error('Shopper Agent: Error toggling Commerce Client widget', error)
    }
}

/**
 * Persist whether the Commerce Client panel is open to `sessionStorage`, so it
 * survives page navigation and resets to the configured default in a fresh tab.
 *
 * @function persistCommerceClientOpenState
 * @param {boolean} isOpen - Whether the panel is currently open
 * @returns {void}
 */
export function persistCommerceClientOpenState(isOpen) {
    if (!onClient) return

    try {
        window.sessionStorage.setItem(
            COMMERCE_CLIENT_OPEN_STATE_KEY,
            JSON.stringify(Boolean(isOpen))
        )
    } catch (error) {
        console.error('Shopper Agent: Error persisting Commerce Client open state', error)
    }
}

/**
 * Read the persisted Commerce Client panel open-state. Returns `undefined` when
 * nothing is stored so callers can fall back to the configured `cc_isOpen` default.
 *
 * @function getPersistedCommerceClientOpenState
 * @returns {boolean|undefined} The stored open-state, or `undefined` when unset
 */
export function getPersistedCommerceClientOpenState() {
    if (!onClient) return undefined

    try {
        const stored = window.sessionStorage.getItem(COMMERCE_CLIENT_OPEN_STATE_KEY)
        if (stored === null) return undefined
        return JSON.parse(stored) === true
    } catch (error) {
        console.error('Shopper Agent: Error reading Commerce Client open state', error)
        return undefined
    }
}

/**
 * Open whichever shopper agent widget is active on the page.
 *
 * Detects the provider at runtime so callers (e.g. the header agent button)
 * don't need to know which integration is configured. The Commerce Client widget is
 * preferred when its SDK is present; otherwise it falls back to MIAW. This keeps
 * the header/agent entry points backwards compatible with the existing MIAW
 * integration.
 *
 * @function openShopperAgentWidget
 * @returns {void}
 */
export function openShopperAgentWidget() {
    if (!onClient) return

    try {
        if (window.CimulateMessaging?.eventHandlers?.components?.toggleWidgetOpen) {
            openCommerceClientWidget(true)
            return
        }

        launchChat()
    } catch (error) {
        console.error('Shopper Agent: Error opening agent', error)
    }
}

/**
 * Resolves the Commerce Client messaging bundle URL from the agent configuration.
 *
 * `cc_cdnVersion` (e.g. '1.18.0') is the common path: it is interpolated into the
 * Cimulate CDN URL. An explicit `commerceClientScriptSourceUrl` takes precedence
 * when set, which supports local dev (localhost) and SFCC self-hosted bundles.
 *
 * @param {Object} commerceAgent - Commerce agent configuration object
 * @param {string} [commerceAgent.cc_cdnVersion] - Cimulate CDN bundle version (e.g. '1.18.0')
 * @param {string} [commerceAgent.commerceClientScriptSourceUrl] - Explicit bundle URL override
 * @returns {string} The resolved bundle URL, or '' when neither field is set
 */
export const resolveCommerceClientScriptUrl = (commerceAgent) => {
    const override = commerceAgent?.commerceClientScriptSourceUrl
    if (typeof override === 'string' && override.trim() !== '') {
        return override.trim()
    }

    const version = commerceAgent?.cc_cdnVersion
    if (typeof version === 'string' && version.trim() !== '') {
        return `${COMMERCE_CLIENT_CDN_BASE_URL}/${version.trim()}/messaging.umd.js`
    }

    return ''
}

/**
 * Validates that a URL is served from a trusted Commerce Client domain.
 *
 * @param {string} url - The URL to validate (e.g., 'https://cdn.search.cimulate.ai/.../messaging.umd.js')
 * @returns {boolean} True if the URL is from a trusted Commerce Client domain, false otherwise
 */
export const validateCommerceClientDomain = (url) => {
    try {
        const {hostname} = new URL(url)
        return (
            hostname === 'cimulate.ai' ||
            hostname.endsWith('.cimulate.ai') ||
            hostname.endsWith('.sfcc-store-internal.net')
        )
    } catch {
        return false
    }
}

/**
 * Validates the commerce agent configuration for the Commerce Client widget.
 * The Commerce Client widget requires a different (smaller) set of fields than MIAW:
 * the SCRT2 URL, Salesforce org id, embedded service developer name, and the
 * URL of the Commerce Client messaging UMD bundle.
 *
 * @param {Object} commerceAgent - Commerce agent configuration object
 * @param {string} commerceAgent.scrt2Url - SCRT2 instance URL
 * @param {string} commerceAgent.salesforceOrgId - Salesforce organization ID (passed as `orgId`)
 * @param {string} [commerceAgent.cc_esDeveloperName] - Embedded Service developer name
 * @param {string} [commerceAgent.embeddedServiceName] - Fallback for `cc_esDeveloperName`
 * @param {string} [commerceAgent.cc_cdnVersion] - Cimulate CDN bundle version (e.g. '1.18.0')
 * @param {string} [commerceAgent.commerceClientScriptSourceUrl] - Explicit bundle URL override (local dev / self-hosting)
 * @param {string} [commerceAgent.cc_overridesUrl] - Optional URL to customer's component override script
 * @param {Object} [commerceAgent.cc_overrides] - Optional inline override map, mutually exclusive with `cc_overridesUrl`
 * @returns {boolean} True if configuration is valid, false otherwise
 */
export const validateCommerceClientAgentSettings = (commerceAgent) => {
    if (!commerceAgent || typeof commerceAgent !== 'object') {
        console.error('Commerce agent configuration must be an object.')
        return false
    }

    const scriptSourceUrl = resolveCommerceClientScriptUrl(commerceAgent)
    const requiredValues = {
        scrt2Url: commerceAgent.scrt2Url,
        salesforceOrgId: commerceAgent.salesforceOrgId,
        esDeveloperName: commerceAgent.cc_esDeveloperName || commerceAgent.embeddedServiceName,
        scriptSourceUrl
    }

    const isValid = Object.values(requiredValues).every(
        (value) => typeof value === 'string' && value.trim() !== ''
    )

    if (!isValid) {
        console.error(
            'Invalid Commerce Client agent settings. Required: scrt2Url, salesforceOrgId, cc_esDeveloperName (or embeddedServiceName), and cc_cdnVersion (or commerceClientScriptSourceUrl).'
        )
        return false
    }

    if (!validateCommerceClientDomain(scriptSourceUrl)) {
        console.error(
            'Commerce Client script URL must be served from a trusted cimulate.ai or sfcc-store-internal.net domain.'
        )
        return false
    }

    const hasInlineOverrides =
        Boolean(commerceAgent.cc_overrides) && Object.keys(commerceAgent.cc_overrides).length > 0

    // Non-fatal: resolveCommerceClientOverrideOptions drops the URL and keeps the inline map.
    if (hasInlineOverrides && commerceAgent.cc_overridesUrl) {
        console.warn(
            'Commerce Client cc_overrides and cc_overridesUrl are mutually exclusive. Using cc_overrides and ignoring cc_overridesUrl.'
        )
    }

    // Validate optional overrides URL (must be HTTPS, any domain allowed). Skipped when an
    // inline map wins, so we do not warn about a URL that is already being dropped.
    if (!hasInlineOverrides && commerceAgent.cc_overridesUrl) {
        if (!validateOverridesUrl(commerceAgent.cc_overridesUrl)) {
            console.warn(
                'Commerce Client overrides URL must use HTTPS. Overrides will not be loaded.'
            )
            // Non-fatal: widget still works without overrides
        }
    }

    return true
}
