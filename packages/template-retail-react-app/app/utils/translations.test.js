/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {DEFAULT_LOCALE, SUPPORTED_LOCALES} from '@salesforce/retail-react-app/app/utils/test-utils'

import {
    fetchTranslations
} from '@salesforce/retail-react-app/app/utils/translations'

const supportedLocales = SUPPORTED_LOCALES.map((locale) => locale.id)
const isMultiLocales = supportedLocales.length > 1
// Make sure this supported locale is not the default locale.
// Otherwise, our code would fall back to default and incorrectly pass the tests
const supportedLocale = isMultiLocales
    ? supportedLocales.find((locale) => locale !== DEFAULT_LOCALE)
    : supportedLocales[0]

const testId2 = 'account.accordion.button.my_account'

describe('fetchTranslations', () => {
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
