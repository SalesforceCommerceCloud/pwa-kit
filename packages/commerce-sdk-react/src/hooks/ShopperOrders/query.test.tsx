/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import path from 'path'
import '@testing-library/jest-dom'
import {mockHttpResponses, renderWithProviders} from '../../test-utils'
import {
    useOrder, 
    usePaymentMethodsForOrder} from './query'
import {screen, waitFor} from '@testing-library/react'

const {withMocks} = mockHttpResponses({directory: path.join(__dirname, '../../../mock-responses')})

const OrderComponent = ({orderNo, locale}: {orderNo: string; locale: string}): ReactElement => {
    const {data, isLoading, error} = useOrder({
        orderNo,
        locale
    })
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && <div>{data.name}</div>}
            {error && <span>error</span>}
        </div>
    )
}

const PaymentMethodsComponent = ({orderNo, locale}: {orderNo: string; locale: string}): ReactElement => {
    const {data, isLoading, error} = usePaymentMethodsForOrder({
        orderNo,
        locale
    })
    return (
        <div>
            {isLoading && <span>Loading...</span>}
            {data && <div>{data.name}</div>}
            {error && <span>error</span>}
        </div>
    )
}

const tests = []