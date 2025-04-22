/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'

const onClient = typeof window !== 'undefined'

// Function to initialize embedded messaging
const initEmbeddedMessaging = (
    orgId,
    embeddedServiceDeploymentName,
    embeddedServiceDeploymentUrl,
    scrt2Url
) => {
    try {
        if (
            onClient &&
            window.embeddedservice_bootstrap &&
            window.embeddedservice_bootstrap.settings
        ) {
            window.embeddedservice_bootstrap.settings.language = 'en_US'
            window.embeddedservice_bootstrap.init(
                orgId,
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
    orgId,
    embeddedServiceDeploymentName,
    embeddedServiceDeploymentUrl,
    scrt2Url
) {
    const [isMiawInitialized, setIsMiawInitialized] = useState(false)

    useEffect(() => {
        if (scriptLoadStatus.loaded && !scriptLoadStatus.error) {
            initEmbeddedMessaging(
                orgId,
                embeddedServiceDeploymentName,
                embeddedServiceDeploymentUrl,
                scrt2Url
            )
            setIsMiawInitialized(true)
        }
    }, [scriptLoadStatus])

    return isMiawInitialized
}

/**
 * ShopperAgent component that initializes and manages the embedded messaging service
 * @param {Object} props - Component props
 * @param {boolean} props.enableMiaw - Whether to enable embedded messaging
 * @param {string} props.orgId - The org ID for the embedded messaging script
 * @param {string} props.embeddedServiceDeploymentName - The embedded service deployment name
 * @param {string} props.embeddedServiceDeploymentUrl - The embedded service deployment URL
 * @param {string} props.scrt2Url - The SCRT2 URL for the embedded messaging script
 * @param {string} props.siteId - The site ID for the embedded messaging script
 * @param {string} props.slasToken - The SLAS token for the embedded messaging script
 * @param {string} props.basketId - The basket ID for the embedded messaging script
 * @returns {JSX.Element} The ShopperAgent component
 */
const ShopperAgent = ({
    commerceAgent,
    domainUrl,
    basketId,
    locale,
    usId,
    onAgentConversationOpened,
    onAgentConversationClosed
}) => {
    const { enabled, embeddedServiceName, embeddedServiceEndpoint, scriptSourceUrl, scrt2Url, salesforceOrgId, siteId } = JSON.parse(commerceAgent)
    if (!onClient || !enabled) {
        return null
    }

    useEffect(() => {
        window.addEventListener('onEmbeddedMessagingReady', (e) => {
            window.embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({
                Domain_URL: domainUrl,
                SiteId: siteId,
                BasketId: basketId,
                Locale: locale,
                OrganizationId: salesforceOrgId,
                UsId: usId

            })
        })

        window.addEventListener('onEmbeddedMessagingConversationClosed', (e) => {
            console.error('Error initializing Embedded Messaging: ', e)
        })

        window.addEventListener('onEmbeddedMessagingConversationOpened', (e) => {
            console.log('Conversation opened', e)
        })

        window.addEventListener('onEmbeddedMessagingConversationEnded', (e) => {
            console.log('Conversation ended', e)
        })
        
        
    }, [commerceAgent])

    // Load the embedded messaging script
    const scriptLoadStatus = useScript(scriptSourceUrl)

    // Initialize the embedded messaging service
    useMiaw(
        scriptLoadStatus,
        salesforceOrgId,
        embeddedServiceName,
        embeddedServiceEndpoint,
        scrt2Url
    )

    // The component doesn't render anything visible
    // It's just a wrapper for the embedded messaging service
    return null
}

export default ShopperAgent
