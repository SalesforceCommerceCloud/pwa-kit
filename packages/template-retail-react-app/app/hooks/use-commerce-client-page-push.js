/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import {COMMERCE_CLIENT_UI_STATE_EVENT} from '@salesforce/retail-react-app/app/constants'
import {getPersistedCommerceClientOpenState} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

const onClient = typeof window !== 'undefined'

const DEFAULT_PANEL_WIDTH = '420px'

/**
 * Derives the layout props that shift storefront content aside to make room for
 * the Commerce Client widget's full-height side panel (the "page push" effect).
 *
 * The widget renders as a `position: fixed` overlay in its own DOM subtree, so it
 * cannot reflow the host page — the template has to apply the shift. Open-state, dock
 * position and widget type are read from the widget's `cimulate:ui-state-update` window
 * event, which fires for every state change (our `toggleWidgetOpen` calls, the panel's
 * own close/minimize buttons, and the header's Move left/right and expand controls
 * alike), so the layout stays in sync however the panel moves, expands or closes.
 *
 * @param {Object} [commerceAgentConfiguration] - Commerce agent configuration object
 * @param {string} [commerceAgentConfiguration.enabled] - 'true' when the shopper agent renders at all
 * @param {string} [commerceAgentConfiguration.provider] - Active provider ('miaw' | 'commerce-client')
 * @param {string} [commerceAgentConfiguration.cc_pagePush] - 'true' enables the page-push layout
 * @param {string} [commerceAgentConfiguration.cc_displayType] - Widget type: 'chat' | 'dialog' (default) | 'modal'
 * @param {string} [commerceAgentConfiguration.cc_dialogFullHeight] - 'true' when the widget is a full-height side panel
 * @param {string} [commerceAgentConfiguration.cc_widgetPosition] - Corner the panel docks to on load: 'bottom-left' | 'bottom-right' (shoppers can flip it at runtime)
 * @param {string} [commerceAgentConfiguration.cc_dialogWidth] - Side-panel width (e.g. '420px')
 * @param {string} [commerceAgentConfiguration.cc_isOpen] - 'true' when the panel opens on load (seeds the initial state)
 * @returns {Object} Chakra style props to spread onto the content container. Empty when page-push is not active.
 */
export const useCommerceClientPagePush = (commerceAgentConfiguration = {}) => {
    const {
        enabled = 'false',
        provider = 'miaw',
        cc_pagePush = 'false',
        cc_displayType = 'dialog',
        cc_dialogFullHeight = 'true',
        cc_widgetPosition = 'bottom-right',
        cc_dialogWidth = DEFAULT_PANEL_WIDTH,
        cc_isOpen = 'false'
    } = commerceAgentConfiguration

    // Page-push only applies to a rendered, full-height Commerce Client side panel:
    // modal and inline chat widgets never occupy the edge of the viewport, and a
    // disabled agent has no panel to make room for.
    const isPagePushConfigured =
        enabled === 'true' &&
        provider === 'commerce-client' &&
        cc_pagePush === 'true' &&
        cc_displayType === 'dialog' &&
        cc_dialogFullHeight === 'true'

    // Seed from cc_isOpen for SSR/hydration consistency; the persisted open-state is
    // reconciled client-side in the mount effect below (sessionStorage is SSR-unsafe).
    const [isPanelOpen, setIsPanelOpen] = useState(cc_isOpen === 'true')

    // The widget re-initializes its position from `dialogPosition` on every injection,
    // so the configured corner is the right seed on each page.
    const [panelPosition, setPanelPosition] = useState(cc_widgetPosition)

    // The header's expand control swaps the docked panel for a centered modal, so the
    // live type — not the configured one — decides whether content should shift.
    const [widgetType, setWidgetType] = useState(cc_displayType)

    useEffect(() => {
        if (!onClient || !isPagePushConfigured) {
            return undefined
        }

        // Restore the shift after navigation to match the panel the widget re-injects.
        const persistedOpen = getPersistedCommerceClientOpenState()
        if (persistedOpen !== undefined) {
            setIsPanelOpen(persistedOpen)
        }

        const handleUiStateUpdate = (event) => {
            const {property, value} = event?.detail || {}
            if (property === 'isOpen') {
                setIsPanelOpen(Boolean(value))
            } else if (property === 'position' && typeof value === 'string') {
                setPanelPosition(value)
            } else if (property === 'type' && typeof value === 'string') {
                setWidgetType(value)
            }
        }

        window.addEventListener(COMMERCE_CLIENT_UI_STATE_EVENT, handleUiStateUpdate)
        return () => {
            window.removeEventListener(COMMERCE_CLIENT_UI_STATE_EVENT, handleUiStateUpdate)
        }
    }, [isPagePushConfigured])

    if (!isPagePushConfigured) {
        return {}
    }

    const isContentShifted = isPanelOpen && widgetType === 'dialog'

    // Shift content away from the side the panel currently occupies.
    const paddingProp = panelPosition === 'bottom-left' ? 'paddingLeft' : 'paddingRight'

    return {
        // Below `lg` the panel overlays content instead of pushing it.
        [paddingProp]: isContentShifted ? {base: 0, lg: cc_dialogWidth} : 0,
        transition: 'padding 0.3s ease-in-out'
    }
}

export default useCommerceClientPagePush
