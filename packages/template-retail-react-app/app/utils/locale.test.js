/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// CAUTION: This test file relies on config values that may get changed in generated projects

import {
    determineTargetLocale,
    getTargetLocale
} from '@salesforce/retail-react-app/app/utils/locale'
import {
    fetchTranslations
} from '@salesforce/retail-react-app/app/utils/translations'

import {DEFAULT_LOCALE, SUPPORTED_LOCALES} from '@salesforce/retail-react-app/app/utils/test-utils'

const supportedLocales = SUPPORTED_LOCALES.map((locale) => locale.id)
const isMultiLocales = supportedLocales.length > 1
const nonSupportedLocale = 'nl-NL'
// Make sure this supported locale is not the default locale.
// Otherwise, our code would fall back to default and incorrectly pass the tests
const supportedLocale = isMultiLocales
    ? supportedLocales.find((locale) => locale !== DEFAULT_LOCALE)
    : supportedLocales[0]

const testId1 = 'footer.link.privacy_policy'

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
        const messages = await fetchTranslations(targetLocale)
        // The app should still think its target locale is the default one
        expect(targetLocale).toBe(DEFAULT_LOCALE)
        // But the actual translation should be using the pseudo locale
        expect(messages[testId1][1].value).toMatch(/Ƥřīṽȧȧƈẏ Ƥǿǿŀīƈẏ/)
    })
})
