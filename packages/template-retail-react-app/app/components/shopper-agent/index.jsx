/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'
import {useUsid} from '@salesforce/commerce-sdk-react'
import PropTypes from 'prop-types'
import {useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'
import useMiaw, {normalizeLocaleToSalesforce} from '@salesforce/retail-react-app/app/hooks/use-miaw'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'

const onClient = typeof window !== 'undefined'

/**
 * Validates that a URL is from a trusted Salesforce domain.
 *
 * @param {string} url - The URL to validate (e.g., 'https://myorg.salesforce.com/script.js')
 * @returns {boolean} True if the URL is from a trusted Salesforce domain, false otherwise
 * @throws {TypeError} If the URL is invalid and cannot be parsed
 */
const validateSalesforceDomain = (url) => {
    try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname

        // Check for trusted Salesforce domains
        return (
            hostname.endsWith('.salesforce.com') ||
            hostname.endsWith('.salesforce-scrt.com') ||
            hostname.endsWith('pc-rnd.salesforce-scrt.com') ||
            hostname.endsWith('.pc-rnd.site.com') ||
            hostname.endsWith('.my.site.com')
        )
    } catch {
        return false
    }
}

/**
 * Validates the commerce agent configuration object to ensure all required fields
 * are present and valid before initializing the embedded messaging service.
 *
 * @param {Object} commerceAgent - Commerce agent configuration object
 * @returns {boolean} True if configuration is valid, false otherwise
 * @throws {Error} When configuration validation fails
 */
const validateCommerceAgentSettings = (commerceAgent) => {
    if (!commerceAgent || typeof commerceAgent !== 'object') {
        console.error('Commerce agent configuration must be an object.')
        return false
    }

    const requiredFields = [
        'enabled',
        'askAgentOnSearch',
        'embeddedServiceName',
        'embeddedServiceEndpoint',
        'scriptSourceUrl',
        'scrt2Url',
        'salesforceOrgId',
        'commerceOrgId',
        'siteId'
    ]

    const isValid = requiredFields.every(
        (key) => typeof commerceAgent[key] === 'string' && commerceAgent[key].trim() !== ''
    )

    if (!isValid) {
        console.error('Invalid commerce agent settings.')
        return false
    }

    // Validate optional conversation context properties if present
    if (commerceAgent.enableConversationContext !== undefined) {
        if (typeof commerceAgent.enableConversationContext !== 'string') {
            console.error('enableConversationContext must be a string.')
            return false
        }
    }

    if (commerceAgent.conversationContext !== undefined) {
        if (!Array.isArray(commerceAgent.conversationContext)) {
            console.error('conversationContext must be an array.')
            return false
        }
    }

    // Add domain validation for script URL
    if (commerceAgent.scriptSourceUrl) {
        const isTrustedDomain = validateSalesforceDomain(commerceAgent.scriptSourceUrl)
        if (!isTrustedDomain) {
            console.error('Script URL must be from a trusted Salesforce domain.')
            return false
        }
    }

    return true
}

/**
 * Checks if the shopper agent only runs when explicitly enabled
 * and when executing in a browser environment.
 *
 * @param {string} enabled - String representation of enabled state ('true' or 'false')
 * @returns {boolean} True if enabled is 'true' and running on client, false otherwise
 */
const isEnabled = (enabled) => {
    return enabled === 'true' && onClient
}

