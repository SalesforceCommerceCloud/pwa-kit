/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
// @ts-ignore
import {CommerceApiProvider} from 'commerce-sdk-react'
import {useCorrelationId} from 'pwa-kit-react-sdk/ssr/universal/contexts'

interface AppConfigProps {
    children: React.ReactNode
}

const AppConfig = (props: AppConfigProps): ReactElement => {
    const {correlationId} = useCorrelationId()

    return (
        <CommerceApiProvider
            siteId="RefArchGlobal"
            shortCode="8o7m175y"
            clientId="c9c45bfd-0ed3-4aa2-9971-40f88962b836"
            organizationId="f_ecom_zzrf_001"
            proxy="http://localhost:3000/mobify/proxy/api"
            locale="en-US"
            currency="USD"
            correlationId={correlationId}
        >
            {props.children}
        </CommerceApiProvider>
    )
}

AppConfig.restore = () => {}
AppConfig.extraGetPropsArgs = () => {}
AppConfig.freeze = () => {}

export default AppConfig
