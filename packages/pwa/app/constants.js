/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import packageInfo from '../package.json'
import {defineMessages} from 'react-intl'

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

export const FILTER_ACCORDION_SATE = 'filters-expanded-index'

export const API_ERROR_MESSAGE = 'Something went wrong. Try again!'

export const HOME_HREF = '/'

export const MAX_ORDER_QUANTITY = 10

// TODO: You can update these locales and currencies in 'pwa/package.json' file
export const SUPPORTED_LOCALES = packageInfo.l10n.supportedLocales
export const DEFAULT_LOCALE = packageInfo.l10n.defaultLocale
export const SUPPORTED_CURRENCIES = packageInfo.l10n.supportedCurrencies
export const DEFAULT_CURRENCY = packageInfo.l10n.defaultCurrency

/**
 *  Translations for names of the commonly-used locales.
 *  `locale` parameter format for OCAPI and Commerce API: <language code>-<country code>
 *  https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/Localization.html
 */
export const MESSAGES_OF_COMMON_LOCALES = defineMessages({
    'ar-SA': {defaultMessage: 'Arabic (Saudi Arabia)'},
    'bn-BD': {defaultMessage: 'Bangla (Bangladesh)'},
    'bn-IN': {defaultMessage: 'Bangla (India)'},
    'cs-CZ': {defaultMessage: 'Czech (Czech Republic)'},
    'da-DK': {defaultMessage: 'Danish (Denmark)'},
    'de-AT': {defaultMessage: 'German (Austria)'},
    'de-CH': {defaultMessage: 'German (Switzerland)'},
    'de-DE': {defaultMessage: 'German (Germany)'},
    'el-GR': {defaultMessage: 'Greek (Greece)'},
    'en-AU': {defaultMessage: 'English (Australia)'},
    'en-CA': {defaultMessage: 'English (Canada)'},
    'en-GB': {defaultMessage: 'English (United Kingdom)'},
    'en-IE': {defaultMessage: 'English (Ireland)'},
    'en-IN': {defaultMessage: 'English (India)'},
    'en-NZ': {defaultMessage: 'English (New Zealand)'},
    'en-US': {defaultMessage: 'English (United States)'},
    'en-ZA': {defaultMessage: 'English (South Africa)'},
    'es-AR': {defaultMessage: 'Spanish (Argentina)'},
    'es-CL': {defaultMessage: 'Spanish (Chile)'},
    'es-CO': {defaultMessage: 'Spanish (Columbia)'},
    'es-ES': {defaultMessage: 'Spanish (Spain)'},
    'es-MX': {defaultMessage: 'Spanish (Mexico)'},
    'es-US': {defaultMessage: 'Spanish (United States)'},
    'fi-FI': {defaultMessage: 'Finnish (Finland)'},
    'fr-BE': {defaultMessage: 'French (Belgium)'},
    'fr-CA': {defaultMessage: 'French (Canada)'},
    'fr-CH': {defaultMessage: 'French (Switzerland)'},
    'fr-FR': {defaultMessage: 'French (France)'},
    'he-IL': {defaultMessage: 'Hebrew (Israel)'},
    'hi-IN': {defaultMessage: 'Hindi (India)'},
    'hu-HU': {defaultMessage: 'Hungarian (Hungary)'},
    'id-ID': {defaultMessage: 'Indonesian (Indonesia)'},
    'it-CH': {defaultMessage: 'Italian (Switzerland)'},
    'it-IT': {defaultMessage: 'Italian (Italy)'},
    'ja-JP': {defaultMessage: 'Japanese (Japan)'},
    'ko-KR': {defaultMessage: 'Korean (Republic of Korea)'},
    'nl-BE': {defaultMessage: 'Dutch (Belgium)'},
    'nl-NL': {defaultMessage: 'Dutch (The Netherlands)'},
    'no-NO': {defaultMessage: 'Norwegian (Norway)'},
    'pl-PL': {defaultMessage: 'Polish (Poland)'},
    'pt-BR': {defaultMessage: 'Portuguese (Brazil)'},
    'pt-PT': {defaultMessage: 'Portuguese (Portugal)'},
    'ro-RO': {defaultMessage: 'Romanian (Romania)'},
    'ru-RU': {defaultMessage: 'Russian (Russian Federation)'},
    'sk-SK': {defaultMessage: 'Slovak (Slovakia)'},
    'sv-SE': {defaultMessage: 'Swedish (Sweden)'},
    'ta-IN': {defaultMessage: 'Tamil (India)'},
    'ta-LK': {defaultMessage: 'Tamil (Sri Lanka)'},
    'th-TH': {defaultMessage: 'Thai (Thailand)'},
    'tr-TR': {defaultMessage: 'Turkish (Turkey)'},
    'zh-CN': {defaultMessage: 'Chinese (China)'},
    'zh-HK': {defaultMessage: 'Chinese (Hong Kong)'},
    'zh-TW': {defaultMessage: 'Chinese (Taiwan)'}
})
