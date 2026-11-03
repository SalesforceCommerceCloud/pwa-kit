/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {MultiSiteContext} from '@salesforce/retail-react-app/app/contexts'
import {getSearchSummaryConfig} from '@salesforce/retail-react-app/app/utils/search-summary-config'
import {getCommerceAgentConfig} from '@salesforce/retail-react-app/app/utils/config-utils'

export function useSearchSummaryConfig() {
    const context = useContext(MultiSiteContext)
    return getSearchSummaryConfig(getConfig(), context?.site?.id)
}
export function useCommerceAgentConfig() {
    const context = useContext(MultiSiteContext)
    return getCommerceAgentConfig(context?.site?.id)
}
