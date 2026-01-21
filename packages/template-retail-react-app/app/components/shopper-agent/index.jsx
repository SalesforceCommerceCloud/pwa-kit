/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useMemo} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'
import {useUsid} from '@salesforce/commerce-sdk-react'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'
import useMiaw, {
    normalizeLocaleToSalesforce
} from '@salesforce/retail-react-app/app/hooks/use-miaw'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'

/**
 * Validates the commerce agent configuration
 * @param {Object} config - Commerce agent configuration
 * @returns {boolean} True if configuration is valid
 */
const isValidCommerceAgentConfig = (config) => {
    if (!config) return false
    if (config.enabled !== 'true') return false

    // Required fields
    const requiredFields = [
        'embeddedServiceName',
        'embeddedServiceEndpoint',
        'scriptSourceUrl',
        'scrt2Url',
        'salesforceOrgId',
        'commerceOrgId',
        'siteId'
    ]

    for (const field of requiredFields) {
        if (!config[field] || typeof config[field] !== 'string' || config[field].trim() === '') {
            return false
        }
    }

    // Validate optional fields if present
    if (
        config.enableConversationContext !== undefined &&
        typeof config.enableConversationContext !== 'string'
    ) {
        return false
    }

    if (config.conversationContext !== undefined && !Array.isArray(config.conversationContext)) {
        return false
    }

    return true
}

/**
 * Sends a message to the MIAW iframe
 * @param {string} type - Message type
 * @param {Object} payload - Message payload
 */
const sendExpressMessage = (type, payload) => {
    const iframe = document.querySelector('div.embedded-messaging iframe')
    if (iframe && iframe.contentWindow) {
        const targetOrigin = iframe.src ? new URL(iframe.src).origin : '*'
        iframe.contentWindow.postMessage({type, payload}, targetOrigin)
    }
}

/**
 * Inner component that handles the actual MIAW functionality
 */