/**
 * Internal component that renders the embedded messaging window.
 * This component handles the lifecycle of the Salesforce Embedded Messaging service,
 * including script loading, initialization, event handling, and cleanup.
 *
 * Key responsibilities:
 * - Loads the embedded messaging script using useScript hook
 * - Initializes the MIAW service using useMiaw hook
 * - Sets up prechat fields with current locale, currency, and user context
 * - Manages event listeners for messaging lifecycle events
 * - Handles z-index management for maximized chat windows
 * - Cleans up resources on unmount
 *
 * @param {Object} props - Component props
 * @param {Object} props.commerceAgentConfiguration - Commerce agent configuration object
 * @param {string} props.commerceAgentConfiguration.embeddedServiceName - Name of the embedded service
 * @param {string} props.commerceAgentConfiguration.embeddedServiceEndpoint - Service endpoint URL
 * @param {string} props.commerceAgentConfiguration.scriptSourceUrl - Script source URL
 * @param {string} props.commerceAgentConfiguration.scrt2Url - SCRT2 URL
 * @param {string} props.commerceAgentConfiguration.salesforceOrgId - Salesforce org ID
 * @param {string} props.commerceAgentConfiguration.commerceOrgId - Commerce org ID
 * @param {string} props.commerceAgentConfiguration.siteId - Site identifier
 * @param {string} [props.commerceAgentConfiguration.enableConversationContext] - Enable conversation context feature
 * @param {string[]} [props.commerceAgentConfiguration.conversationContext] - Conversation context data array
 * @param {string} props.domainUrl - The domain URL of the current page
 * @returns {null} This component doesn't render any visible UI, only manages the messaging service
 *
 * @example
 * <ShopperAgentWindow commerceAgentConfiguration={config} domainUrl="https://example.com/current-page" />
 *
 * @since 3.12.0
 * @see {@link useScript} - For script loading functionality
 * @see {@link useMiaw} - For MIAW initialization
 * @see {@link useMultiSite} - For locale and currency information
 * @see {@link useRefreshToken} - For authentication token
 * @see {@link useUsid} - For user session identifier
 */
const ShopperAgentWindow = ({commerceAgentConfiguration, domainUrl}) => {
    // Theme hook for z-index management
    const theme = useTheme()

    // Multi-site hook for locale and currency information
    const {locale, buildUrl} = useMultiSite()

    // Authentication hook for refresh token
    const refreshToken = useRefreshToken()

    // Normalize locale to Salesforce language format
    const sfLanguage = normalizeLocaleToSalesforce(locale.id)

    // Destructure configuration for cleaner access
    const {
        embeddedServiceName,
        embeddedServiceEndpoint,
        scriptSourceUrl,
        scrt2Url,
        salesforceOrgId,
        commerceOrgId,
        siteId,
        enableConversationContext = 'false',
        conversationContext = []
    } = commerceAgentConfiguration

    // User session identifier hook
    const {usid} = useUsid()

    /**
     * Retrieves conversation context data based on configuration.
     * If conversation context is enabled, returns the array of context values.
     * If disabled or no data available, returns empty array.
     *
     * @returns {Promise<string[]>} Array of conversation context values
     */
    const getConversationContext = async () => {
        try {
            // Check if conversation context is enabled
            if (!enableConversationContext || enableConversationContext !== 'true') {
                return []
            }

            // Check if conversation context data is available and is an array
            if (!Array.isArray(conversationContext)) {
                console.warn('Conversation context is enabled but no valid array data provided')
                return []
            }

            // Return the conversation context array directly
            return conversationContext
        } catch (error) {
            console.error('Error retrieving conversation context:', error)
            return []
        }
    }

    /**
     * Sends conversation context data to the embedded messaging iframe.
     * Includes proper error handling and null checks for iframe elements.
     *
     * @param {string} type - Message type to send
     * @param {Object} payload - Data payload to send
     */
    const sendConversationContext = (type, payload = {}) => {
        try {
            const embeddedMessagingFrame = document.querySelector('div.embedded-messaging iframe')

            if (!embeddedMessagingFrame) {
                console.warn('Embedded messaging iframe not found')
                return
            }

            if (!embeddedMessagingFrame.src) {
                console.warn('Embedded messaging iframe has no source URL')
                return
            }

            const eventData = {
                type,
                payload
            }

            const targetOrigin = new URL(embeddedMessagingFrame.src).origin
            embeddedMessagingFrame.contentWindow.postMessage(eventData, targetOrigin)
        } catch (error) {
            console.error('Error sending conversation context:', error)
        }
    }

    /**
     * Handles incoming MIAW events requesting customer data.
     * Processes conversation context requests and sends appropriate responses.
     *
     * @param {MessageEvent} event - The message event from the iframe
     */
    const handleMiawEvent = async (event) => {
        if (event.source && event.source !== window) {
            try {
                if (event.data.type === 'lwc.getConversationContext') {
                    // Check if conversation context is enabled before making the call
                    if (enableConversationContext && enableConversationContext === 'true') {
                        const conversationContext = await getConversationContext()
                        sendConversationContext('conversational.actualConversationContext', {
                            conversationContext
                        })
                    }
                } else if (event.data.type === 'lwc.getDomainUrl') {
                    // Handle domain URL request
                    sendConversationContext('conversational.domainUrl', {
                        domainUrl
                    })
                }
            } catch (error) {
                console.error('Error handling Miaw event:', error)
            }
        }
    }

    /**
     * Event listener for the MIAW event
     */
    useEffect(() => {
        window.addEventListener('message', handleMiawEvent)
        return () => {
            window.removeEventListener('message', handleMiawEvent)
        }
    }, [])

    useEffect(() => {
        /**
         * Sets up hidden prechat fields when the embedded messaging service is ready.
         * These fields provide context to the chat agent about the current user session,
         * site configuration, and locale settings.
         */
        const handleEmbeddedMessagingReady = () => {
            window.embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({
                SiteId: siteId,
                Locale: locale.id,
                OrganizationId: commerceOrgId,
                UsId: usid,
                IsCartMgmtSupported: 'true',
                RefreshToken: refreshToken,
                Currency: locale.preferredCurrency,
                Language: sfLanguage,
                DomainUrl: domainUrl
            })
        }

        /**
         * Manages z-index for maximized chat windows to ensure proper layering
         * above other page elements while maintaining accessibility.
         */
        const handleEmbeddedMessagingWindowMaximized = () => {
            const zIndex = theme.zIndices.sticky + 1
            const embeddedMessagingFrame = document.body.querySelector(
                'div.embedded-messaging iframe'
            )
            if (embeddedMessagingFrame) {
                embeddedMessagingFrame.style.zIndex = zIndex
            }
        }

        // Set up event listeners for messaging lifecycle events
        window.addEventListener('onEmbeddedMessagingReady', handleEmbeddedMessagingReady)
        window.addEventListener(
            'onEmbeddedMessagingWindowMaximized',
            handleEmbeddedMessagingWindowMaximized
        )

        // Cleanup function to remove event listeners on unmount
        return () => {
            window.removeEventListener('onEmbeddedMessagingReady', handleEmbeddedMessagingReady)
            window.removeEventListener(
                'onEmbeddedMessagingWindowMaximized',
                handleEmbeddedMessagingWindowMaximized
            )
        }
    }, [
        siteId,
        locale.id,
        locale.preferredCurrency,
        commerceOrgId,
        usid,
        theme.zIndices.sticky,
        refreshToken,
        domainUrl
    ])

    // Load the embedded messaging script asynchronously
    const scriptLoadStatus = useScript(scriptSourceUrl)

    // Initialize the embedded messaging service once script is loaded
    useMiaw(
        scriptLoadStatus,
        salesforceOrgId,
        embeddedServiceName,
        embeddedServiceEndpoint,
        scrt2Url,
        locale.id,
        refreshToken
    )

    // This component doesn't render visible UI, only manages the messaging service
    return null
}

