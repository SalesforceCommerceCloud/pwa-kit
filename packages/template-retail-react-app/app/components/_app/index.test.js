/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {Helmet} from 'react-helmet'

import App from '@salesforce/retail-react-app/app/components/_app/index.jsx'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {DEFAULT_LOCALE} from '@salesforce/retail-react-app/app/utils/test-utils'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import messages from '@salesforce/retail-react-app/translations/compiled/en-GB.json'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
jest.mock('../../hooks/use-multi-site', () => jest.fn())
let windowSpy
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn())
    jest.spyOn(console, 'groupCollapsed').mockImplementation(jest.fn())
})

afterAll(() => {
    console.log.mockRestore()
    console.groupCollapsed.mockRestore()
})
beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get')
})

afterEach(() => {
    console.log.mockClear()
    console.groupCollapsed.mockClear()
    windowSpy.mockRestore()
})

describe('App', () => {
    const site = {
        ...mockConfig.app.sites[0],
        alias: 'uk'
    }

    const locale = DEFAULT_LOCALE

    const buildUrl = jest.fn().mockImplementation((href, site, locale) => {
        return `${site ? `/${site}` : ''}${locale ? `/${locale}` : ''}${href}`
    })

    const resultUseMultiSite = {
        site,
        locale,
        buildUrl
    }

    test('App component is rendered appropriately', () => {
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={messages}>
                <p>Any children here</p>
            </App>
        )
        screen.debug()
        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getByText('Any children here')).toBeInTheDocument()
    })

    test('The localized hreflang links exist in the html head', () => {
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={messages} />
        )

        const helmet = Helmet.peek()
        const hreflangLinks = helmet.linkTags.filter((link) => link.rel === 'alternate')

        const hasGeneralLocale = ({hrefLang}) => hrefLang === DEFAULT_LOCALE.slice(0, 2)

        // `length + 2` because one for a general locale and the other with x-default value
        expect(hreflangLinks).toHaveLength(resultUseMultiSite.site.l10n.supportedLocales.length + 2)

        expect(hreflangLinks.some((link) => hasGeneralLocale(link))).toBe(true)
        expect(hreflangLinks.some((link) => link.hrefLang === 'x-default')).toBe(true)
    })
})
