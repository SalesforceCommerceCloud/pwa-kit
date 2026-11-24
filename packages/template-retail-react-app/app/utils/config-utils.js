/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION} from '@salesforce/retail-react-app/app/constants'

export const getSmartSearchStorefront = (siteId) => {
    const {commerceAgentSearch, defaultSite, smartSearchStorefront} = getConfig()?.app || {}
    if (commerceAgentSearch?.enabled !== true || !siteId || !smartSearchStorefront) return

    const {bySite} = smartSearchStorefront
    const storefront = bySite
        ? Object.prototype.hasOwnProperty.call(bySite, siteId) && bySite[siteId]
        : siteId === defaultSite && smartSearchStorefront
    const {brand, collections, prompts, heroImage, headline, description} = storefront || {}
    const isNonEmptyString = (value) => typeof value === 'string' && Boolean(value.trim())
    if (
        isNonEmptyString(brand) &&
        Array.isArray(collections) &&
        collections.length > 0 &&
        collections.every((item) => isNonEmptyString(item?.id) && isNonEmptyString(item.label))
    ) {
        return {
            brand,
            collections,
            prompts: Array.isArray(prompts) ? prompts.filter(isNonEmptyString) : [],
            heroImage: isNonEmptyString(heroImage) ? heroImage : undefined,
            headline: isNonEmptyString(headline) ? headline : undefined,
            description: isNonEmptyString(description) ? description : undefined
        }
    }
}

export const getCommerceAgentConfig = () => {
    const defaults = {
        enabled: 'false',
        askAgentOnSearch: 'false',
        embeddedServiceName: '',
        embeddedServiceEndpoint: '',
        scriptSourceUrl: '',
        scrt2Url: '',
        salesforceOrgId: '',
        commerceOrgId: '',
        siteId: '',
        enableConversationContext: 'false',
        conversationContext: [],
        enableAgentFromHeader: 'false',
        enableAgentFromFloatingButton: 'false',
        enableAgentFromSearchSuggestions: 'false',
        // Widget provider: 'miaw' (default) or 'commerce-client'. See config/default.js.
        provider: 'miaw',
        cc_cdnVersion: '',
        commerceClientScriptSourceUrl: '',
        cc_esDeveloperName: '',
        cc_capabilitiesVersion: DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION,
        cc_headerText: '',
        cc_disclaimerMarkdown: '',
        cc_dialogFullHeight: 'true',
        cc_dialogWidth: '420px',
        cc_widgetPosition: 'bottom-right',
        cc_showFab: 'false',
        cc_pagePush: 'false',
        cc_logoUrl: '',
        cc_isOpen: 'false',
        cc_isDevelopment: 'false',
        cc_enableEscalationToAgent: 'false',
        cc_enableDownloadTranscript: 'true',
        cc_enableImageUpload: 'false',
        cc_theme: {preset: 'legacy', density: 'compact', shape: 'sharp', elevation: 'flat'}
    }
    return {...defaults, ...getConfig().app.commerceAgent}
}
