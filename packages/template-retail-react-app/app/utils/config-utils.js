/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION} from '@salesforce/retail-react-app/app/constants'

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
        cc_enableDownloadTranscript: 'true'
    }
    return getConfig().app.commerceAgent ?? defaults
}
