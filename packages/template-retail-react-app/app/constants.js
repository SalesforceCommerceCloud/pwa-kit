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

// Constants for customer orders searching.
export const DEFAULT_ORDERS_SEARCH_PARAMS = {limit: 10, offset: 0, sort: 'best-matches', refine: []}

// Constants for Search Component
export const RECENT_SEARCH_LIMIT = 5
export const RECENT_SEARCH_KEY = 'recent-search-key'
export const RECENT_SEARCH_MIN_LENGTH = 3

// Constants for product list page
export const PRODUCT_LIST_IMAGE_VIEW_TYPE = 'medium'
export const PRODUCT_LIST_SELECTABLE_ATTRIBUTE_ID = 'color'

// Constants for product tile page
export const PRODUCT_TILE_IMAGE_VIEW_TYPE = 'medium'
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
    { value: 'AF', label: 'Afghanistan' },
    { value: 'AL', label: 'Albania' },
    { value: 'DZ', label: 'Algeria' },
    { value: 'AS', label: 'American Samoa' },
    { value: 'AD', label: 'Andorra' },
    { value: 'AO', label: 'Angola' },
    { value: 'AI', label: 'Anguilla' },
    { value: 'AQ', label: 'Antarctica' },
    { value: 'AG', label: 'Antigua and Barbuda' },
    { value: 'AR', label: 'Argentina' },
    { value: 'AM', label: 'Armenia' },
    { value: 'AW', label: 'Aruba' },
    { value: 'AU', label: 'Australia' },
    { value: 'AT', label: 'Austria' },
    { value: 'AZ', label: 'Azerbaijan' },
    { value: 'BS', label: 'Bahamas' },
    { value: 'BH', label: 'Bahrain' },
    { value: 'BD', label: 'Bangladesh' },
    { value: 'BB', label: 'Barbados' },
    { value: 'BY', label: 'Belarus' },
    { value: 'BE', label: 'Belgium' },
    { value: 'BZ', label: 'Belize' },
    { value: 'BJ', label: 'Benin' },
    { value: 'BM', label: 'Bermuda' },
    { value: 'BT', label: 'Bhutan' },
    { value: 'BO', label: 'Bolivia' },
    { value: 'BQ', label: 'Bonaire, Sint Eustatius and Saba' },
    { value: 'BA', label: 'Bosnia and Herzegovina' },
    { value: 'BW', label: 'Botswana' },
    { value: 'BV', label: 'Bouvet Island' },
    { value: 'BR', label: 'Brazil' },
    { value: 'IO', label: 'British Indian Ocean Territory' },
    { value: 'BN', label: 'Brunei Darussalam' },
    { value: 'BG', label: 'Bulgaria' },
    { value: 'BF', label: 'Burkina Faso' },
    { value: 'BI', label: 'Burundi' },
    { value: 'KH', label: 'Cambodia' },
    { value: 'CM', label: 'Cameroon' },
    { value: 'CA', label: 'Canada' },
    { value: 'CV', label: 'Cape Verde' },
    { value: 'KY', label: 'Cayman Islands' },
    { value: 'CF', label: 'Central African Republic' },
    { value: 'TD', label: 'Chad' },
    { value: 'CL', label: 'Chile' },
    { value: 'CN', label: 'China' },
    { value: 'CX', label: 'Christmas Island' },
    { value: 'CC', label: 'Cocos (Keeling) Islands' },
    { value: 'CO', label: 'Colombia' },
    { value: 'KM', label: 'Comoros' },
    { value: 'CG', label: 'Congo' },
    { value: 'CD', label: 'Congo, Democratic Republic of the' },
    { value: 'CK', label: 'Cook Islands' },
    { value: 'CR', label: 'Costa Rica' },
    { value: 'CI', label: "Côte d'Ivoire" },
    { value: 'HR', label: 'Croatia' },
    { value: 'CU', label: 'Cuba' },
    { value: 'CW', label: 'Curaçao' },
    { value: 'CY', label: 'Cyprus' },
    { value: 'CZ', label: 'Czechia' },
    { value: 'DK', label: 'Denmark' },
    { value: 'DJ', label: 'Djibouti' },
    { value: 'DM', label: 'Dominica' },
    { value: 'DO', label: 'Dominican Republic' },
    { value: 'EC', label: 'Ecuador' },
    { value: 'EG', label: 'Egypt' },
    { value: 'SV', label: 'El Salvador' },
    { value: 'GQ', label: 'Equatorial Guinea' },
    { value: 'ER', label: 'Eritrea' },
    { value: 'EE', label: 'Estonia' },
    { value: 'SZ', label: 'Eswatini' },
    { value: 'ET', label: 'Ethiopia' },
    { value: 'FK', label: 'Falkland Islands (Malvinas)' },
    { value: 'FO', label: 'Faroe Islands' },
    { value: 'FJ', label: 'Fiji' },
    { value: 'FI', label: 'Finland' },
    { value: 'FR', label: 'France' },
    { value: 'GF', label: 'French Guiana' },
    { value: 'PF', label: 'French Polynesia' },
    { value: 'TF', label: 'French Southern Territories' },
    { value: 'GA', label: 'Gabon' },
    { value: 'GM', label: 'Gambia' },
    { value: 'GE', label: 'Georgia' },
    { value: 'DE', label: 'Germany' },
    { value: 'GH', label: 'Ghana' },
    { value: 'GI', label: 'Gibraltar' },
    { value: 'GR', label: 'Greece' },
    { value: 'GL', label: 'Greenland' },
    { value: 'GD', label: 'Grenada' },
    { value: 'GP', label: 'Guadeloupe' },
    { value: 'GU', label: 'Guam' },
    { value: 'GT', label: 'Guatemala' },
    { value: 'GG', label: 'Guernsey' },
    { value: 'GN', label: 'Guinea' },
    { value: 'GW', label: 'Guinea-Bissau' },
    { value: 'GY', label: 'Guyana' },
    { value: 'HT', label: 'Haiti' },
    { value: 'HM', label: 'Heard Island and McDonald Islands' },
    { value: 'VA', label: 'Holy See' },
    { value: 'HN', label: 'Honduras' },
    { value: 'HK', label: 'Hong Kong' },
    { value: 'HU', label: 'Hungary' },
    { value: 'IS', label: 'Iceland' },
    { value: 'IN', label: 'India' },
    { value: 'ID', label: 'Indonesia' },
    { value: 'IR', label: 'Iran' },
    { value: 'IQ', label: 'Iraq' },
    { value: 'IE', label: 'Ireland' },
    { value: 'IM', label: 'Isle of Man' },
    { value: 'IL', label: 'Israel' },
    { value: 'IT', label: 'Italy' },
    { value: 'JM', label: 'Jamaica' },
    { value: 'JP', label: 'Japan' },
    { value: 'JE', label: 'Jersey' },
    { value: 'JO', label: 'Jordan' },
    { value: 'KZ', label: 'Kazakhstan' },
    { value: 'KE', label: 'Kenya' },
    { value: 'KI', label: 'Kiribati' },
    { value: 'KP', label: 'Korea (Democratic People\'s Republic of)' },
    { value: 'KR', label: 'Korea (Republic of)' },
    { value: 'KW', label: 'Kuwait' },
    { value: 'KG', label: 'Kyrgyzstan' },
    { value: 'LA', label: 'Lao People\'s Democratic Republic' },
    { value: 'LV', label: 'Latvia' },
    { value: 'LB', label: 'Lebanon' },
    { value: 'LS', label: 'Lesotho' },
    { value: 'LR', label: 'Liberia' },
    { value: 'LY', label: 'Libya' },
    { value: 'LI', label: 'Liechtenstein' },
    { value: 'LT', label: 'Lithuania' },
    { value: 'LU', label: 'Luxembourg' },
    { value: 'MO', label: 'Macao' },
    { value: 'MG', label: 'Madagascar' },
    { value: 'MW', label: 'Malawi' },
    { value: 'MY', label: 'Malaysia' },
    { value: 'MV', label: 'Maldives' },
    { value: 'ML', label: 'Mali' },
    { value: 'MT', label: 'Malta' },
    { value: 'MH', label: 'Marshall Islands' },
    { value: 'MQ', label: 'Martinique' },
    { value: 'MR', label: 'Mauritania' },
    { value: 'MU', label: 'Mauritius' },
    { value: 'YT', label: 'Mayotte' },
    { value: 'MX', label: 'Mexico' },
    { value: 'FM', label: 'Micronesia' },
    { value: 'MD', label: 'Moldova' },
    { value: 'MC', label: 'Monaco' },
    { value: 'MN', label: 'Mongolia' },
    { value: 'ME', label: 'Montenegro' },
    { value: 'MS', label: 'Montserrat' },
    { value: 'MA', label: 'Morocco' },
    { value: 'MZ', label: 'Mozambique' },
    { value: 'MM', label: 'Myanmar' },
    { value: 'NA', label: 'Namibia' },
    { value: 'NR', label: 'Nauru' },
    { value: 'NP', label: 'Nepal' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'NC', label: 'New Caledonia' },
    { value: 'NZ', label: 'New Zealand' },
    { value: 'NI', label: 'Nicaragua' },
    { value: 'NE', label: 'Niger' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'NU', label: 'Niue' },
    { value: 'NF', label: 'Norfolk Island' },
    { value: 'MK', label: 'North Macedonia' },
    { value: 'MP', label: 'Northern Mariana Islands' },
    { value: 'NO', label: 'Norway' },
    { value: 'OM', label: 'Oman' },
    { value: 'PK', label: 'Pakistan' },
    { value: 'PW', label: 'Palau' },
    { value: 'PS', label: 'Palestine, State of' },
    { value: 'PA', label: 'Panama' },
    { value: 'PG', label: 'Papua New Guinea' },
    { value: 'PY', label: 'Paraguay' },
    { value: 'PE', label: 'Peru' },
    { value: 'PH', label: 'Philippines' },
    { value: 'PN', label: 'Pitcairn' },
    { value: 'PL', label: 'Poland' },
    { value: 'PT', label: 'Portugal' },
    { value: 'PR', label: 'Puerto Rico' },
    { value: 'QA', label: 'Qatar' },
    { value: 'RE', label: 'Réunion' },
    { value: 'RO', label: 'Romania' },
    { value: 'RU', label: 'Russian Federation' },
    { value: 'RW', label: 'Rwanda' },
    { value: 'BL', label: 'Saint Barthélemy' },
    { value: 'SH', label: 'Saint Helena, Ascension and Tristan da Cunha' },
    { value: 'KN', label: 'Saint Kitts and Nevis' },
    { value: 'LC', label: 'Saint Lucia' },
    { value: 'MF', label: 'Saint Martin (French part)' },
    { value: 'PM', label: 'Saint Pierre and Miquelon' },
    { value: 'VC', label: 'Saint Vincent and the Grenadines' },
    { value: 'WS', label: 'Samoa' },
    { value: 'SM', label: 'San Marino' },
    { value: 'ST', label: 'Sao Tome and Principe' },
    { value: 'SA', label: 'Saudi Arabia' },
    { value: 'SN', label: 'Senegal' },
    { value: 'RS', label: 'Serbia' },
    { value: 'SC', label: 'Seychelles' },
    { value: 'SL', label: 'Sierra Leone' },
    { value: 'SG', label: 'Singapore' },
    { value: 'SX', label: 'Sint Maarten (Dutch part)' },
    { value: 'SK', label: 'Slovakia' },
    { value: 'SI', label: 'Slovenia' },
    { value: 'SB', label: 'Solomon Islands' },
    { value: 'SO', label: 'Somalia' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'GS', label: 'South Georgia and the South Sandwich Islands' },
    { value: 'SS', label: 'South Sudan' },
    { value: 'ES', label: 'Spain' },
    { value: 'LK', label: 'Sri Lanka' },
    { value: 'SD', label: 'Sudan' },
    { value: 'SR', label: 'Suriname' },
    { value: 'SJ', label: 'Svalbard and Jan Mayen' },
    { value: 'SE', label: 'Sweden' },
    { value: 'CH', label: 'Switzerland' },
    { value: 'SY', label: 'Syrian Arab Republic' },
    { value: 'TW', label: 'Taiwan' },
    { value: 'TJ', label: 'Tajikistan' },
    { value: 'TZ', label: 'Tanzania' },
    { value: 'TH', label: 'Thailand' },
    { value: 'TL', label: 'Timor-Leste' },
    { value: 'TG', label: 'Togo' },
    { value: 'TK', label: 'Tokelau' },
    { value: 'TO', label: 'Tonga' },
    { value: 'TT', label: 'Trinidad and Tobago' },
    { value: 'TN', label: 'Tunisia' },
    { value: 'TR', label: 'Turkey' },
    { value: 'TM', label: 'Turkmenistan' },
    { value: 'TC', label: 'Turks and Caicos Islands' },
    { value: 'TV', label: 'Tuvalu' },
    { value: 'UG', label: 'Uganda' },
    { value: 'UA', label: 'Ukraine' },
    { value: 'AE', label: 'United Arab Emirates' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'UM', label: 'United States Minor Outlying Islands' },
    { value: 'US', label: 'United States' },
    { value: 'UY', label: 'Uruguay' },
    { value: 'UZ', label: 'Uzbekistan' },
    { value: 'VU', label: 'Vanuatu' },
    { value: 'VE', label: 'Venezuela' },
    { value: 'VN', label: 'Viet Nam' },
    { value: 'VG', label: 'Virgin Islands (British)' },
    { value: 'VI', label: 'Virgin Islands (U.S.)' },
    { value: 'WF', label: 'Wallis and Futuna' },
    { value: 'EH', label: 'Western Sahara' },
    { value: 'YE', label: 'Yemen' },
    { value: 'ZM', label: 'Zambia' },
    { value: 'ZW', label: 'Zimbabwe' }
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

export const STORE_LOCATOR_IS_ENABLED = true
export const STORE_LOCATOR_SUPPORTED_COUNTRIES = [
    {
        countryCode: 'US',
        countryName: 'United States'
    },
    {
        countryCode: 'DE',
        countryName: 'Germany'
    }
]
export const STORE_LOCATOR_DEFAULT_POSTAL_CODE = '10178'
export const STORE_LOCATOR_RADIUS = 100
export const STORE_LOCATOR_RADIUS_UNIT = 'km'
export const STORE_LOCATOR_DEFAULT_COUNTRY = 'DE'
export const STORE_LOCATOR_DEFAULT_COUNTRY_CODE = 'DE'
export const STORE_LOCATOR_DEFAULT_PAGE_SIZE = 10
export const STORE_LOCATOR_NUM_STORES_PER_REQUEST_API_MAX = 200 // This is an API limit and is therefore not configurable

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
