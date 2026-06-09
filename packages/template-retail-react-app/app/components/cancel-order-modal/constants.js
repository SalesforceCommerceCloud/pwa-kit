/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessages} from 'react-intl'

export const messages = defineMessages({
    selectReason: {
        defaultMessage: 'Select a cancellation reason',
        id: 'cancel_order_modal.dropdown.select_reason'
    },
    itemPriceTooHigh: {
        defaultMessage: 'Item price too high',
        id: 'cancel_order_modal.reason.item_price_too_high'
    },
    shippingCostTooHigh: {
        defaultMessage: 'Shipping cost too high',
        id: 'cancel_order_modal.reason.shipping_cost_too_high'
    },
    itemNotArriveOnTime: {
        defaultMessage: 'Item(s) would not arrive on time',
        id: 'cancel_order_modal.reason.item_not_arrive_on_time'
    },
    orderCreatedByMistake: {
        defaultMessage: 'Order created by mistake',
        id: 'cancel_order_modal.reason.order_created_by_mistake'
    },
    changedMind: {
        defaultMessage: 'Changed my mind',
        id: 'cancel_order_modal.reason.changed_mind'
    },
    noLongerNeeded: {
        defaultMessage: 'No longer needed',
        id: 'cancel_order_modal.reason.no_longer_needed'
    },
    financialReasons: {
        defaultMessage: 'Financial reasons',
        id: 'cancel_order_modal.reason.financial_reasons'
    },
    other: {
        defaultMessage: 'Other',
        id: 'cancel_order_modal.reason.other'
    }
})

export const CANCELLATION_REASONS = [
    {id: 'select_reason', messageKey: 'selectReason', isDefault: true}, // Default "no reason" option
    {id: 'item_price_too_high', messageKey: 'itemPriceTooHigh'},
    {id: 'shipping_cost_too_high', messageKey: 'shippingCostTooHigh'},
    {id: 'item_not_arrive_on_time', messageKey: 'itemNotArriveOnTime'},
    {id: 'order_created_by_mistake', messageKey: 'orderCreatedByMistake'},
    {id: 'changed_mind', messageKey: 'changedMind'},
    {id: 'no_longer_needed', messageKey: 'noLongerNeeded'},
    {id: 'financial_reasons', messageKey: 'financialReasons'},
    {id: 'other', messageKey: 'other'}
]
