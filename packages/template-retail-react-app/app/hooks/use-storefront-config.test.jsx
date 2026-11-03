/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderHook} from '@testing-library/react'
import {MultiSiteContext} from '@salesforce/retail-react-app/app/contexts'
import {
    useSearchSummaryConfig,
    useCommerceAgentConfig
} from '@salesforce/retail-react-app/app/hooks/use-storefront-config'
import {getCommerceAgentConfig} from '@salesforce/retail-react-app/app/utils/config-utils'
const mockConfig = {
    app: {
        defaultSite: 'shop-a',
        searchSummary: {enabled: false},
        commerceAgent: {
            enabled: 'true',
            provider: 'commerce-client',
            salesforceOrgId: 'global-org'
        },
        sites: [
            {
                id: 'shop-a',
                searchSummary: {enabled: true, title: 'Store A'},
                commerceAgent: {salesforceOrgId: 'store-a-org'}
            },
            {id: 'shop-b', commerceAgent: {enabled: 'false'}}
        ]
    }
}
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({getConfig: () => mockConfig}))
test('active storefront context selects both feature and agent settings', () => {
    let site = 'shop-a'
    const wrapper = ({children}) => (
        <MultiSiteContext.Provider value={{site: {id: site}}}>{children}</MultiSiteContext.Provider>
    )
    const {result, rerender} = renderHook(
        () => ({feature: useSearchSummaryConfig(), agent: useCommerceAgentConfig()}),
        {wrapper}
    )
    expect(result.current.feature).toMatchObject({enabled: true, title: 'Store A'})
    expect(result.current.agent).toMatchObject({
        salesforceOrgId: 'store-a-org',
        provider: 'commerce-client'
    })
    site = 'shop-b'
    rerender()
    expect(result.current.feature.enabled).toBe(false)
    expect(result.current.agent.enabled).toBe('false')
    // Existing no-argument consumers preserve global behavior.
    expect(getCommerceAgentConfig()).toEqual(mockConfig.app.commerceAgent)
})
