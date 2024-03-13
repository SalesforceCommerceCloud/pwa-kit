/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const getOrder = ['organizationId', 'orderNo', 'siteId', 'locale'] as const
const getPaymentMethodsForOrder = ['organizationId', 'orderNo', 'siteId', 'locale'] as const
const getTaxesFromOrder = ['organizationId', 'orderNo', 'siteId'] as const

export default {
    getOrder,
    getPaymentMethodsForOrder,
    getTaxesFromOrder
}
