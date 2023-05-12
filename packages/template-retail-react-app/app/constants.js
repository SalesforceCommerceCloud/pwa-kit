/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {defineMessage} from 'react-intl'

// Global app defaults
export const DEFAULT_LOCALE = 'en-US'
export const DEFAULT_SITE_TITLE = 'Retail React App'
export const MAX_CACHE_AGE = 60 * 15 // 15 min

// Constants used for product searching.
export const DEFAULT_SEARCH_PARAMS = {limit: 25, offset: 0, sort: 'best-matches', refine: []}
export const DEFAULT_LIMIT_VALUES = [25, 50, 100] // Page sizes

//Constants for customer orders searching.
export const DEFAULT_ORDERS_SEARCH_PARAMS = {limit: 10, offset: 0, sort: 'best-matches', refine: []}

// Constants for Search Component
export const RECENT_SEARCH_LIMIT = 5
export const RECENT_SEARCH_KEY = 'recent-search-key'
export const RECENT_SEARCH_MIN_LENGTH = 3

// Constants for the Homepage's Shop Products section.
export const HOME_SHOP_PRODUCTS_CATEGORY_ID = 'newarrivals'
export const HOME_SHOP_PRODUCTS_LIMIT = 10

// Constants for menu
export const CAT_MENU_DEFAULT_NAV_SSR_DEPTH = 1
export const CAT_MENU_DEFAULT_ROOT_CATEGORY = 'root'

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
