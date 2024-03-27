/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// CAUTION: This test file relies on config values that may get changed in generated projects

import {
    determineTargetLocale,
    fetchTranslations,
    getTargetLocale
} from '@salesforce/retail-react-app/app/utils/locale'

import {DEFAULT_LOCALE, SUPPORTED_LOCALES} from '@salesforce/retail-react-app/app/utils/test-utils'

jest.mock('cross-fetch', () => {
    return async (url) => {
        const matched = url.match(/translations\/compiled\/(.+)\.json/)
        if (!matched) {
            throw new Error('Not seeing the expected url for the translation file')
        }

        const locale = matched[1]
        const json = await import(`../static/translations/compiled/${locale}.json`)

        return {
            ok: true,
            json: () => Promise.resolve(json)
        }
    }
})
jest.mock('@salesforce/pwa-kit-react-sdk/utils/url', () => {
    return {getAppOrigin: () => ''}
})
jest.mock('@salesforce/pwa-kit-react-sdk/ssr/universal/utils', () => {
    return {getAssetUrl: (url) => url}
})

const supportedLocales = SUPPORTED_LOCALES.map((locale) => locale.id)
const isMultiLocales = supportedLocales.length > 1
const nonSupportedLocale = 'nl-NL'
// Make sure this supported locale is not the default locale.
// Otherwise, our code would fall back to default and incorrectly pass the tests
const supportedLocale = isMultiLocales
    ? supportedLocales.find((locale) => locale !== DEFAULT_LOCALE)
    : supportedLocales[0]

const testId1 = 'footer.link.privacy_policy'
const testId2 = 'account.accordion.button.my_account'

test('our assumptions before further testing', () => {
    expect(supportedLocales).not.toContain(nonSupportedLocale)
    if (isMultiLocales) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(DEFAULT_LOCALE).toBe('en-GB')
        // eslint-disable-next-line jest/no-conditional-expect
        expect(supportedLocale).not.toBe(DEFAULT_LOCALE)
    }
})

describe('determineTargetLocale', () => {
    test('default to fallback locale', () => {
        const locale = determineTargetLocale([nonSupportedLocale], supportedLocales, DEFAULT_LOCALE)
        expect(locale).toBe(DEFAULT_LOCALE)
    })
    test('matches one of the supported locales', () => {
        const locale = determineTargetLocale([supportedLocale], supportedLocales, DEFAULT_LOCALE)
        expect(locale).toBe(supportedLocale)
    })
})

describe('fetchTranslations', () => {
    // The following two tests expect the compiled translation files in app/static/translations/compiled to exist
    test('loading the target locale', async () => {
        const messages = await fetchTranslations(supportedLocale)
        expect(messages[testId2]).toBeDefined()
    })
    test('loading the pseudo locale', async () => {
        const messages = await fetchTranslations('en-XA')
        expect(messages[testId1][1].value).toMatch(/Ƥřīṽȧȧƈẏ Ƥǿǿŀīƈẏ/)
    })
    test('handling a not-found translation file', async () => {
        const messages = await fetchTranslations('xx-XX')
        const emptyMessages = {}
        expect(messages).toEqual(emptyMessages)
    })
})

describe('getTargetLocale', () => {
    const originalEnv = {...process.env}
    let windowSpy

    const l10nConfig = {
        defaultLocale: DEFAULT_LOCALE,
        supportedLocales: SUPPORTED_LOCALES
    }
    beforeEach(() => {
        windowSpy = jest.spyOn(window, 'window', 'get')
    })
    afterEach(() => {
        // Reset
        process.env = {...originalEnv}
        windowSpy.mockRestore()
    })

    test('without getUserPreferredLocales parameter', () => {
        const targetLocale = getTargetLocale({l10nConfig})
        expect(targetLocale).toBe(DEFAULT_LOCALE)
    })
    test('with getUserPreferredLocales parameter', () => {
        const locale = supportedLocale
        if (isMultiLocales) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(locale).not.toBe(DEFAULT_LOCALE)
        }
        const targetLocale = getTargetLocale({
            getUserPreferredLocales: () => [locale],
            l10nConfig
        })
        expect(targetLocale).toBe(locale)
    })
    test('with pseudo locale', async () => {
        process.env.USE_PSEUDOLOCALE = 'true'
        // Simulate server side
        windowSpy.mockImplementation(() => undefined)

        const targetLocale = getTargetLocale({l10nConfig})
        // We expect the compiled translation file in app/static/translations/compiled/en-XA to exist
        const messages = await fetchTranslations(targetLocale)
        // The app should still think its target locale is the default one
        expect(targetLocale).toBe(DEFAULT_LOCALE)
        // But the actual translation should be using the pseudo locale
        expect(messages[testId1][1].value).toMatch(/Ƥřīṽȧȧƈẏ Ƥǿǿŀīƈẏ/)
    })
})
