/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import { ApiClients } from './hooks/types'

import CommerceAPI from './api-client'

export interface CommerceAPIProviderProps {
    children: React.ReactNode
    clientId: string
    organizationId: string
    siteId: string
    shortCode: string
    proxy: string
    locale: string
    currency: string
}

export const CommerceAPIContext = React.createContext({} as ApiClients)

// TODO: how to test? test in typescript template for now
const CommerceAPIProvider = (props: CommerceAPIProviderProps): ReactElement => {
    const {children, clientId, organizationId, shortCode, siteId, proxy} = props

    const config = {
        proxy,
        headers: {},
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId,
        },
        throwOnBadResponse: true,
    }

    // TODO: auth logic should use the helpers from commerce-sdk-isomorphic ?
    const commerceAPI = new CommerceAPI(config)

    console.log('--- api client', commerceAPI)

    // TODO: use Context from useServerEffect
    // See Kevin's PR: https://github.com/SalesforceCommerceCloud/pwa-kit/pull/654/files#r914097886
    // See Ben's PR: https://github.com/SalesforceCommerceCloud/pwa-kit/pull/642
    return <CommerceAPIContext.Provider value={commerceAPI}>{children}</CommerceAPIContext.Provider>
}

export default CommerceAPIProvider
