/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'

const onClient = typeof window !== 'undefined'

/**
 * Maps BCP-47 locales to Salesforce language codes
 */
const SALESFORCE_LANG_MAP = {
    'en-US': 'en_US',
    'en-GB': 'en_GB',
    'en-CA': 'en', // collapse to base English
    'fr-FR': 'fr', // or 'fr_FR' if you prefer region form
    'es-MX': 'es', // collapse to base Spanish
    'pt-BR': 'pt_BR',
    'de-DE': 'de',
    'it-IT': 'it',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'nl-NL': 'nl',
    'no-NO': 'no',
    'pl-PL': 'pl',
    'sv-SE': 'sv',
    'da-DK': 'da',
    'fi-FI': 'fi',
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW'
}

/**
 * Normalizes a BCP-47 locale to Salesforce language format
 *
 * @param {string} locale - BCP-47 locale (e.g., 'fr-FR', 'en-CA')
 * @returns {string} - Normalized Salesforce language code
 */
const normalizeLocaleToSalesforce = (locale) => {
    // Input validation
    if (!locale || typeof locale !== 'string') {
        return 'en_US' // Default fallback
    }

    // Normalize locale (lowercase for consistent mapping)
    const normalizedLocale = locale.trim()

    // Direct mapping first
    if (SALESFORCE_LANG_MAP[normalizedLocale]) {
        return SALESFORCE_LANG_MAP[normalizedLocale]
    }

    // Fallback: extract base language from BCP-47 format
    const baseLanguage = normalizedLocale.split('-')[0]

    // Validate base language is reasonable (2-3 characters)
    if (baseLanguage && baseLanguage.length >= 2 && baseLanguage.length <= 3) {
        return baseLanguage
    }

    // Final fallback if base language extraction fails
    return 'en_US'
}

/**
 * Initializes the embedded messaging service with the provided configuration.
 *
 * @param {string} salesforceOrgId - Salesforce organization ID
 * @param {string} embeddedServiceDeploymentName - Name of the embedded service deployment
 * @param {string} embeddedServiceDeploymentUrl - URL of the embedded service deployment
 * @param {string} scrt2Url - SCRT2 URL for the embedded messaging service
 * @param {string} locale - BCP-47 locale for the embedded messaging service
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
            // Normalize locale to Salesforce language format
            const salesforceLanguage = normalizeLocaleToSalesforce(locale)

            window.embeddedservice_bootstrap.settings.language = salesforceLanguage
            window.embeddedservice_bootstrap.settings.disableStreamingResponses = true
            window.embeddedservice_bootstrap.settings.enableUserInputForConversationWithBot = false
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
 * @param {string} locale - BCP-47 locale for the embedded messaging service
 * @param {string} refreshToken - Refresh token for the embedded messaging service
 */
const useMiaw = (
    scriptLoadStatus,
    salesforceOrgId,
    embeddedServiceDeploymentName,
    embeddedServiceDeploymentUrl,
    scrt2Url,
    locale,
    refreshToken
) => {
    useEffect(() => {
        if (scriptLoadStatus.loaded && !scriptLoadStatus.error) {
            initEmbeddedMessaging(
                salesforceOrgId,
                embeddedServiceDeploymentName,
                embeddedServiceDeploymentUrl,
                scrt2Url,
                locale,
                refreshToken
            )
        }
    }, [
        scriptLoadStatus,
        salesforceOrgId,
        embeddedServiceDeploymentName,
        embeddedServiceDeploymentUrl,
        scrt2Url,
        locale,
        refreshToken
    ])
}

export default useMiaw
export {normalizeLocaleToSalesforce, SALESFORCE_LANG_MAP}
