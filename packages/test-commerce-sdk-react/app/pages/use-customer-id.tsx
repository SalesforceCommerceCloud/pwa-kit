/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useCustomerId} from '@salesforce/commerce-sdk-react'

const UseCustomerId = () => {
    const customerId = useCustomerId()
    return (
        <>
            <h1>useCustomerId</h1>
            <div>{customerId}</div>
        </>
    )
}

UseCustomerId.getTemplateName = () => 'UseCustomerId'

export default UseCustomerId
