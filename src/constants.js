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
export const INVALID_TOKEN_ERROR_MESSAGE = defineMessage({
    defaultMessage: 'Invalid token, please try again.',
    id: 'global.error.invalid_token'
})
export const FEATURE_UNAVAILABLE_ERROR_MESSAGE = defineMessage({
    defaultMessage: 'This feature is not currently available.',
    id: 'global.error.feature_unavailable'
})
export const CREATE_ACCOUNT_FIRST_ERROR_MESSAGE = defineMessage({
    defaultMessage:
        'This feature is not currently available. You must create an account to access this feature.',
    id: 'global.error.create_account'
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

export const SHIPPING_COUNTRY_CODES = [
    {value: 'CA', label: 'Canada'},
    {value: 'US', label: 'United States'}
]

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

export const DEFAULT_DNT_STATE = true

// Constants for shopper context
// Supported non-string field types used in SHOPPER_CONTEXT_SEARCH_PARAMS below.
// Only non-string types need to be identified using the "type" field.
// If no "type" field is present, the value will be parsed as a string by default.
export const SHOPPER_CONTEXT_FIELD_TYPES = {
    INT: 'int',
    DOUBLE: 'double',
    ARRAY: 'array'
}
export const SHOPPER_CONTEXT_SEARCH_PARAMS = {
    sourceCode: {paramName: 'sourceCode'},
    geoLocation: {
        city: {paramName: 'city'},
        country: {paramName: 'country'},
        countryCode: {paramName: 'countryCode'},
        latitude: {paramName: 'latitude', type: SHOPPER_CONTEXT_FIELD_TYPES.DOUBLE},
        longitude: {paramName: 'longitude', type: SHOPPER_CONTEXT_FIELD_TYPES.DOUBLE},
        metroCode: {paramName: 'metroCode'},
        postalCode: {paramName: 'postalCode'},
        region: {paramName: 'region'},
        regionCode: {paramName: 'regionCode'}
    },
    customQualifiers: {
        // Add custom qualifiers here
    },
    assignmentQualifiers: {
        // Add assignment qualifiers here
    }
}

// Constants for Login
export const LOGIN_TYPES = {
    PASSWORD: 'password',
    PASSWORDLESS: 'passwordless',
    SOCIAL: 'social'
}

export const PASSWORDLESS_ERROR_MESSAGES = [
    /callback_uri doesn't match/i,
    /passwordless permissions error/i,
    /client secret is not provided/i
]

export const INVALID_TOKEN_ERROR = /invalid token/i

export const USER_NOT_FOUND_ERROR = /user not found/i
