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

const onClient = typeof window !== 'undefined'

// Function to initialize embedded messaging
const initEmbeddedMessaging = (
    salesforceOrgId,
    embeddedServiceDeploymentName,
    embeddedServiceDeploymentUrl,
    scrt2Url,
    locale
) => {
    try {
        if (
            onClient &&
            window.embeddedservice_bootstrap &&
            window.embeddedservice_bootstrap.settings
        ) {
            window.embeddedservice_bootstrap.settings.language = locale
            window.embeddedservice_bootstrap.settings.disableStreamingResponses = true
            window.embeddedservice_bootstrap.settings.iframeAllow = 'payment *'
            window.embeddedservice_bootstrap.init(
                salesforceOrgId,
                embeddedServiceDeploymentName,
                embeddedServiceDeploymentUrl,
                {
                    scrt2URL: scrt2Url
                }
            )
        }
    } catch (err) {
        console.error('Error initializing Embedded Messaging: ', err)
    }
}

function useMiaw(
    scriptLoadStatus,
    salesforceOrgId,
    embeddedServiceDeploymentName,
    embeddedServiceDeploymentUrl,
    scrt2Url,
    locale
) {
    useEffect(() => {
        if (scriptLoadStatus.loaded && !scriptLoadStatus.error) {
            initEmbeddedMessaging(
                salesforceOrgId,
                embeddedServiceDeploymentName,
                embeddedServiceDeploymentUrl,
                scrt2Url,
                locale
            )
        }
    }, [
        scriptLoadStatus,
        salesforceOrgId,
        embeddedServiceDeploymentName,
        embeddedServiceDeploymentUrl,
        scrt2Url,
        locale
    ])
}

function validateCommerceAgentSettings(commerceAgent) {
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
    }
    return isValid
}

function isEnabled(enabled) {
    return enabled === 'true' && onClient
}

function ShopperAgentWindow({commerceAgentConfiguration, locale, basketId}) {
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
                IsCartMgmtSupported: true
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
 * ShopperAgent component that initializes and manages the embedded messaging service
 * @param {Object} props - Component props
 * @param {Object} props.commerceAgentConfiguration - Commerce agent settings
 * @param {string} props.basketId - The basket ID for the embedded messaging script
 * @param {string} props.locale - The locale for the embedded messaging script
 * @returns {JSX.Element} The ShopperAgent component
 */
function ShopperAgent({commerceAgentConfiguration, basketId, locale, basketDoneLoading}) {
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
