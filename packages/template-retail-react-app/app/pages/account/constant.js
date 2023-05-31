/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessages} from 'react-intl'
import {
    AccountIcon,
    LocationIcon,
    ReceiptIcon,
    HeartIcon
} from '@salesforce/retail-react-app/app/components/icons'

export const messages = defineMessages({
    profile: {defaultMessage: 'Account Details', id: 'global.account.link.account_details'},
    addresses: {defaultMessage: 'Addresses', id: 'global.account.link.addresses'},
    orders: {defaultMessage: 'Order History', id: 'global.account.link.order_history'},
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
    }
]

export const CONFIRMATION_DIALOG_DEFAULT_CONFIG = defineMessages({
    dialogTitle: {
        defaultMessage: 'Confirm Action',
        id: 'confirmation_modal.default.title.confirm_action'
    },
    confirmationMessage: {
        defaultMessage: 'Are you sure you want to continue?',
        id: 'confirmation_modal.default.message.you_want_to_continue'
    },
    primaryActionLabel: {defaultMessage: 'Yes', id: 'confirmation_modal.default.action.yes'},
    alternateActionLabel: {defaultMessage: 'No', id: 'confirmation_modal.default.action.no'}
})
