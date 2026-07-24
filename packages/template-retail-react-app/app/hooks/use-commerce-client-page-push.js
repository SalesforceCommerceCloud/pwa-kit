/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import {COMMERCE_CLIENT_UI_STATE_EVENT} from '@salesforce/retail-react-app/app/constants'

const onClient = typeof window !== 'undefined'

const DEFAULT_PANEL_WIDTH = '420px'

/**
 * Derives the layout props that shift storefront content aside to make room for
 * the Commerce Client widget's full-height side panel (the "page push" effect).
 *
 * The widget renders as a `position: fixed` overlay in its own DOM subtree, so it
 * cannot reflow the host page — the template has to apply the shift. Open-state is
 * read from the widget's `cimulate:ui-state-update` window event, which fires for
 * every state change (our `toggleWidgetOpen` calls and the panel's own
 * close/minimize buttons alike), so the layout stays in sync however the panel closes.
 *
 * @param {Object} [commerceAgentConfiguration] - Commerce agent configuration object
 * @param {string} [commerceAgentConfiguration.provider] - Active provider ('miaw' | 'commerce-client')
 * @param {string} [commerceAgentConfiguration.cc_pagePush] - 'true' enables the page-push layout
 * @param {string} [commerceAgentConfiguration.cc_dialogFullHeight] - 'true' when the widget is a full-height side panel
 * @param {string} [commerceAgentConfiguration.cc_widgetPosition] - Docked corner: 'bottom-left' | 'bottom-right'
 * @param {string} [commerceAgentConfiguration.cc_dialogWidth] - Side-panel width (e.g. '420px')
 * @param {string} [commerceAgentConfiguration.cc_isOpen] - 'true' when the panel opens on load (seeds the initial state)
 * @returns {Object} Chakra style props to spread onto the content container. Empty when page-push is not active.
 */
export const useCommerceClientPagePush = (commerceAgentConfiguration = {}) => {
    const {
        provider = 'miaw',
        cc_pagePush = 'false',
        cc_dialogFullHeight = 'true',
        cc_widgetPosition = 'bottom-right',
        cc_dialogWidth = DEFAULT_PANEL_WIDTH,
        cc_isOpen = 'false'
    } = commerceAgentConfiguration

    // Page-push only applies to the full-height Commerce Client side panel.
    const isPagePushEnabled =
        provider === 'commerce-client' && cc_pagePush === 'true' && cc_dialogFullHeight === 'true'

    // Seed from cc_isOpen so the shift is applied on first paint when the panel
    // auto-opens, keeping SSR and client markup consistent.
    const [isPanelOpen, setIsPanelOpen] = useState(cc_isOpen === 'true')

    useEffect(() => {
        if (!onClient || !isPagePushEnabled) {
            return undefined
        }

        const handleUiStateUpdate = (event) => {
            const {property, value} = event?.detail || {}
            if (property === 'isOpen') {
                setIsPanelOpen(Boolean(value))
            }
        }

        window.addEventListener(COMMERCE_CLIENT_UI_STATE_EVENT, handleUiStateUpdate)
        return () => {
            window.removeEventListener(COMMERCE_CLIENT_UI_STATE_EVENT, handleUiStateUpdate)
        }
    }, [isPagePushEnabled])

    if (!isPagePushEnabled) {
        return {}
    }

    // Shift content away from the corner the panel docks to.
    const paddingProp = cc_widgetPosition === 'bottom-left' ? 'paddingLeft' : 'paddingRight'

    return {
        // Below `lg` the panel overlays content instead of pushing it.
        [paddingProp]: isPanelOpen ? {base: 0, lg: cc_dialogWidth} : 0,
        transition: 'padding 0.3s ease-in-out'
    }
}

export default useCommerceClientPagePush
