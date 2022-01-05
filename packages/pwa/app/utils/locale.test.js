/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    whichLocaleToLoad,
    loadLocaleData,
    getLocaleConfig,
    getPreferredCurrency,
    getSupportedLocalesIds
} from './locale'

// import {SUPPORTED_LOCALES, DEFAULT_LOCALE} from '../constants'

const l10nConfig = {
    supportedCurrencies: ['USD', 'EUR', 'CNY', 'JPY'],
    defaultCurrency: 'USD',
    supportedLocales: [
        {
            id: 'en-US',
            preferredCurrency: 'USD'
        },
        {
            id: 'fr-FR',
            preferredCurrency: 'EUR'
        },
        {
            id: 'it-IT',
            preferredCurrency: 'EUR'
        },
        {
            id: 'zh-CN',
            preferredCurrency: 'CNY'
        },
        {
            id: 'ja-JP',
            preferredCurrency: 'JPY'
        }
    ],
    defaultLocale: 'en-GB'
}

const supportedLocales = getSupportedLocalesIds(l10nConfig.supportedLocales)
const nonSupportedLocale = 'nl-NL'
// Make sure this supported locale is not the default locale.
// Otherwise, our code would fall back to default and incorrectly pass the tests
const supportedLocale = supportedLocales[1]

const testId1 = 'footer.link.privacy_policy'
const testId2 = 'homepage.message.welcome'

test('our assumptions before further testing', () => {
    expect(supportedLocales.includes(nonSupportedLocale)).toBe(false)
    expect(l10nConfig.defaultLocale).toBe('en-GB')
    expect().not.toBe(l10nConfig.defaultLocale)
})

describe('whichLocaleToLoad', () => {
    test('default to fallback locale', () => {
        const locale = whichLocaleToLoad(
            [nonSupportedLocale],
            supportedLocales,
            l10nConfig.defaultLocale
        )
        expect(locale).toBe(l10nConfig.defaultLocale)
    })
    test('matches one of the supported locales', () => {
        const locale = whichLocaleToLoad(
            [supportedLocale],
            supportedLocales,
            l10nConfig.defaultLocale
        )
        expect(locale).toBe(supportedLocale)
    })
})

describe('loadLocaleData', () => {
    test('default to English as the fallback locale', async () => {
        const messages = await loadLocaleData(
            nonSupportedLocale,
            l10nConfig.defaultLocale,
            supportedLocales
        )
        expect(messages[testId1][0].value).toMatch(/Privacy Policy/i)
    })
    test('loading one of the supported locales', async () => {
        const messages = await loadLocaleData(
            supportedLocale,
            l10nConfig.defaultLocale,
            supportedLocales
        )
        expect(messages[testId2]).toBeDefined()
    })
    test('loading the pseudo locale', async () => {
        const messages = await loadLocaleData('en-XB', l10nConfig.defaultLocale, supportedLocales)
        expect(messages[testId1][0].value).toMatch(/^\[!! Ṕŕíííṿâćććẏ ṔṔṔŏĺíííćẏ !!]$/)
    })
    test('handling a not-found translation file', async () => {
        expect(supportedLocale).not.toBe(l10nConfig.defaultLocale)

        jest.mock(`../translations/compiled/${supportedLocale}.json`, () => {
            throw new Error()
        })

        const result = await loadLocaleData(
            supportedLocale,
            l10nConfig.defaultLocale,
            supportedLocales
        )
        expect(result).toStrictEqual({})

        // Reset
        jest.unmock(`../translations/compiled/${supportedLocale}.json`)
    })
})

describe('getLocaleConfig', () => {
    const originalEnv = {...process.env}
    let windowSpy

    beforeEach(() => {
        windowSpy = jest.spyOn(window, 'window', 'get')
    })
    afterEach(() => {
        // Reset
        process.env = {...originalEnv}
        windowSpy.mockRestore()
    })

    test('without parameter', async () => {
        const config = await getLocaleConfig({l10nConfig})
        const expectedResult = `en-GB`
        expect(config.targetLocale).toBe(expectedResult)
    })
    test('with getUserPreferredLocales parameter', async () => {
        const locale = supportedLocale
        expect(locale).not.toBe(l10nConfig.defaultLocale)

        const config = await getLocaleConfig({
            getUserPreferredLocales: () => [locale],
            l10nConfig
        })
        expect(config.targetLocale).toBe(locale)
    })
    test('with pseudo locale', async () => {
        process.env.USE_PSEUDOLOCALE = 'true'
        // Simulate server side
        windowSpy.mockImplementation(() => undefined)

        const config = await getLocaleConfig({l10nConfig})

        // The app should still think its target locale is the default one
        expect(config.targetLocale).toBe(l10nConfig.defaultLocale)
        // But the actual translation should be using the pseudo locale
        expect(config.messages[testId1][0].value).toMatch(/^\[!! Ṕŕíííṿâćććẏ ṔṔṔŏĺíííćẏ !!]$/)
    })
})

describe('getCurrency', () => {
    test('returns the preferred currency for a supported locale', () => {
        const currency = getPreferredCurrency(
            l10nConfig.supportedLocales[0].id,
            l10nConfig.supportedLocales
        )
        expect(currency).toBe(l10nConfig.supportedLocales[0].preferredCurrency)
    })

    test('returns undefined for a unsupported locale', () => {
        const currency = getPreferredCurrency(nonSupportedLocale, l10nConfig.supportedLocales)
        expect(currency).toBeFalsy()
    })
})
