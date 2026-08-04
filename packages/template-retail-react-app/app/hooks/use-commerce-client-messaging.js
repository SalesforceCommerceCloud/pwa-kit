/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef} from 'react'
import {
    DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION,
    DEFAULT_COMMERCE_CLIENT_COMPONENT_CONFIG,
    DEFAULT_COMMERCE_CLIENT_ELEMENT_ID,
    DEFAULT_COMMERCE_CLIENT_THEME
} from '@salesforce/retail-react-app/app/constants'

const onClient = typeof window !== 'undefined'

/**
 * Injects the Commerce Client messaging widget into the page using the global
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
 * @param {string} [options.capabilitiesVersion] - Embedded Messaging capabilities version (defaults to '65')
 * @param {boolean} [options.enableEscalationToAgent=true] - Whether shoppers can escalate to a human agent
 * @param {boolean} [options.enableDownloadTranscript=true] - Whether shoppers can download the chat transcript
 * @param {Object} [options.routingAttributes] - Optional Agentforce routing attributes
 * @param {string} [options.logoUrl] - URL of the logo shown in the widget
 * @param {string} [options.headerText] - Header text shown at the top of the widget
 * @param {string} [options.disclaimerMarkdown] - Markdown disclaimer shown in the widget (supports links/basic markdown)
 * @param {Object} [options.searchConfig] - Search input configuration for the widget
 * @param {string} [options.searchConfig.placeholder] - Placeholder text for the search input
 * @param {string} [options.searchConfig.buttonLabel] - Label for the search button
 * @param {string} [options.searchConfig.buttonType] - Search button style (e.g. 'icon', 'text', 'icon-text')
 * @param {string} [options.searchConfig.buttonIconUrl] - URL of the icon shown on the search button
 * @param {string} [options.globalClassName] - Custom class added to widget elements for CSS specificity
 * @param {boolean} [options.isDevelopment] - When true, logs widget events to the console
 * @param {Object} [options.componentConfig] - Partial component config merged over the defaults
 * @param {Object} [options.theme] - Partial theme merged over the defaults
 * @param {string} [options.overridesUrl] - URL to customer's component override script (sets window.CimulateOverrides)
 * @param {Object} [options.overrides] - Inline map of override keys (e.g. `ProductTile`) to registered custom element tag names. The widget takes a single override source, so callers should pass this or `overridesUrl`, not both
 * @returns {boolean} True when the widget injection was invoked, false otherwise
 */
const injectCommerceClientWidget = ({
    elementId = DEFAULT_COMMERCE_CLIENT_ELEMENT_ID,
    scrt2Url,
    orgId,
    esDeveloperName,
    capabilitiesVersion = DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION,
    enableEscalationToAgent = true,
    enableDownloadTranscript = true,
    routingAttributes,
    logoUrl,
    headerText,
    disclaimerMarkdown,
    searchConfig,
    globalClassName,
    isDevelopment = false,
    componentConfig,
    theme,
    overridesUrl,
    overrides
} = {}) => {
    if (!onClient) return false

    try {
        const commerceClient = window.CimulateMessaging
        if (!commerceClient || typeof commerceClient.injectMessagingWidget !== 'function') {
            console.error(
                'Commerce Client messaging bundle is not available. Ensure messaging.umd.js has loaded before injecting the widget.'
            )
            return false
        }

        const messagingConfig = {
            scrt2Url,
            orgId,
            esDeveloperName,
            capabilitiesVersion,
            enableEscalationToAgent,
            enableDownloadTranscript
        }
        if (routingAttributes && typeof routingAttributes === 'object') {
            messagingConfig.routingAttributes = routingAttributes
        }

        commerceClient.injectMessagingWidget({
            elementId,
            mode: 'messaging',
            messagingConfig,
            ...(logoUrl ? {logoUrl} : {}),
            ...(headerText ? {headerText} : {}),
            ...(disclaimerMarkdown ? {disclaimerMarkdown} : {}),
            ...(searchConfig && typeof searchConfig === 'object' ? {searchConfig} : {}),
            ...(globalClassName ? {globalClassName} : {}),
            isDevelopment,
            componentConfig: {
                ...DEFAULT_COMMERCE_CLIENT_COMPONENT_CONFIG,
                ...componentConfig,
                options: {
                    ...DEFAULT_COMMERCE_CLIENT_COMPONENT_CONFIG.options,
                    ...componentConfig?.options
                }
            },
            theme: {...DEFAULT_COMMERCE_CLIENT_THEME, ...theme},
            ...(overridesUrl ? {overridesUrl} : {}),
            ...(overrides && typeof overrides === 'object' ? {overrides} : {})
        })
        return true
    } catch (err) {
        console.error('Error injecting Commerce Client messaging widget: ', err)
        return false
    }
}

/**
 * Custom hook that injects the Commerce Client messaging widget once the
 * messaging UMD bundle has finished loading. The widget is injected a single
 * time for the lifetime of the component to avoid duplicate widgets.
 *
 * @param {Object} scriptLoadStatus - Status of the messaging bundle script load
 * @param {boolean} scriptLoadStatus.loaded - Whether the script finished loading
 * @param {boolean} scriptLoadStatus.error - Whether the script failed to load
 * @param {Object} options - Widget injection options. See {@link injectCommerceClientWidget}.
 */
const useCommerceClientMessaging = (scriptLoadStatus, options = {}) => {
    const hasInjectedRef = useRef(false)

    useEffect(() => {
        if (!scriptLoadStatus?.loaded || scriptLoadStatus?.error) {
            return
        }

        if (hasInjectedRef.current) {
            return
        }

        const didInject = injectCommerceClientWidget(options)
        if (didInject) {
            hasInjectedRef.current = true
        }
    }, [scriptLoadStatus, options])
}

export default useCommerceClientMessaging
export {injectCommerceClientWidget}
