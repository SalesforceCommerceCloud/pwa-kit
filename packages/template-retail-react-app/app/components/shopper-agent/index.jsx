/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import {defineMessage, useIntl} from 'react-intl'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'
import {useAccessToken, useConfig, useCustomerType, useUsid} from '@salesforce/commerce-sdk-react'
import PropTypes from 'prop-types'
import {useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'
import useMiaw, {normalizeLocaleToSalesforce} from '@salesforce/retail-react-app/app/hooks/use-miaw'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {resetEmbeddedMessagingForCommerceSessionChange} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'
import {callTokenBridge} from '@salesforce/retail-react-app/app/components/shopper-agent/token-bridge'

const onClient = typeof window !== 'undefined'

const HTTP_OK = 200

const SESSION_INIT_ERROR_MESSAGE = defineMessage({
    id: 'shopper_agent.error.session_init_failed',
    defaultMessage: 'We could not start the shopping assistant. Please try again.'
})

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
 * - Sets up prechat fields with current locale, currency, and user context on embedded messaging ready
 * - Calls Core's Token Bridge proxy when a conversation starts (`onEmbeddedMessagingConversationStarted`),
 *   only when `my_domain` is present in the configuration
 * - Manages event listeners for messaging lifecycle events
 * - Handles z-index management for maximized chat windows
 * - On guest ↔ registered Commerce session transitions, resets MIAW (FAB) so shoppers start a fresh agent session
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
 * @param {string} [props.commerceAgentConfiguration.my_domain] - ANC MyDomain from the Shopper Configurations API; Token Bridge is skipped when absent
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

    const {formatMessage} = useIntl()
    const toast = useToast()
    const toastRef = useRef(toast)
    toastRef.current = toast

    // Multi-site hook for locale and currency information
    const {locale} = useMultiSite()

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
        my_domain: myDomain,
        enableConversationContext = 'false',
        conversationContext = [],
        enableAgentFromFloatingButton = 'true'
    } = commerceAgentConfiguration

    // User session identifier hook
    const {usid} = useUsid()
    const {customerType} = useCustomerType()
    const {organizationId, siteId: configSiteId} = useConfig()

    // Warn once at mount if my_domain is missing — Token Bridge calls will be silently skipped.
    useEffect(() => {
        if (!myDomain) {
            console.warn(
                '[ShopperAgent] my_domain is not set in the commerce agent configuration. ' +
                    'Token Bridge calls will be skipped until it is provided.'
            )
        }
    }, [])

    // SLAS access token — needed to call Core's Token Bridge directly.
    const {getTokenWhenReady} = useAccessToken()
    const getTokenWhenReadyRef = useRef(getTokenWhenReady)
    getTokenWhenReadyRef.current = getTokenWhenReady

    const prevCommerceCustomerTypeRef = useRef(undefined)

    /**
     * Reset embedded messaging whenever customerType changes (login, logout, registration).
     * This ensures the chat context is cleared when user authentication state changes.
     */
    useEffect(() => {
        const prev = prevCommerceCustomerTypeRef.current
        prevCommerceCustomerTypeRef.current = customerType

        // Skip initial mount
        if (prev === undefined) {
            return
        }

        // Reset on any customerType change (login, logout, register)
        if (prev !== customerType) {
            resetEmbeddedMessagingForCommerceSessionChange()
        }
    }, [customerType])

    const formatMessageRef = useRef(formatMessage)
    formatMessageRef.current = formatMessage

    /** Latest values for embedded messaging handlers (stable window listeners). */
    const embeddedLifecycleRef = useRef({})
    embeddedLifecycleRef.current = {
        siteId,
        localeId: locale.id,
        preferredCurrency: locale.preferredCurrency,
        commerceOrgId,
        usid,
        refreshToken,
        sfLanguage,
        domainUrl,
        organizationId,
        configSiteId,
        myDomain
    }

    const lastConversationSessionInitRef = useRef(null)

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

    /**
     * Register embedded messaging window listeners once. Handlers read latest values from refs so we do not
     * remove/re-add listeners when auth or config updates (which would fight the widget and loop loading).
     */
    useEffect(() => {
        const applyHiddenPrechatFields = () => {
            const bootstrap = window.embeddedservice_bootstrap
            if (!bootstrap?.prechatAPI?.setHiddenPrechatFields) {
                return
            }
            const s = embeddedLifecycleRef.current
            bootstrap.prechatAPI.setHiddenPrechatFields({
                SiteId: s.siteId,
                Locale: s.localeId,
                OrganizationId: s.commerceOrgId,
                UsId: s.usid,
                IsCartMgmtSupported: 'true',
                RefreshToken: s.refreshToken,
                Currency: s.preferredCurrency,
                Language: s.sfLanguage,
                DomainUrl: s.domainUrl
            })
        }

        const handleEmbeddedMessagingReady = () => {
            applyHiddenPrechatFields()
        }

        // Reset the embedded messaging session and surface a localized error
        // toast. Called from every failure branch of the conversation-started
        // flow so the shopper sees consistent feedback and the next attempt
        // starts from a clean state.
        const failSessionInit = () => {
            resetEmbeddedMessagingForCommerceSessionChange()
            toastRef.current({
                title: formatMessageRef.current(SESSION_INIT_ERROR_MESSAGE),
                status: 'error'
            })
        }

        const handleEmbeddedMessagingConversationStarted = (event) => {
            const {
                organizationId: orgId,
                configSiteId: sid,
                myDomain: myDomainValue
            } = embeddedLifecycleRef.current
            if (!orgId || !sid) return
            if (!myDomainValue) return

            const conversationId = String(event?.detail?.conversationId ?? '').trim() || null
            if (conversationId && lastConversationSessionInitRef.current === conversationId) return
            if (conversationId) lastConversationSessionInitRef.current = conversationId

            const getAuthLinkKey =
                window.embeddedservice_bootstrap?.userVerificationAPI?.getAuthLinkKey
            if (typeof getAuthLinkKey !== 'function') {
                console.error('Shopper Agent: getAuthLinkKey is not available')
                return
            }

            getAuthLinkKey()
                .then(async (authLinkKey) => {
                    // Direct callout to Core's Token Bridge via the same-origin
                    // PWA Kit proxy. Replaces the prior postSessionInit SCAPI call.
                    try {
                        const slasAccessToken = await getTokenWhenReadyRef.current()
                        // useRefreshToken() resolves the refresh token from
                        // the SDK's auth context. Send it through the
                        // request body so the proxy can forward it to Core.
                        const slasRefreshToken = embeddedLifecycleRef.current.refreshToken
                        const result = await callTokenBridge({
                            authLinkKey,
                            slasAccessToken,
                            slasRefreshToken,
                            myDomain: myDomainValue
                        })

                        if (result.status !== HTTP_OK) {
                            const errorCode = result.body?.error || `HTTP_${result.status}`
                            console.error('Token Bridge failed', {
                                status: result.status,
                                error: errorCode
                            })
                            failSessionInit()
                        } else {
                            console.info('Token Bridge succeeded', {status: result.status})
                        }
                    } catch (error) {
                        console.error('Token Bridge threw', error)
                        failSessionInit()
                    }
                })
                .catch((error) => {
                    console.error('Shopper Agent: getAuthLinkKey failed', error)
                    failSessionInit()
                })
        }

        const handleEmbeddedMessagingWindowMaximized = () => {
            const zIndex = theme.zIndices.sticky + 1
            const embeddedMessagingFrame = document.body.querySelector(
                'div.embedded-messaging iframe'
            )
            if (embeddedMessagingFrame) {
                embeddedMessagingFrame.style.zIndex = zIndex
            }
        }

        window.addEventListener('onEmbeddedMessagingReady', handleEmbeddedMessagingReady)
        window.addEventListener(
            'onEmbeddedMessagingConversationStarted',
            handleEmbeddedMessagingConversationStarted
        )
        window.addEventListener(
            'onEmbeddedMessagingWindowMaximized',
            handleEmbeddedMessagingWindowMaximized
        )

        return () => {
            window.removeEventListener('onEmbeddedMessagingReady', handleEmbeddedMessagingReady)
            window.removeEventListener(
                'onEmbeddedMessagingConversationStarted',
                handleEmbeddedMessagingConversationStarted
            )
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
        domainUrl,
        organizationId,
        configSiteId,
        myDomain
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
        refreshToken,
        enableAgentFromFloatingButton
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
     * @property {string} [my_domain] - ANC MyDomain from the Shopper Configurations API; Token Bridge is skipped when absent
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
 * @param {string} [props.commerceAgentConfiguration.my_domain] - ANC MyDomain from the Shopper Configurations API; Token Bridge is skipped when absent
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
     * @property {string} [my_domain] - ANC MyDomain from the Shopper Configurations API; Token Bridge is skipped when absent
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
