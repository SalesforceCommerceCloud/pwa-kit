/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessage, defineMessages} from 'react-intl'
import {
    AccountIcon,
    LocationIcon,
    PaymentIcon,
    ReceiptIcon,
    HeartIcon
} from '../../components/icons'
import {noop} from '../../utils/utils'

export const messages = defineMessages({
    profile: {defaultMessage: 'Account Details', id: 'global.account.link.account_details'},
    addresses: {defaultMessage: 'Addresses', id: 'global.account.link.addresses'},
    orders: {defaultMessage: 'Order History', id: 'global.account.link.order_history'},
    payments: {defaultMessage: 'Payment Methods', id: 'global.account.link.payment_methods'},
    wishlist: {defaultMessage: 'Wishlist', id: 'global.account.link.wishlist'}
})

export const navLinks = [
    {
        name: 'profile',
        path: '',
        icon: AccountIcon
    },
    {
        name: 'wishlist',
        path: '/wishlist',
        icon: HeartIcon
    },
    {
        name: 'orders',
        path: '/orders',
        icon: ReceiptIcon
    },
    {
        name: 'addresses',
        path: '/addresses',
        icon: LocationIcon
    },
    {
        name: 'payments',
        path: '/payments',
        icon: PaymentIcon
    }
]

export const CONFIRMATION_DIALOG_DEFAULT_CONFIG = defineMessages({
    dialogTitle: {defaultMessage: 'Confirm Action', id: 'global.account.title.confirm_action'},
    confirmationMessage: {
        defaultMessage: 'Are you sure you want to continue ?',
        id: 'global.account.message.you_want_to_continue'
    },
    primaryActionLabel: {defaultMessage: 'Yes', id: 'global.account.action.yes'},
    alternateActionLabel: {defaultMessage: 'No', id: 'global.account.action.no'}
})

export const REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG = {
    dialogTitle: defineMessage({
        defaultMessage: 'Confirm Remove Item',
        id: 'global.account.title.confirm_remove'
    }),
    confirmationMessage: defineMessage({
        defaultMessage: 'Are you sure you want to remove this item from your cart?',
        id: 'global.account.message.you_want_to_remove'
    }),
    primaryActionLabel: defineMessage({
        defaultMessage: 'Yes, remove item',
        id: 'global.account.action.remove_item'
    }),
    alternateActionLabel: defineMessage({
        defaultMessage: 'No, keep item',
        id: 'global.account.action.keep_item'
    }),
    onPrimaryAction: noop
}
