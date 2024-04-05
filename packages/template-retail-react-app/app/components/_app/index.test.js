/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {screen, waitFor} from '@testing-library/react'
import {Helmet} from 'react-helmet'

import App from './index.jsx'
import {renderWithProviders} from '../../utils/test-utils'
import {DEFAULT_LOCALE} from '../../utils/test-utils'
import useMultiSite from '../../hooks/use-multi-site'
import messages from '../../translations/compiled/en-GB.json'
import mockConfig from '../../../config/mocks/default'
import {useCommerceAPI} from '../../commerce-api/contexts.js'

jest.mock('../../hooks/use-multi-site', () => jest.fn())
jest.mock('pwa-kit-react-sdk/storefront-preview', () => {
    const MockedComponent = ({children, onInit}) => {
        onInit && onInit()
        return <>{children}</>
    }
    return MockedComponent
})

let windowSpy
console.warn('FYI these are mocked: console.log, <StorefrontPreview>')
beforeAll(() => {
    // jest.spyOn(console, 'log').mockImplementation(jest.fn())
    jest.spyOn(console, 'groupCollapsed').mockImplementation(jest.fn())
})

afterAll(() => {
    // console.log.mockRestore()
    console.groupCollapsed.mockRestore()
})
beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get')
})

afterEach(() => {
    // console.log.mockClear()
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
        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getByText('Any children here')).toBeInTheDocument()
    })

    test('shouldGetProps returns true only server-side', () => {
        windowSpy.mockImplementation(() => undefined)

        expect(App.shouldGetProps()).toBe(true)

        windowSpy.mockImplementation(() => ({
            location: {
                origin: 'http://localhost:3000/'
            }
        }))
        expect(App.shouldGetProps()).toBe(false)
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
        expect(hreflangLinks.length).toBe(resultUseMultiSite.site.l10n.supportedLocales.length + 2)

        expect(hreflangLinks.some((link) => hasGeneralLocale(link))).toBe(true)
        expect(hreflangLinks.some((link) => link.hrefLang === 'x-default')).toBe(true)
    })

    test('adds cache breaker to the parameters of SCAPI requests', async () => {
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1000)
        let didReceiveResponseSpy

        const MockedComponent = () => {
            const apiClients = useCommerceAPI()
            useEffect(() => {
                didReceiveResponseSpy = jest.spyOn(apiClients, 'didReceiveResponse')
            }, [])

            return (
                <App
                    targetLocale={DEFAULT_LOCALE}
                    defaultLocale={DEFAULT_LOCALE}
                    messages={messages}
                />
            )
        }
        renderWithProviders(<MockedComponent />)

        await waitFor(() => {
            expect(didReceiveResponseSpy).toHaveBeenCalledWith(expect.anything(), [
                expect.objectContaining({
                    parameters: expect.objectContaining({
                        c_cache_breaker: 1000
                    })
                })
            ])
        })

        dateSpy.mockRestore()
        didReceiveResponseSpy.mockRestore()
    })
})
