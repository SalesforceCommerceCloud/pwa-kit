/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import { getLayout as getSiteLayout } from '../site-layout-b'

const PWAPDPALayout = ({children}) => {
    return (
        <div>
            PWAPDPALayout template-retail-react-app PDP-A
            <div>{children}</div>
        </div>
    )
}

export const getLayout = (page) => {
    return getSiteLayout(<PWAPDPALayout>{page}</PWAPDPALayout>)
}

export default PWAPDPALayout
