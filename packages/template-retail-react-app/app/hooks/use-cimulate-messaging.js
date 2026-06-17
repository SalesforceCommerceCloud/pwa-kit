/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef} from 'react'

const onClient = typeof window !== 'undefined'

/**
 * Default DOM element id the Cimulate Copilot widget is rendered into.
 */
const DEFAULT_CIMULATE_ELEMENT_ID = 'cimulate-messaging-widget'

/**
 * Default theme applied to the Cimulate widget. Individual values can be
 * overridden by passing a partial `theme` object to the hook.
 * These map internally to the `--cim-widget-*` CSS custom properties.
 */
const DEFAULT_CIMULATE_THEME = {
    primaryColor: '#0176d3',
    secondaryColor: '#014486',
    fontColor: '#1a202c',
    fontFamily: 'inherit',
    backgroundColor: '#ffffff',
    borderColor: '#dddddd'
}

/**
 * Default component configuration for the Cimulate widget. The widget renders
 * closed by default and is opened programmatically (e.g. from the header agent
 * button) via `eventHandlers.components.toggleWidgetOpen`.
 */
const DEFAULT_CIMULATE_COMPONENT_CONFIG = {
    isOpen: false,
    type: 'dialog',
    dialogPosition: 'bottom-right'
}

/**
 * Injects the Cimulate Copilot messaging widget into the page using the global
 * `window.CimulateMessaging.injectMessagingWidget` exposed by the messaging
 * UMD bundle (messaging.umd.js).
 *
 * The function is defensive: it returns `false` (and logs) when not running on
 * the client or when the messaging bundle has not loaded yet, so callers can
 * safely retry.
 *
 * @param {Object} options - Widget injection options
 * @param {string} [options.elementId] - DOM element id to render the widget into
 * @param {string} options.scrt2Url - SCRT2 instance URL for Salesforce messaging
 * @param {string} options.orgId - Salesforce organization ID
 * @param {string} options.esDeveloperName - Embedded Service developer name
 * @param {Object} [options.routingAttributes] - Optional Agentforce routing attributes
 * @param {string} [options.headerText] - Header text shown at the top of the widget
 * @param {string} [options.disclaimerMarkdown] - Markdown disclaimer shown in the widget (supports links/basic markdown)
 * @param {string} [options.globalClassName] - Custom class added to widget elements for CSS specificity
 * @param {boolean} [options.isDevelopment] - When true, logs widget events to the console
 * @param {Object} [options.componentConfig] - Partial component config merged over the defaults
 * @param {Object} [options.theme] - Partial theme merged over the defaults
 * @returns {boolean} True when the widget injection was invoked, false otherwise
 */
const injectCimulateWidget = ({
    elementId = DEFAULT_CIMULATE_ELEMENT_ID,
    scrt2Url,
    orgId,
    esDeveloperName,
    routingAttributes,
    headerText,
    disclaimerMarkdown,
    globalClassName,
    isDevelopment = false,
    componentConfig,
    theme
} = {}) => {
    if (!onClient) return false

    try {
        const cimulate = window.CimulateMessaging
        if (!cimulate || typeof cimulate.injectMessagingWidget !== 'function') {
            console.error(
                'Cimulate messaging bundle is not available. Ensure messaging.umd.js has loaded before injecting the widget.'
            )
            return false
        }

        const messagingConfig = {scrt2Url, orgId, esDeveloperName}
        if (routingAttributes && typeof routingAttributes === 'object') {
            messagingConfig.routingAttributes = routingAttributes
        }

        cimulate.injectMessagingWidget({
            elementId,
            messagingConfig,
            ...(headerText ? {headerText} : {}),
            ...(disclaimerMarkdown ? {disclaimerMarkdown} : {}),
            ...(globalClassName ? {globalClassName} : {}),
            isDevelopment,
            componentConfig: {...DEFAULT_CIMULATE_COMPONENT_CONFIG, ...componentConfig},
            theme: {...DEFAULT_CIMULATE_THEME, ...theme}
        })
        return true
    } catch (err) {
        console.error('Error injecting Cimulate messaging widget: ', err)
        return false
    }
}

/**
 * Custom hook that injects the Cimulate Copilot messaging widget once the
 * messaging UMD bundle has finished loading. The widget is injected a single
 * time for the lifetime of the component to avoid duplicate widgets.
 *
 * @param {Object} scriptLoadStatus - Status of the messaging bundle script load
 * @param {boolean} scriptLoadStatus.loaded - Whether the script finished loading
 * @param {boolean} scriptLoadStatus.error - Whether the script failed to load
 * @param {Object} options - Widget injection options. See {@link injectCimulateWidget}.
 */
const useCimulateMessaging = (scriptLoadStatus, options = {}) => {
    const hasInjectedRef = useRef(false)

    useEffect(() => {
        if (!scriptLoadStatus?.loaded || scriptLoadStatus?.error) {
            return
        }

        if (hasInjectedRef.current) {
            return
        }

        const didInject = injectCimulateWidget(options)
        if (didInject) {
            hasInjectedRef.current = true
        }
    }, [scriptLoadStatus, options])
}

export default useCimulateMessaging
export {
    injectCimulateWidget,
    DEFAULT_CIMULATE_ELEMENT_ID,
    DEFAULT_CIMULATE_THEME,
    DEFAULT_CIMULATE_COMPONENT_CONFIG
}
