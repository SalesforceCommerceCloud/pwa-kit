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

const onClient = typeof window !== 'undefined'

/**
 * Validates that a URL is from a trusted Salesforce domain.
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is from a trusted Salesforce domain
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
 * Validates that all required commerce agent settings are present and of correct type.
 *
 * @param {Object} commerceAgent - Commerce agent configuration object
 * @returns {boolean} True if all required fields are present and are strings
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
 * Checks if the shopper agent is enabled and running on client side.
 *
 * @param {string} enabled - String representation of enabled state
 * @returns {boolean} True if enabled is 'true' and running on client
 */
const isEnabled = (enabled) => {
    return enabled === 'true' && onClient
}

/**
 * Internal component that renders the embedded messaging window.
 * Handles event listeners for embedded messaging lifecycle events.
 *
 * @param {Object} props - Component props
 * @param {Object} props.commerceAgentConfiguration - Commerce agent configuration
 * @param {string} props.locale - The locale for the embedded messaging script
 * @param {string} props.basketId - The basket ID for the embedded messaging script
 * @returns {null} This component doesn't render any visible UI
 */
const ShopperAgentWindow = ({commerceAgentConfiguration, locale, basketId}) => {
    const theme = useTheme()
    const {
        embeddedServiceName,
        embeddedServiceEndpoint,
        scriptSourceUrl,
        scrt2Url,
        salesforceOrgId,
        commerceOrgId,
        siteId
    } = commerceAgentConfiguration

    const {usid} = useUsid()

    useEffect(() => {
        const handleEmbeddedMessagingReady = () => {
            window.embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({
                SiteId: siteId,
                Locale: locale,
                OrganizationId: commerceOrgId,
                UsId: usid,
                IsCartMgmtSupported: 'true'
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
            'onEmbeddedMessagingWindowMaximized',
            handleEmbeddedMessagingWindowMaximized
        )

        // Cleanup function
        return () => {
            window.removeEventListener('onEmbeddedMessagingReady', handleEmbeddedMessagingReady)
            window.removeEventListener(
                'onEmbeddedMessagingWindowMaximized',
                handleEmbeddedMessagingWindowMaximized
            )
        }
    }, [commerceAgentConfiguration, usid, theme.zIndices.sticky])

    // whenever the basketId changes, update the hidden prechat fields
    useEffect(() => {
        const handleEmbeddedMessagingButtonClicked = () => {
            window.embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({
                BasketId: basketId
            })
        }

        window.addEventListener(
            'onEmbeddedMessagingButtonClicked',
            handleEmbeddedMessagingButtonClicked
        )

        // Cleanup function
        return () => {
            window.removeEventListener(
                'onEmbeddedMessagingButtonClicked',
                handleEmbeddedMessagingButtonClicked
            )
        }
    }, [basketId])

    // Load the embedded messaging script
    const scriptLoadStatus = useScript(scriptSourceUrl)

    // Initialize the embedded messaging service
    useMiaw(
        scriptLoadStatus,
        salesforceOrgId,
        embeddedServiceName,
        embeddedServiceEndpoint,
        scrt2Url,
        locale
    )

    return null
}

ShopperAgentWindow.propTypes = {
    commerceAgentConfiguration: PropTypes.object,
    basketId: PropTypes.string,
    locale: PropTypes.string
}

/**
 * ShopperAgent component that initializes and manages the embedded messaging service.
 * Conditionally renders the agent window based on configuration and loading state.
 *
 * @param {Object} props - Component props
 * @param {Object} props.commerceAgentConfiguration - Commerce agent settings containing enabled, embeddedServiceName, etc.
 * @param {string} props.basketId - The basket ID for the embedded messaging script
 * @param {string} props.locale - The locale for the embedded messaging script
 * @param {boolean} props.basketDoneLoading - Whether the basket has finished loading
 * @returns {JSX.Element|null} The ShopperAgent component or null if conditions not met
 */
const ShopperAgent = ({commerceAgentConfiguration, basketId, locale, basketDoneLoading}) => {
    const {enabled} = commerceAgentConfiguration
    const isShopperAgentEnabled = isEnabled(enabled)

    return isShopperAgentEnabled &&
        basketDoneLoading &&
        validateCommerceAgentSettings(commerceAgentConfiguration) ? (
        <ShopperAgentWindow
            commerceAgentConfiguration={commerceAgentConfiguration}
            locale={locale}
            basketId={basketId}
        />
    ) : null
}

ShopperAgent.propTypes = {
    commerceAgentConfiguration: PropTypes.object,
    basketId: PropTypes.string,
    locale: PropTypes.string,
    basketDoneLoading: PropTypes.bool
}

export default ShopperAgent
