/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import {CommerceAPIProvider} from '../../../../commerce-sdk-react/dist/provider'

const AppConfig = ({children}) => {
    return (
        <CommerceAPIProvider
            proxy="http://localhost:3000/mobify/proxy/api"
            clientId="c9c45bfd-0ed3-4aa2-9971-40f88962b836"
            organizationId="f_ecom_zzrf_001"
            shortCode="8o7m175y"
            siteId="RefArchGlobal"
            locale="en_US"
            currency="USD"
        >
            {children}
        </CommerceAPIProvider>
    )
}

AppConfig.restore = () => {}
AppConfig.freeze = () => undefined
AppConfig.extraGetPropsArgs = () => {}

export default AppConfig
