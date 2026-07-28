/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Box, Heading} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCustomerType} from '@salesforce/commerce-sdk-react'
import {Redirect} from 'react-router-dom'

const GuestOrderLookupVerify = () => {
    const {isRegistered} = useCustomerType()
    if (isRegistered) return <Redirect to="/account/orders" />
    return (
        <Box>
            <Heading>Enter Access Code</Heading>
        </Box>
    )
}

export default GuestOrderLookupVerify
