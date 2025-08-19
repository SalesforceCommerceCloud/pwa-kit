/**
 * @fileoverview ShopperAgent Component - Salesforce Embedded Messaging Integration
 * 
 * This module provides a React component that integrates Salesforce Embedded Messaging
 * (MIAW - Messaging in a Window) service with PWA Kit applications. The component
 * enables real-time chat support, search assistance, and personalized shopping guidance
 * directly within the e-commerce experience.
 * 
 * @module ShopperAgent
 * @description Main component for initializing and managing the embedded messaging service
 * 
 * @example
 * // Basic usage in _app/index.jsx
 * import ShopperAgent from '@salesforce/retail-react-app/app/components/shopper-agent'
 * 
 * {commerceAgentConfiguration?.enabled === 'true' && (
 *   <ShopperAgent
 *     commerceAgentConfiguration={commerceAgentConfiguration}
 *     basketDoneLoading={basketQueryLastUpdateTime > 0}
 *   />
 * )}
 * 
 * @example
 * // Configuration in config/default.js
 * module.exports = {
 *   app: {
 *     commerceAgent: {
 *       enabled: 'true',
 *       askAgentOnSearch: 'true',
 *       embeddedServiceName: 'MyService',
 *       embeddedServiceEndpoint: 'https://myorg.salesforce.com',
 *       scriptSourceUrl: 'https://myorg.salesforce.com/script.js',
 *       scrt2Url: 'https://myorg.salesforce.com-scrt.com',
 *       salesforceOrgId: '00D1234567890ABC',
 *       commerceOrgId: 'f_ecom_zzzz_001',
 *       siteId: 'RefArch'
 *     }
 *   }
 * }
 * 
 * @architecture
 * The component follows a layered architecture:
 * 1. ShopperAgent (Main) - Conditional rendering and validation
 * 2. ShopperAgentWindow (Internal) - Service lifecycle management
 * 3. Hooks Integration - useScript, useMiaw, useMultiSite, useRefreshToken, useUsid
 * 4. Event Management - Embedded messaging lifecycle events
 * 5. Prechat Fields - Dynamic context injection (locale, currency, user session)
 * 
 * @security
 * - Validates script URLs against trusted Salesforce domains
 * - Prevents loading of scripts from unauthorized sources
 * - Ensures configuration integrity before service initialization
 * 
 * @dependencies
 * - React hooks for state management and side effects
 * - Salesforce Embedded Messaging service
 * - PWA Kit hooks for multi-site, authentication, and user context
 * - Chakra UI for theming and z-index management
 * 
 * @since 3.12.0
 * @author Salesforce Commerce Cloud
 * @contributor Akasipathy
 * @license BSD-3-Clause
 */

