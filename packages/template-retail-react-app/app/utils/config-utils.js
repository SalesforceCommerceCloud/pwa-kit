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
        commerceClientScriptSourceUrl: '',
        esDeveloperName: '',
        capabilitiesVersion: DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION,
        headerText: '',
        disclaimerMarkdown: '',
        commerceClientDisplayMode: 'panel',
        commerceClientPanelWidth: '420px',
        commerceClientMode: 'messaging',
        commerceClientLogoUrl: ''
    }
    return getConfig().app.commerceAgent ?? defaults
}
