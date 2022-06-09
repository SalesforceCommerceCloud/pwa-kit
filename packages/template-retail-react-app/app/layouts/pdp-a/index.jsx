/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

const PWAPDPALayout = ({children}) => {
    return (
        <div>
            PWAPDPALayout template-retail-react-app PDP-A
            <div>{children}</div>
        </div>
    )
}

export const getLayout = (page) => {
    console.log('PWAPDPALayout getLayout')
    return <PWAPDPALayout>{page}</PWAPDPALayout>
}

export default PWAPDPALayout
