/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'

const onClient = typeof window !== 'undefined'

/**
 * Initializes the embedded messaging service with the provided configuration.
 *
 * @param {string} salesforceOrgId - Salesforce organization ID
 * @param {string} embeddedServiceDeploymentName - Name of the embedded service deployment
 * @param {string} embeddedServiceDeploymentUrl - URL of the embedded service deployment
 * @param {string} scrt2Url - SCRT2 URL for the embedded messaging service
 * @param {string} locale - Locale for the embedded messaging service
 */
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
            window.embeddedservice_bootstrap.settings.disableStreamingResponses = false
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

/**
 * Custom hook that initializes embedded messaging when the script is loaded.
 *
 * @param {Object} scriptLoadStatus - Status of the embedded messaging script loading
 * @param {string} salesforceOrgId - Salesforce organization ID
 * @param {string} embeddedServiceDeploymentName - Name of the embedded service deployment
 * @param {string} embeddedServiceDeploymentUrl - URL of the embedded service deployment
 * @param {string} scrt2Url - SCRT2 URL for the embedded messaging service
 * @param {string} locale - Locale for the embedded messaging service
 */
const useMiaw = (
    scriptLoadStatus,
    salesforceOrgId,
    embeddedServiceDeploymentName,
    embeddedServiceDeploymentUrl,
    scrt2Url,
    locale
) => {
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

export default useMiaw
