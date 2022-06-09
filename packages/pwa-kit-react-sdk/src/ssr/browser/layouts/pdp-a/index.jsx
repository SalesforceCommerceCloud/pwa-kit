/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

const SDKPDPALayout = ({children}) => {
    return (
        <div>
            SiteLayout SDK
            <div>{children}</div>
        </div>
    )
}

export const getLayout = (children) => {
    console.log('SDKPDPALayout getLayout')
    return <SDKPDPALayout>{children}</SDKPDPALayout>
}

export default SDKPDPALayout
