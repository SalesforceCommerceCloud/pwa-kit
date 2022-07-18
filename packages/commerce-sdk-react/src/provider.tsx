/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'

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

const CommerceAPIProvider = (props: CommerceAPIProviderProps): ReactElement => {
    return <></>
}

export default CommerceAPIProvider
