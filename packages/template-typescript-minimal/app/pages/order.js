/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    useOrderDeliveryGroup,
    useOrderItems,
    useOrders,
    useProducts,
} from '../hooks/useFetch'
import {useParams} from 'react-router-dom'
import {getMediaLink} from '../utils/utils'


function Order() {
    const {orderId} = useParams()
    const {data: order, isLoading} = useOrders(orderId, {
        includeAdjustmentDetails: true,
        fields: '*'
    })
    const {data: orderItems, isLoading: isItemsLoading} = useOrderItems(orderId)
    // const {data: orderShipment} = useOrderShipments(orderId)
    const {data: orderDeliveryGroups} = useOrderDeliveryGroup(orderId)
    const productItemIds = orderItems?.items.map((item) => item.product.productId)
    const {data: products, isLoading: isProductsLoading} = useProducts(productItemIds?.join(','))
    if (isLoading) {
        return <div>Loading order...</div>
    }
    const {fields} = order
    return (
        <div>
            <div>OrderNumber: {order.orderNumber}</div>
            <div>
                <h3>Details</h3>
                <div>Created: {order.createdDate}</div>
                <div>Ordered Date: {order.orderedDate}</div>
                <div>Status: {order.status}</div>
                <div>Billing address: {fields.BillingAddress.text}</div>
                <div>
                    Order Delivery Method:
                    {
                        orderDeliveryGroups?.orderDeliveryGroups?.[0]?.fields?.[
                            'OrderDeliveryMethod.Name'
                        ].text
                    }
                </div>
            </div>
            <div>
                <h3>Order summary</h3>
                <div>
                    Subtotal: {fields.TotalProductAmount.text} {fields.CurrencyIsoCode.text}
                </div>
                <div>
                    Promotions: {fields.TotalAdjDistAmount?.text} {fields.CurrencyIsoCode.text}
                </div>
                <div>
                    Shipping: {fields.TotalDeliveryAmount?.text} {fields.CurrencyIsoCode.text}
                </div>
                <div>
                    Tax: {fields.TotalTaxAmount?.text} {fields.CurrencyIsoCode.text}
                </div>
                <hr />
                <div>
                    Grand total {fields.GrandTotalAmount.text} {fields.CurrencyIsoCode.text}
                </div>
            </div>
            <hr />

            <div>
                <h3>Items</h3>
                <div>
                    {(isItemsLoading || isProductsLoading) && <div>Loading..</div>}
                    <div>
                        {products?.products?.map((product) => {
                            return (
                                <div key={product.id}>
                                    <div style={{display: 'flex'}}>
                                        <img
                                            style={{width: '200px'}}
                                            src={getMediaLink(product.defaultImage.url)}
                                            alt="order-item-img"
                                        />
                                        <div>
                                            <div>{product.fields.Name}</div>
                                            <div>
                                                List price: {product.prices.listPrice}{' '}
                                                {product.fields.CurrencyIsoCode}
                                            </div>
                                            <div>
                                                List price: {product.prices.unitPrice}{' '}
                                                {product.fields.CurrencyIsoCode}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Order
