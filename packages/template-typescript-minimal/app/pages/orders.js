/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import {useOrders} from '../hooks/useFetch'

Orders.propTypes = {}

function Orders(props) {
    const {data, isLoading, error} = useOrders()
    if (isLoading) {
        return <div>Loading orders summary....</div>
    }
    if (error) {
        return <h3 style={{color: 'red'}}>Something is wrong</h3>
    }
    const {orderSummaries} = data
    return (
        <div>
            <h3>Order Summaries</h3>
            <div>
                {orderSummaries.map((order) => {
                    return (
                        <div style={{marginBottom: '10px'}}>
                            <div>Ordered on: {order.orderedDate}</div>
                            <div>Created on: {order.createdDate}</div>
                            <div>Order Number: {order.orderNumber}</div>
                            <div>Status: {order.status}</div>
                            <div>
                                Total Amount: {order.totalAmount} {order.currencyIsoCode}
                            </div>
                            <Link to={`/orders/${order.orderSummaryId}`}>View Details</Link>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Orders
