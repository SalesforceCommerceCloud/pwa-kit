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
