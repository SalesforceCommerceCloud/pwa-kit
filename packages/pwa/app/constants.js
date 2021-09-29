/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {localizationConfig} from './localization.config'

// Constants used in the used for product searching.
export const DEFAULT_SEARCH_PARAMS = {limit: 25, offset: 0, sort: 'best-matches', refine: []}
export const DEFAULT_LIMIT_VALUES = [25, 50, 100] // Page sizes

// Constants for Search Component

export const RECENT_SEARCH_LIMIT = 5
export const RECENT_SEARCH_KEY = 'recent-search-key'
export const RECENT_SEARCH_MIN_LENGTH = 3

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

export const DEFAULT_CURRENCY = 'USD'

export const FILTER_ACCORDION_SATE = 'filters-expanded-index'

export const API_ERROR_MESSAGE = 'Something went wrong. Try again!'

export const HOME_HREF = '/'

export const SUPPORTED_LOCALES = localizationConfig.supportedLocales.map((locale) => locale.id)
export const DEFAULT_LOCALE = localizationConfig.defaultLocale
export const LOCALE_SELECTOR_MESSSAGES = localizationConfig.supportedLocales.reduce(
    (messages, locale) => ({...messages, [locale.id]: locale.message}),
    {}
)

export const MAX_ORDER_QUANTITY = 10
