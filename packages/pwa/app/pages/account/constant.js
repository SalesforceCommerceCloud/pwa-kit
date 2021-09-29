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
    profile: {defaultMessage: 'Account Details'},
    addresses: {defaultMessage: 'Addresses'},
    orders: {defaultMessage: 'Order History'},
    payments: {defaultMessage: 'Payment Methods'},
    wishlist: {defaultMessage: 'Wishlist'}
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
    dialogTitle: {defaultMessage: 'Confirm Action'},
    confirmationMessage: {defaultMessage: 'Are you sure you want to continue ?'},
    primaryActionLabel: {defaultMessage: 'Yes'},
    alternateActionLabel: {defaultMessage: 'No'}
})

export const REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG = {
    dialogTitle: defineMessage({defaultMessage: 'Confirm Remove Item'}),
    confirmationMessage: defineMessage({
        defaultMessage: 'Are you sure you want to remove this item from your cart?'
    }),
    primaryActionLabel: defineMessage({defaultMessage: 'Yes, remove item'}),
    alternateActionLabel: defineMessage({defaultMessage: 'No, keep item'}),
    onPrimaryAction: noop
}