const ShopperAgentWindow = ({commerceAgentConfiguration, domainUrl}) => {
    const location = useLocation()
    const {locale, buildUrl} = useMultiSite()
    const theme = useTheme()
    const appOrigin = useAppOrigin()
    const {usid} = useUsid()
    const refreshToken = useRefreshToken()

    const {
        embeddedServiceName,
        embeddedServiceEndpoint,
        scriptSourceUrl,
        scrt2Url,
        salesforceOrgId,
        commerceOrgId,
        siteId,
        enableConversationContext,
        conversationContext
    } = commerceAgentConfiguration

    // Load the embedded service script
    const scriptLoadStatus = useScript(scriptSourceUrl)

    // Initialize MIAW
    useMiaw(
        scriptLoadStatus,
        salesforceOrgId,
        embeddedServiceName,
        embeddedServiceEndpoint,
        scrt2Url,
        locale.id,
        refreshToken
    )

    const sfLanguage = useMemo(() => normalizeLocaleToSalesforce(locale.id), [locale.id])

    // Compute the domain URL to use
    const computedDomainUrl = useMemo(() => {
        if (domainUrl) return domainUrl
        return `${appOrigin}${buildUrl(location.pathname)}`
    }, [domainUrl, appOrigin, buildUrl, location.pathname])

    // Set up event listeners
    useEffect(() => {
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
                DomainUrl: computedDomainUrl
            })
        }

        const handleWindowMaximized = () => {
            const iframe = document.body.querySelector('div.embedded-messaging iframe')
            if (iframe) {
                iframe.style.zIndex = String((theme.zIndices?.sticky || 1100) + 1)
            }
        }

        window.addEventListener('onEmbeddedMessagingReady', handleEmbeddedMessagingReady)
        window.addEventListener('onEmbeddedMessagingWindowMaximized', handleWindowMaximized)

        return () => {
            window.removeEventListener('onEmbeddedMessagingReady', handleEmbeddedMessagingReady)
            window.removeEventListener('onEmbeddedMessagingWindowMaximized', handleWindowMaximized)
        }
    }, [
        siteId,
        locale.id,
        locale.preferredCurrency,
        commerceOrgId,
        usid,
        theme.zIndices?.sticky,
        refreshToken,
        computedDomainUrl,
        sfLanguage
    ])

    // Handle MIAW postMessage events
    useEffect(() => {
        const handleMiawEvent = async (event) => {
            // Ignore events from same window
            if (event.source === window) return

            if (!event.data || !event.data.type) return

            if (event.data.type === 'lwc.getConversationContext') {
                // Return conversation context if enabled
                const context =
                    enableConversationContext === 'true' && Array.isArray(conversationContext)
                        ? conversationContext
                        : []
                sendExpressMessage('express.conversationContext', {context})
            } else if (event.data.type === 'lwc.getDomainUrl') {
                sendExpressMessage('conversational.domainUrl', {domainUrl: computedDomainUrl})
            } else if (event.data.type === 'lwc.getPwaContext') {
                sendExpressMessage('lwc.pwaContext', {
                    pwaDomainUrl: window.location.origin,
                    pwaSiteId: siteId,
                    pwaLocale: locale.id
                })
            } else if (event.data.type === 'lwc.getCustomerData') {
                // SLAS Token Security: Call server-side proxy for customer data
                // instead of exposing the token directly
                try {
                    const response = await fetch(
                        `/api/miaw/customer-data?siteId=${encodeURIComponent(siteId)}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include'
                        }
                    )

                    if (response.ok) {
                        const customerData = await response.json()
                        sendExpressMessage('express.actualCustomerData', customerData)
                    }
                } catch (error) {
                    console.error('Error fetching customer data for MIAW:', error)
                }
            }
        }

        window.addEventListener('message', handleMiawEvent)

        return () => {
            window.removeEventListener('message', handleMiawEvent)
        }
    }, [
        siteId,
        locale.id,
        computedDomainUrl,
        enableConversationContext,
        conversationContext
    ])

    return <div data-testid="shopper-agent" />
}

ShopperAgentWindow.propTypes = {
    commerceAgentConfiguration: PropTypes.shape({
        enabled: PropTypes.string,
        embeddedServiceName: PropTypes.string,
        embeddedServiceEndpoint: PropTypes.string,
        scriptSourceUrl: PropTypes.string,
        scrt2Url: PropTypes.string,
        salesforceOrgId: PropTypes.string,
        commerceOrgId: PropTypes.string,
        siteId: PropTypes.string,
        enableConversationContext: PropTypes.string,
        conversationContext: PropTypes.array
    }).isRequired,
    domainUrl: PropTypes.string
}

/**
 * ShopperAgent Component
 *
 * Integrates Salesforce MIAW (Messaging for In-App and Web) into the storefront.
 * Handles:
 * - Loading the embedded service script
 * - Setting prechat fields
 * - Handling postMessage communication with the MIAW iframe
 *
 * SLAS Token Security: Customer data is fetched via server-side proxy
 * to prevent token exposure to the MIAW iframe.
 */
const ShopperAgent = ({commerceAgentConfiguration, basketDoneLoading, domainUrl}) => {
    // Don't render if not enabled or basket hasn't finished loading
    if (!basketDoneLoading) {
        return null
    }

    // Validate configuration
    if (!isValidCommerceAgentConfig(commerceAgentConfiguration)) {
        return null
    }

    return (
        <ShopperAgentWindow
            commerceAgentConfiguration={commerceAgentConfiguration}
            domainUrl={domainUrl}
        />
    )
}

ShopperAgent.propTypes = {
    commerceAgentConfiguration: PropTypes.shape({
        enabled: PropTypes.string,
        askAgentOnSearch: PropTypes.string,
        embeddedServiceName: PropTypes.string,
        embeddedServiceEndpoint: PropTypes.string,
        scriptSourceUrl: PropTypes.string,
        scrt2Url: PropTypes.string,
        salesforceOrgId: PropTypes.string,
        commerceOrgId: PropTypes.string,
        siteId: PropTypes.string,
        enableConversationContext: PropTypes.string,
        conversationContext: PropTypes.array
    }),
    basketDoneLoading: PropTypes.bool,
    domainUrl: PropTypes.string
}

export default ShopperAgent
