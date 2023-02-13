/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {DataType, ApiClients, CacheUpdateMatrix} from '../types'

type Client = ApiClients['shopperOrders']

export const cacheUpdateMatrix: CacheUpdateMatrix<Client> = {}

type CacheUpdateMatrixElement = any // Temporary to quiet errors

const noop = () => ({})

// TODO: Convert old matrix to new format
export const shopperOrdersCacheUpdateMatrix = {
    createOrder: (response: DataType<Client['createOrder']>): CacheUpdateMatrixElement => {
        const customerId = response?.customerInfo?.customerId
        return {
            update: [
                {
                    name: 'order',
                    key: ['/orders', {orderNo: response.orderNo}],
                    updater: () => response
                }
            ],
            invalidate: [{name: 'customerBaskets', key: ['/customers', customerId, '/baskets']}]
        }
    },
    createPaymentInstrumentForOrder: noop,
    removePaymentInstrumentFromOrder: noop,
    updatePaymentInstrumentForOrder: noop
}

export const SHOPPER_ORDERS_NOT_IMPLEMENTED = [
    'CreatePaymentInstrumentForOrder',
    'RemovePaymentInstrumentFromOrder',
    'UpdatePaymentInstrumentForOrder'
]
