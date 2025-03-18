/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessage} from 'react-intl'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

// Global app defaults
export const DEFAULT_LOCALE = 'en-US'
export const DEFAULT_SITE_TITLE = 'Retail React App'
export const MAX_CACHE_AGE = 60 * 15 // 15 min
export const STALE_WHILE_REVALIDATE = 60 * 15 // 15 min

// Constants used for product searching.
export const DEFAULT_SEARCH_PARAMS = {limit: 25, offset: 0, sort: 'best-matches', refine: []}
export const DEFAULT_LIMIT_VALUES = [25, 50, 100] // Page sizes

//Constants for customer orders searching.
export const DEFAULT_ORDERS_SEARCH_PARAMS = {limit: 10, offset: 0, sort: 'best-matches', refine: []}

// Constants for Search Component
export const RECENT_SEARCH_LIMIT = 5
export const RECENT_SEARCH_KEY = 'recent-search-key'
export const RECENT_SEARCH_MIN_LENGTH = 3

// Constants for product list page
export const PRODUCT_LIST_IMAGE_VIEW_TYPE = 'large'
export const PRODUCT_LIST_SELECTABLE_ATTRIBUTE_ID = 'color'

// Constants for product tile page
export const PRODUCT_TILE_IMAGE_VIEW_TYPE = 'large'
export const PRODUCT_TILE_SELECTABLE_ATTRIBUTE_ID = 'color'

// Constants for the Homepage's Shop Products section.
export const HOME_SHOP_PRODUCTS_CATEGORY_ID = 'newarrivals'
export const HOME_SHOP_PRODUCTS_LIMIT = 10

// Constants for menu
export const CAT_MENU_DEFAULT_NAV_SSR_DEPTH = 1
export const CAT_MENU_DEFAULT_ROOT_CATEGORY = 'root'

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

export const cssColorGroups = {
    beige: '#d3bca9',
    black: '#000000',
    blue: '#4089c0',
    brown: '#8e6950',
    green: '#88c290',
    grey: '#919191',
    gray: '#919191',
    silver: '#c0c0c0',
    navy: '#000080',
    orange: '#f4995c',
    pink: '#f5a0ca',
    purple: '#9873b9',
    red: '#df5b5b',
    white: '#FFFFFFF',
    yellow: '#fbe85a',
    gold: '#ffd700',
    miscellaneous: 'linear-gradient(to right, orange , yellow, green, cyan, blue, violet)'
}

// Color to use for the UI surrounding the page in browsers.
export const THEME_COLOR = '#0176D3'

export const FILTER_ACCORDION_SATE = 'filters-expanded-index'

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

export const HOME_HREF = '/'

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

// Constant to Enable Active Data
export const ACTIVE_DATA_ENABLED = true

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

export const SUPPORTED_STORE_LOCATOR_COUNTRIES = [
    {
        countryCode: 'US',
        countryName: defineMessage({
            defaultMessage: 'United States',
            id: 'store_locator.dropdown.united_states'
        })
    },
    {
        countryCode: 'DE',
        countryName: defineMessage({
            defaultMessage: 'Germany',
            id: 'store_locator.dropdown.germany'
        })
    }
]

export const DEFAULT_STORE_LOCATOR_COUNTRY = {
    countryCode: 'DE',
    countryName: defineMessage({
        defaultMessage: 'Germany',
        id: 'store_locator.dropdown.germany'
    })
}
export const DEFAULT_STORE_LOCATOR_POSTAL_CODE = '10178'
export const STORE_LOCATOR_DISTANCE = 100
export const STORE_LOCATOR_NUM_STORES_PER_LOAD = 10
export const STORE_LOCATOR_DISTANCE_UNIT = 'km'
export const STORE_LOCATOR_IS_ENABLED = true

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

// Constants for Password Reset
export const RESET_PASSWORD_LANDING_PATH = '/reset-password-landing'

// Constants for Passwordless Login
export const PASSWORDLESS_LOGIN_LANDING_PATH = '/passwordless-login-landing'

export const PASSWORDLESS_ERROR_MESSAGES = [
    /callback_uri doesn't match/i,
    /passwordless permissions error/i,
    /client secret is not provided/i
]

export const INVALID_TOKEN_ERROR = /invalid token/i

export const USER_NOT_FOUND_ERROR = /user not found/i
