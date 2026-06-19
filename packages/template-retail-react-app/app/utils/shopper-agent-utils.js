/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
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
