/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {
    whichLocaleToLoad,
    getTargetLocale,
    loadLocaleData,
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
    useLocale,
    getLocaleConfig
} from './locale'

import {screen, fireEvent, act} from '@testing-library/react'
import {FormattedMessage} from 'react-intl'
import {renderWithReactIntl} from './utils/test-utils'

const nonSupportedLocale = 'nl'
const supportedLocale = SUPPORTED_LOCALES[0]
const helloWorld = {
    en: 'Hello World',
    fr: 'Bonjour le monde',
    messageId: 'homepage.message.welcome'
}

const SampleHomepage = () => {
    const [, changeLocale] = useLocale()

    return (
        <div>
            <h1>
                {/* NOTE: Looks like we had to hardcode the values of these props, now that we're using babel-plugin-formatjs */}
                <FormattedMessage id="homepage.message.welcome" defaultMessage="Hello World" />
            </h1>
            <button onClick={() => changeLocale('fr')}>change locale</button>
        </div>
    )
}

test('our assumptions before further testing', () => {
    expect(SUPPORTED_LOCALES.includes(nonSupportedLocale)).toBe(false)
    expect(DEFAULT_LOCALE).toBe('en')
})

describe('whichLocaleToLoad', () => {
    test('default to fallback locale', () => {
        const locale = whichLocaleToLoad([nonSupportedLocale], SUPPORTED_LOCALES, DEFAULT_LOCALE)
        expect(locale).toBe(DEFAULT_LOCALE)
    })
    test('matches one of the supported locales', () => {
        const locale = whichLocaleToLoad([supportedLocale], SUPPORTED_LOCALES, DEFAULT_LOCALE)
        expect(locale).toBe(supportedLocale)
    })
    test('case-insensitivity', () => {
        const locale = whichLocaleToLoad(
            [supportedLocale.toUpperCase()],
            SUPPORTED_LOCALES,
            DEFAULT_LOCALE
        )
        expect(locale).toBe(supportedLocale)
    })
})

describe('getTargetLocale', () => {
    const originalEnv = {...process.env}

    afterEach(() => {
        // Reset the environment variables
        process.env = {...originalEnv}
    })

    test('forcing the target locale', () => {
        const locale = getTargetLocale([supportedLocale], SUPPORTED_LOCALES, DEFAULT_LOCALE)
        expect(locale).toBe(supportedLocale)

        process.env.TARGET_LOCALE = nonSupportedLocale
        const locale2 = getTargetLocale([supportedLocale], SUPPORTED_LOCALES, DEFAULT_LOCALE)
        expect(locale2).toBe(process.env.TARGET_LOCALE)
    })
})

describe('loadLocaleData', () => {
    const messageId = helloWorld.messageId

    test('default to English as the fallback locale', async () => {
        const messages = await loadLocaleData(nonSupportedLocale)
        expect(messages[messageId][0].value).toMatch(/hello world/i)
    })
    test('loading one of the supported locales', async () => {
        const messages = await loadLocaleData(supportedLocale)
        expect(messages[messageId]).toBeDefined()
    })
    test('loading the pseudo locale', async () => {
        const messages = await loadLocaleData('pseudo')
        expect(messages[messageId][0].value).toMatch(/^\[!! Ḣèĺĺĺĺŏ Ẅŏŕŕŕĺḋ !!\]$/)
    })
    test('handling a not-found translation file', async () => {
        expect(SUPPORTED_LOCALES[1]).not.toBe(DEFAULT_LOCALE)

        jest.mock(`./translations/compiled/${SUPPORTED_LOCALES[1]}.json`, () => {
            throw new Error()
        })

        let importDefaultLocale = false
        jest.mock(`./translations/compiled/${DEFAULT_LOCALE}.json`, () => {
            importDefaultLocale = true
        })

        await loadLocaleData(SUPPORTED_LOCALES[1])
        expect(importDefaultLocale).toBe(true)

        // Reset
        jest.unmock(`./translations/compiled/${SUPPORTED_LOCALES[1]}.json`)
        jest.unmock(`./translations/compiled/${DEFAULT_LOCALE}.json`)
    })
})

describe('getLocaleConfig', () => {
    test('without parameter', async () => {
        const config = await getLocaleConfig()
        expect(config.app.targetLocale).toBe(DEFAULT_LOCALE)
    })
    test('with getUserPreferredLocales parameter', async () => {
        const locale = SUPPORTED_LOCALES[1]
        expect(locale).not.toBe(DEFAULT_LOCALE)

        const config = await getLocaleConfig({
            getUserPreferredLocales: () => [locale]
        })
        expect(config.app.targetLocale).toBe(locale)
    })
})

describe('useLocale', () => {
    test('changing locale', async () => {
        renderWithReactIntl(<SampleHomepage />)
        expect(screen.getByText(helloWorld.en)).toBeInTheDocument()

        act(() => {
            fireEvent.click(screen.getByText('change locale'))
        })
        const newH1 = await screen.findByText(helloWorld.fr)
        expect(newH1).toBeInTheDocument()
    })
})
