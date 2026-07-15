/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {
    COMMERCE_CLIENT_LOADING_MODE,
    DEFAULT_COMMERCE_CLIENT_LOADING_MODE,
    DEFAULT_COMMERCE_CLIENT_STATIC_ASSET_PATH
} from '@salesforce/retail-react-app/app/constants'

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
 * Returns true when the Commerce Client widget should load its assets from this
 * app's own bundled static assets rather than the external Cimulate CDN.
 *
 * Mirrors the SFCC cartridge's `cc_loadingMode` site preference. Defaults to CDN
 * so existing storefronts are unaffected.
 *
 * @param {Object} commerceAgent - Commerce agent configuration object
 * @param {string} [commerceAgent.commerceClientLoadingMode] - 'cdn' (default) or 'static'
 * @returns {boolean} True when loading mode is 'static'
 */
export const isCommerceClientStaticLoadingMode = (commerceAgent) => {
    const mode = commerceAgent?.commerceClientLoadingMode || DEFAULT_COMMERCE_CLIENT_LOADING_MODE
    return mode === COMMERCE_CLIENT_LOADING_MODE.STATIC
}

/**
 * Resolves the effective URL used to load the Commerce Client messaging UMD
 * bundle, based on the configured loading mode.
 *
 * - `static`: resolves `commerceClientStaticAssetPath` (default
 *   'static/commerce-client/messaging.umd.js') to an absolute, same-origin URL
 *   via {@link getAssetUrl}. The bundle must be copied into `app/static/` first
 *   (see the `copy:commerce-client` script).
 * - `cdn` (default): returns `commerceClientScriptSourceUrl` as-is.
 *
 * @param {Object} commerceAgent - Commerce agent configuration object
 * @param {string} [commerceAgent.commerceClientLoadingMode] - 'cdn' (default) or 'static'
 * @param {string} [commerceAgent.commerceClientScriptSourceUrl] - CDN bundle URL (used when mode is 'cdn')
 * @param {string} [commerceAgent.commerceClientStaticAssetPath] - Bundle path relative to the build dir (used when mode is 'static')
 * @returns {string} The URL to pass to the script loader
 */
export const resolveCommerceClientScriptUrl = (commerceAgent) => {
    if (isCommerceClientStaticLoadingMode(commerceAgent)) {
        const assetPath =
            commerceAgent?.commerceClientStaticAssetPath ||
            DEFAULT_COMMERCE_CLIENT_STATIC_ASSET_PATH
        return getAssetUrl(assetPath)
    }
    return commerceAgent?.commerceClientScriptSourceUrl || ''
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
 * @param {string} [commerceAgent.esDeveloperName] - Embedded Service developer name
 * @param {string} [commerceAgent.embeddedServiceName] - Fallback for `esDeveloperName`
 * @param {string} commerceAgent.commerceClientScriptSourceUrl - URL of the Commerce Client messaging bundle
 * @returns {boolean} True if configuration is valid, false otherwise
 */
export const validateCommerceClientAgentSettings = (commerceAgent) => {
    if (!commerceAgent || typeof commerceAgent !== 'object') {
        console.error('Commerce agent configuration must be an object.')
        return false
    }

    const isStatic = isCommerceClientStaticLoadingMode(commerceAgent)

    const requiredValues = {
        scrt2Url: commerceAgent.scrt2Url,
        salesforceOrgId: commerceAgent.salesforceOrgId,
        esDeveloperName: commerceAgent.esDeveloperName || commerceAgent.embeddedServiceName,
        // In 'static' mode the bundle is served from this app's own static assets
        // (commerceClientStaticAssetPath, which has a default), so the CDN URL is
        // not required. In 'cdn' mode the source URL must be provided.
        ...(isStatic ? {} : {commerceClientScriptSourceUrl: commerceAgent.commerceClientScriptSourceUrl})
    }

    const isValid = Object.values(requiredValues).every(
        (value) => typeof value === 'string' && value.trim() !== ''
    )

    if (!isValid) {
        console.error(
            isStatic
                ? 'Invalid Commerce Client agent settings. Required: scrt2Url, salesforceOrgId, and esDeveloperName (or embeddedServiceName).'
                : 'Invalid Commerce Client agent settings. Required: scrt2Url, salesforceOrgId, esDeveloperName (or embeddedServiceName), and commerceClientScriptSourceUrl.'
        )
        return false
    }

    // Domain allowlist only applies to externally-hosted CDN bundles. In 'static'
    // mode the bundle is served same-origin from this app, so skip the check.
    if (!isStatic && !validateCommerceClientDomain(commerceAgent.commerceClientScriptSourceUrl)) {
        console.error(
            'Commerce Client script URL must be served from a trusted cimulate.ai or sfcc-store-internal.net domain.'
        )
        return false
    }

    return true
}
