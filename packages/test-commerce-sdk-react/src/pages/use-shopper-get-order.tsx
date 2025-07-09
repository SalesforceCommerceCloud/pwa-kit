/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useOrder} from '@salesforce/commerce-sdk-react'
import {Link, useParams} from 'react-router-dom'
import Json from '../components/Json'

function UseShopperGetOrder() {
    const {orderNo}: {orderNo: string} = useParams()
    const {data, isLoading, error} = useOrder({parameters: {orderNo}})
    if (isLoading) {
        return (
            <div>
                <h1>useOrder page</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }
    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }
    return (
        <>
            <h1>Order Information</h1>
            <h3>Order #: {orderNo}</h3>
            <div>Click on the link to go to the payment methods page</div>
            <Link to={`/orders/${orderNo}/payment-methods`}>Payment Methods</Link>
            <hr />
            <div>
                <div>Returning Data</div>
                <Json data={{isLoading, error, data}} />
            </div>
        </>
    )
}

UseShopperGetOrder.getTemplateName = () => 'UseShopperGetOrder'

export default UseShopperGetOrder
