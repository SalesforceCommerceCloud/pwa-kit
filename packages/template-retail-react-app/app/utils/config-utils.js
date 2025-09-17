/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

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
        conversationContext: []
    }
    return getConfig().app.commerceAgent ?? defaults
}
