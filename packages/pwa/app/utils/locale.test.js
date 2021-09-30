/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    whichLocaleToLoad,
    getTargetLocale,
    loadLocaleData,
    getLocaleConfig,
    getPreferredCurrency
} from './locale'

import {SUPPORTED_LOCALES, DEFAULT_LOCALE} from '../constants'

const nonSupportedLocale = 'nl-NL'
const supportedLocale = SUPPORTED_LOCALES[0]
const testMessageId = 'login-redirect.message.welcome'

test('our assumptions before further testing', () => {
    expect(SUPPORTED_LOCALES.includes(nonSupportedLocale)).toBe(false)
    expect(DEFAULT_LOCALE).toBe('en-GB')
})

describe('whichLocaleToLoad', () => {
    test('default to fallback locale', () => {
        const locale = whichLocaleToLoad([nonSupportedLocale], SUPPORTED_LOCALES, DEFAULT_LOCALE)
        expect(locale).toBe(DEFAULT_LOCALE)
    })
    test('matches one of the supported locales', () => {
        const locale = whichLocaleToLoad([supportedLocale], SUPPORTED_LOCALES, DEFAULT_LOCALE)
        expect(locale).toBe(supportedLocale.id)
    })
    test('case-insensitivity', () => {
        const locale = whichLocaleToLoad(
            [supportedLocale.id.toUpperCase()],
            SUPPORTED_LOCALES,
            DEFAULT_LOCALE
        )
        expect(locale).toBe(supportedLocale.id)
    })
})

describe('getTargetLocale', () => {
    const originalEnv = {...process.env}

    afterEach(() => {
        // Reset the environment variables
        process.env = {...originalEnv}
    })

    test('forcing the target locale', () => {
        const locale = getTargetLocale([supportedLocale.id], SUPPORTED_LOCALES, DEFAULT_LOCALE)
        expect(locale).toBe(supportedLocale.id)

        process.env.TARGET_LOCALE = nonSupportedLocale
        const locale2 = getTargetLocale([supportedLocale.id], SUPPORTED_LOCALES, DEFAULT_LOCALE)
        expect(locale2).toBe(process.env.TARGET_LOCALE)
    })
})

describe('loadLocaleData', () => {
    test('default to English as the fallback locale', async () => {
        const messages = await loadLocaleData(nonSupportedLocale)
        console.log('messages: ', messages)
        expect(messages[testMessageId][0].value).toMatch(/login redirect/i)
    })
    test('loading one of the supported locales', async () => {
        const messages = await loadLocaleData(supportedLocale)
        expect(messages[testMessageId]).toBeDefined()
    })
    test('loading the pseudo locale', async () => {
        const messages = await loadLocaleData('en-XB')
        expect(messages[testMessageId][0].value).toMatch(/^\[!! Ļŏĝĝĝíń Ŕèḋḋḋíŕèèèćṭ !!]$/)
    })
    test('handling a not-found translation file', async () => {
        expect(SUPPORTED_LOCALES[1].id).not.toBe(DEFAULT_LOCALE)

        jest.mock(`../translations/compiled/${SUPPORTED_LOCALES[1].id}.json`, () => {
            throw new Error()
        })

        let importDefaultLocale = false
        jest.mock(`../translations/compiled/${DEFAULT_LOCALE}.json`, () => {
            importDefaultLocale = true
        })

        await loadLocaleData(SUPPORTED_LOCALES[1].id)
        expect(importDefaultLocale).toBe(true)

        // Reset
        jest.unmock(`../translations/compiled/${SUPPORTED_LOCALES[1].id}.json`)
        jest.unmock(`../translations/compiled/${DEFAULT_LOCALE}.json`)
    })
})

describe('getLocaleConfig', () => {
    test('without parameter', async () => {
        const config = await getLocaleConfig()
        expect(config.app.targetLocale).toBe(DEFAULT_LOCALE)
    })
    test('with getUserPreferredLocales parameter', async () => {
        const locale = SUPPORTED_LOCALES[1].id
        expect(locale).not.toBe(DEFAULT_LOCALE)

        const config = await getLocaleConfig({
            getUserPreferredLocales: () => [locale]
        })
        expect(config.app.targetLocale).toBe(locale)
    })
})

describe('getCurrency', () => {
    test('returns the preferred currency for a supported locale', () => {
        const currency = getPreferredCurrency(supportedLocale.id)
        expect(currency).toBe(SUPPORTED_LOCALES[0].preferredCurrency)
    })

    test('returns undefined for a unsupported locale', () => {
        const currency = getPreferredCurrency(nonSupportedLocale)
        expect(currency).toBeFalsy()
    })
})
