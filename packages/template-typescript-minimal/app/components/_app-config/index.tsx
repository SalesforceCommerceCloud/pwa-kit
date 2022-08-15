/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import withQueryClientProvider from 'pwa-kit-react-sdk/ssr/universal/components/with-query-client-provider'

const AppConfig = (props) => {
    return (
        <React.Fragment>
            {props.children}
        </React.Fragment>
    )
}

AppConfig.restore = () => {}
AppConfig.extraGetPropsArgs = () => {}
AppConfig.freeze = () => {}

export default withQueryClientProvider(AppConfig)
