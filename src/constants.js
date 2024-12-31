/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessage} from 'react-intl'
import {noop} from './utils/utils'

// Default details of badge labels and the corresponding product custom properties that enable badges.
export const PRODUCT_BADGE_DETAILS = [
    {
        propertyName: 'c_isNew',
        label: defineMessage({
            id: 'product_tile.badge.label.new',
            defaultMessage: 'New'
        }),
        color: 'green'
    },
    {
        propertyName: 'c_isSale',
        label: defineMessage({
            id: 'product_tile.badge.label.sale',
            defaultMessage: 'Sale'
        }),
        color: 'yellow'
    }
]

export const API_ERROR_MESSAGE = defineMessage({
    id: 'global.error.something_went_wrong',
    defaultMessage: 'Something went wrong. Try again!'
})

export const urlPartPositions = {
    PATH: 'path',
    QUERY_PARAM: 'query_param',
    NONE: 'none'
}

// Toast messages exist outside the scope of the base IntlProvider. This means
// that commonly used components that require localization cannot easily be
// extracted into a hook/helper. However, we can still extract the message
// definitions to a common location (here), so that each message is only defined
// once.
export const TOAST_MESSAGE_ADDED_TO_WISHLIST = defineMessage({
    id: 'global.info.added_to_wishlist',
    defaultMessage: '{quantity} {quantity, plural, one {item} other {items}} added to wishlist'
})

export const TOAST_MESSAGE_ALREADY_IN_WISHLIST = defineMessage({
    id: 'global.info.already_in_wishlist',
    defaultMessage: 'Item is already in wishlist'
})

export const TOAST_MESSAGE_REMOVED_ITEM_FROM_CART = defineMessage({
    defaultMessage: 'Item removed from cart',
    id: 'cart.info.removed_from_cart'
})

export const TOAST_ACTION_VIEW_WISHLIST = defineMessage({
    defaultMessage: 'View',
    id: 'global.link.added_to_wishlist.view_wishlist'
})

export const TOAST_MESSAGE_REMOVED_FROM_WISHLIST = defineMessage({
    id: 'global.info.removed_from_wishlist',
    defaultMessage: 'Item removed from wishlist'
})

// Einstein recommender constants used in <RecommendedProducts/>
export const EINSTEIN_RECOMMENDERS = {
    ADD_TO_CART_MODAL: 'pdp-similar-items',
    CART_RECENTLY_VIEWED: 'viewed-recently-einstein',
    CART_MAY_ALSO_LIKE: 'product-to-product-einstein',
    PDP_COMPLETE_SET: 'complete-the-set',
    PDP_MIGHT_ALSO_LIKE: 'pdp-similar-items',
    PDP_RECENTLY_VIEWED: 'viewed-recently-einstein',
    EMPTY_SEARCH_RESULTS_TOP_SELLERS: 'home-top-revenue-for-category',
    EMPTY_SEARCH_RESULTS_MOST_VIEWED: 'products-in-all-categories'
}

export const REMOVE_UNAVAILABLE_CART_ITEM_DIALOG_CONFIG = {
    dialogTitle: defineMessage({
        defaultMessage: 'Items Unavailable',
        id: 'confirmation_modal.remove_cart_item.title.items_unavailable'
    }),
    confirmationMessage: defineMessage({
        defaultMessage:
            'Some items are no longer available online and will be removed from your cart.',
        id: 'confirmation_modal.remove_cart_item.message.need_to_remove_due_to_unavailability'
    }),
    primaryActionLabel: defineMessage({
        defaultMessage: 'Remove',
        id: 'confirmation_modal.remove_cart_item.action.remove'
    }),
    primaryActionAriaLabel: defineMessage({
        defaultMessage: 'Remove unavailable products',
        id: 'confirmation_modal.remove_cart_item.assistive_msg.remove'
    }),
    onPrimaryAction: noop
}