ShopperAgentWindow.propTypes = {
    /**
     * Commerce agent configuration object containing all necessary settings
     * for initializing and managing the embedded messaging service.
     *
     * @type {Object}
     * @required
     *
     * @property {string} embeddedServiceName - Name of the embedded service deployment
     * @property {string} embeddedServiceEndpoint - URL of the embedded service deployment
     * @property {string} scriptSourceUrl - URL to load the embedded messaging script
     * @property {string} scrt2Url - SCRT2 URL for the embedded messaging service
     * @property {string} salesforceOrgId - Salesforce organization ID
     * @property {string} commerceOrgId - Commerce Cloud organization ID
     * @property {string} siteId - Site identifier
     * @property {string} [enableConversationContext] - Enable conversation context feature ('true' or 'false')
     * @property {string[]} [conversationContext] - Conversation context data array
     */
    commerceAgentConfiguration: PropTypes.object.isRequired,

    /**
     * The domain URL of the current page, used as context for the embedded messaging.
     * This provides the chat agent with information about the current page location.
     *
     * @type {string}
     * @required
     */
    domainUrl: PropTypes.string.isRequired
}

/**
 * Main ShopperAgent component that initializes and manages the embedded messaging service.
 * This component acts as a conditional wrapper that only renders the messaging service
 * when all required conditions are met (enabled, basket loaded, valid configuration).
 *
 * The component integrates with several hooks to provide:
 * - Multi-site support (locale, currency)
 * - Authentication (refresh token)
 * - User session management (USID)
 * - Script loading and MIAW initialization
 *
 * @param {Object} props - Component props
 * @param {Object} props.commerceAgentConfiguration - Commerce agent configuration object
 * @param {string} props.commerceAgentConfiguration.enabled - Whether the agent is enabled
 * @param {string} props.commerceAgentConfiguration.askAgentOnSearch - Show agent on search
 * @param {string} props.commerceAgentConfiguration.embeddedServiceName - Service deployment name
 * @param {string} props.commerceAgentConfiguration.embeddedServiceEndpoint - Service endpoint
 * @param {string} props.commerceAgentConfiguration.scriptSourceUrl - Script source URL
 * @param {string} props.commerceAgentConfiguration.scrt2Url - SCRT2 URL
 * @param {string} props.commerceAgentConfiguration.salesforceOrgId - Salesforce org ID
 * @param {string} props.commerceAgentConfiguration.commerceOrgId - Commerce org ID
 * @param {string} props.commerceAgentConfiguration.siteId - Site identifier
 * @param {string} [props.commerceAgentConfiguration.enableConversationContext] - Enable conversation context feature
 * @param {string[]} [props.commerceAgentConfiguration.conversationContext] - Conversation context data array
 * @param {boolean} props.basketDoneLoading - Whether the basket has finished loading
 * @returns {JSX.Element|null} The ShopperAgent component or null if conditions not met
 *
 * @since 3.12.0
 * @see {@link ShopperAgentWindow} - Internal component that manages the messaging service
 * @see {@link validateCommerceAgentSettings} - Configuration validation function
 * @see {@link isEnabled} - Enabled state checker
 */
