/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {ShopperLoginHelpers, useOrder, useShopperLoginHelper} from 'commerce-sdk-react'
import {Link, useParams} from 'react-router-dom'
import Json from '../components/Json'

function UseShopperOrder() {
    const {orderNo}: {orderNo: string} = useParams()
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    const {data, isLoading, error} = useOrder(
        {
            orderNo
        },
        {
            enabled: !!loginRegisteredUser?.variables?.username
        }
    )
    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'alex@test.com', password: 'Test1234#'})
    }, [])
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
            {loginRegisteredUser.isLoading ? (
                <span>Logging in...</span>
            ) : (
                <div>Logged in as {loginRegisteredUser?.variables?.username}</div>
            )}
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

UseShopperOrder.getTemplateName = () => 'UseShopperOrder'

export default UseShopperOrder