/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'
import {useUsid} from '@salesforce/commerce-sdk-react'
import PropTypes from 'prop-types'
import {useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'
import useMiaw from '@salesforce/retail-react-app/app/hooks/use-miaw'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

const onClient = typeof window !== 'undefined'

/**
 * Validates that a URL is from a trusted Salesforce domain.
 *
 * @param {string} url - The URL to validate (e.g., 'https://myorg.salesforce.com/script.js')
 * @returns {boolean} True if the URL is from a trusted Salesforce domain, false otherwise
 * @throws {TypeError} If the URL is invalid and cannot be parsed
 * 
 * @example
 * const isValid = validateSalesforceDomain('https://myorg.salesforce.com/script.js')
 * // Returns: true
 * 
 * const isInvalid = validateSalesforceDomain('https://malicious-site.com/script.js')
 * // Returns: false
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
 * Validates that the commerce agent configuration contains all necessary
 * fields before attempting to initialize the embedded messaging service.
 *
 * @param {Object} commerceAgent - Commerce agent configuration object
 * @param {string} commerceAgent.enabled - Whether the agent is enabled ('true' or 'false')
 * @param {string} commerceAgent.askAgentOnSearch - Whether to show agent on search pages
 * @param {string} commerceAgent.embeddedServiceName - Name of the embedded service deployment
 * @param {string} commerceAgent.embeddedServiceEndpoint - URL of the embedded service deployment
 * @param {string} commerceAgent.scriptSourceUrl - URL to load the embedded messaging script
 * @param {string} commerceAgent.scrt2Url - SCRT2 URL for the embedded messaging service
 * @param {string} commerceAgent.salesforceOrgId - Salesforce organization ID
 * @param {string} commerceAgent.commerceOrgId - Commerce Cloud organization ID
 * @param {string} commerceAgent.siteId - Site identifier
 * @returns {boolean} True if all required fields are present and are strings, false otherwise
 * @throws {Error} Logs error messages to console for invalid configurations
 * 
 * @example
 * const config = {
 *   enabled: 'true',
 *   askAgentOnSearch: 'true',
 *   embeddedServiceName: 'MyService',
 *   embeddedServiceEndpoint: 'https://myorg.salesforce.com',
 *   scriptSourceUrl: 'https://myorg.salesforce.com/script.js',
 *   scrt2Url: 'https://myorg.salesforce.com-scrt.com',
 *   salesforceOrgId: '00D1234567890ABC',
 *   commerceOrgId: 'f_ecom_zzzz_001',
 *   siteId: 'RefArch'
 * }
 * const isValid = validateCommerceAgentSettings(config)
 * // Returns: true
 */
const validateCommerceAgentSettings = (commerceAgent) => {
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

    const isValid = requiredFields.every((key) => typeof commerceAgent[key] === 'string')

    if (!isValid) {
        console.error('Invalid commerce agent settings.')
        return false
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
 * @returns {null} This component doesn't render any visible UI, only manages the messaging service
 * 
 * @example
 * <ShopperAgentWindow commerceAgentConfiguration={config} />
 * 
 * @since 3.12.0
 * @see {@link useScript} - For script loading functionality
 * @see {@link useMiaw} - For MIAW initialization
 * @see {@link useMultiSite} - For locale and currency information
 * @see {@link useRefreshToken} - For authentication token
 * @see {@link useUsid} - For user session identifier
 */
const ShopperAgentWindow = ({commerceAgentConfiguration}) => {
    // Theme hook for z-index management
    const theme = useTheme()
    
    // Multi-site hook for locale and currency information
    const {locale} = useMultiSite()
    
    // Authentication hook for refresh token
    const refreshToken = useRefreshToken()
    
    // Destructure configuration for cleaner access
    const {
        embeddedServiceName,
        embeddedServiceEndpoint,
        scriptSourceUrl,
        scrt2Url,
        salesforceOrgId,
        commerceOrgId,
        siteId
    } = commerceAgentConfiguration

    // User session identifier hook
    const {usid} = useUsid()

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
                Currency: locale.preferredCurrency
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
    }, [siteId, locale.id, locale.preferredCurrency, commerceOrgId, usid, theme.zIndices.sticky, refreshToken])

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
     * 
     * @example
     * const config = {
     *   embeddedServiceName: 'MyService',
     *   embeddedServiceEndpoint: 'https://myorg.salesforce.com',
     *   scriptSourceUrl: 'https://myorg.salesforce.com/script.js',
     *   scrt2Url: 'https://myorg.salesforce.com-scrt.com',
     *   salesforceOrgId: '00D1234567890ABC',
     *   commerceOrgId: 'f_ecom_zzzz_001',
     *   siteId: 'RefArch'
     * }
     * 
     * <ShopperAgentWindow commerceAgentConfiguration={config} />
     */
    commerceAgentConfiguration: PropTypes.object.isRequired
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
 * @param {boolean} props.basketDoneLoading - Whether the basket has finished loading
 * @returns {JSX.Element|null} The ShopperAgent component or null if conditions not met
 * 
 * @example
 * // Basic usage
 * <ShopperAgent 
 *   commerceAgentConfiguration={config}
 *   basketDoneLoading={true}
 * />
 * 
 * // With disabled state
 * <ShopperAgent 
 *   commerceAgentConfiguration={{...config, enabled: 'false'}}
 *   basketDoneLoading={true}
 * />
 * 
 * @since 3.12.0
 * @see {@link ShopperAgentWindow} - Internal component that manages the messaging service
 * @see {@link validateCommerceAgentSettings} - Configuration validation function
 * @see {@link isEnabled} - Enabled state checker
 */
const ShopperAgent = ({commerceAgentConfiguration, basketDoneLoading}) => {
    // Extract enabled state from configuration
    const {enabled} = commerceAgentConfiguration
    
    // Check if agent is enabled and running on client side
    const isShopperAgentEnabled = isEnabled(enabled)

    // Conditional rendering: only render when all conditions are met
    // 1. Agent is enabled and running on client
    // 2. Basket has finished loading
    // 3. Configuration is valid
    return isShopperAgentEnabled &&
        basketDoneLoading &&
        validateCommerceAgentSettings(commerceAgentConfiguration) ? (
        <ShopperAgentWindow
            commerceAgentConfiguration={commerceAgentConfiguration}
        />
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
     * 
     * @example
     * const config = {
     *   enabled: 'true',
     *   askAgentOnSearch: 'true',
     *   embeddedServiceName: 'MyService',
     *   embeddedServiceEndpoint: 'https://myorg.salesforce.com',
     *   scriptSourceUrl: 'https://myorg.salesforce.com/script.js',
     *   scrt2Url: 'https://myorg.salesforce.com-scrt.com',
     *   salesforceOrgId: '00D1234567890ABC',
     *   commerceOrgId: 'f_ecom_zzzz_001',
     *   siteId: 'RefArch'
     * }
     * 
     * <ShopperAgent 
     *   commerceAgentConfiguration={config}
     *   basketDoneLoading={true}
     * />
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