const ShopperAgent = ({commerceAgentConfiguration, basketDoneLoading}) => {
    // Extract enabled state from configuration
    const {enabled} = commerceAgentConfiguration

    // Get current location and app origin for domain URL
    const appOrigin = useAppOrigin()
    const {buildUrl} = useMultiSite()

    // Check if agent is enabled and running on client side
    const isShopperAgentEnabled = isEnabled(enabled)

    // Build the current domain URL
    const domainUrl = `${appOrigin}${buildUrl('')}`

    // Conditional rendering: only render when all conditions are met
    // 1. Agent is enabled and running on client
    // 2. Basket has finished loading
    // 3. Configuration is valid
    return isShopperAgentEnabled &&
        basketDoneLoading &&
        validateCommerceAgentSettings(commerceAgentConfiguration) ? (
        <div data-testid="shopper-agent">
            <ShopperAgentWindow
                commerceAgentConfiguration={commerceAgentConfiguration}
                domainUrl={domainUrl}
            />
        </div>
    ) : null
}

ShopperAgent.propTypes = {
    /**
     * Commerce agent configuration object containing all necessary settings
     * for initializing and managing the embedded messaging service.
     * This object must contain all required fields and pass validation
     * before the component will render.
     *
     * @type {Object}
     * @required
     *
     * @property {string} enabled - Whether the agent is enabled ('true' or 'false')
     * @property {string} askAgentOnSearch - Whether to show agent on search pages
     * @property {string} embeddedServiceName - Name of the embedded service deployment
     * @property {string} embeddedServiceEndpoint - URL of the embedded service deployment
     * @property {string} scriptSourceUrl - URL to load the embedded messaging script
     * @property {string} scrt2Url - SCRT2 URL for the embedded messaging service
     * @property {string} salesforceOrgId - Salesforce organization ID
     * @property {string} commerceOrgId - Commerce Cloud organization ID
     * @property {string} siteId - Site identifier
     * @property {string} [enableConversationContext] - Enable conversation context feature ('true' or 'false')
     * @property {string[]} [conversationContext] - Conversation context data array
     *
     * @see {@link validateCommerceAgentSettings} - For validation rules
     */
    commerceAgentConfiguration: PropTypes.object.isRequired,

    /**
     * Boolean flag indicating whether the basket has finished loading.
     * This prevents the agent from initializing before the shopping cart
     * context is fully available, ensuring proper integration.
     *
     * @type {boolean}
     * @required
     * // Component will render null until basketDoneLoading becomes true
     */
    basketDoneLoading: PropTypes.bool.isRequired
}

export default ShopperAgent
