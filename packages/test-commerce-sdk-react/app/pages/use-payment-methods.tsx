/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {usePaymentMethodsForOrder} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'
import {useParams} from 'react-router-dom'

function UsePaymentMethods() {
    const {orderNo}: {orderNo: string} = useParams()
    const {data, isLoading, error} = usePaymentMethodsForOrder({parameters: {orderNo: orderNo}})
    if (isLoading) {
        return (
            <div>
                <h1>usePaymentMethods page</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }
    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <>
            <h1>Payment Methods</h1>
            <h3>Order #: {orderNo}</h3>
            <h2>{data?.name}</h2>

            <hr />
            <div>
                <div>Returning Data</div>
                <Json data={{isLoading, error, data}} />
            </div>
        </>
    )
}

UsePaymentMethods.getTemplateName = () => 'UsePaymentMethods'

export default UsePaymentMethods
