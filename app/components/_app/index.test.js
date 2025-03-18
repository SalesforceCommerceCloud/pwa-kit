/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {Helmet} from 'react-helmet'
import {rest} from 'msw'

import App from '@salesforce/retail-react-app/app/components/_app/index.jsx'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {DEFAULT_LOCALE} from '@salesforce/retail-react-app/app/utils/test-utils'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import messages from '@salesforce/retail-react-app/app/static/translations/compiled/en-GB.json'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'
import {mockCustomerBaskets} from '@salesforce/retail-react-app/app/mocks/mock-data'

jest.mock('../../hooks/use-multi-site', () => jest.fn())
jest.mock('../../hooks/use-update-shopper-context', () => ({
    useUpdateShopperContext: jest.fn()
}))

let windowSpy

const mockUpdateDNT = jest.fn()
const mockActiveDataFlag = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useDNT: () => ({selectedDnt: undefined, updateDNT: mockUpdateDNT})
    }
})

jest.mock('@salesforce/retail-react-app/app/constants', () => {
    const originalModule = jest.requireActual('@salesforce/retail-react-app/app/constants')
    return {
        ...originalModule,
        get ACTIVE_DATA_ENABLED() {
            return mockActiveDataFlag()
        }
    }
})
beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get')
    mockActiveDataFlag.mockReturnValue(true)
    prependHandlersToServer([
        {
            path: '*/baskets/:basketId/customer',
            method: 'put',
            res: () => {
                return {
                    ...mockCustomerBaskets.baskets[0],
                    customerInfo: {
                        customerId: 'abmuc2wupJxeoRxuo3wqYYmbhI',
                        email: 'shopperUpdate@salesforce-test.com'
                    }
                }
            }
        }
    ])
})

afterEach(() => {
    windowSpy.mockRestore()
    jest.restoreAllMocks()
    jest.resetModules()
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

    test('User can select DNT options when App component is rendered with DNT notification', async () => {
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        const {user} = renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={messages}>
                <p>Any children here</p>
            </App>
        )
        const closeButton = screen.getByLabelText('Close consent tracking form')
        await user.click(closeButton)
        await waitFor(() => {
            expect(screen.getByRole('main')).toBeInTheDocument()
            expect(screen.getByText('Any children here')).toBeInTheDocument()
        })
    })

    test('Active Data component is not rendered', async () => {
        mockActiveDataFlag.mockImplementation(() => false)
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={messages}>
                <p>Any children here</p>
            </App>
        )
        await waitFor(() =>
            expect(document.getElementById('headActiveData')).not.toBeInTheDocument()
        )
        await waitFor(() => expect(document.getElementById('dwanalytics')).not.toBeInTheDocument())
        await waitFor(() => expect(document.getElementById('dwac')).not.toBeInTheDocument())
        expect(screen.getByText('Any children here')).toBeInTheDocument()
    })

    test('Active Data component is rendered appropriately', async () => {
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={messages}>
                <p>Any children here</p>
            </App>
        )
        await waitFor(() => {
            expect(document.getElementById('headActiveData')).toBeInTheDocument()
            expect(document.getElementById('dwanalytics')).toBeInTheDocument()
            expect(document.getElementById('dwac')).toBeInTheDocument()
            expect(screen.getByText('Any children here')).toBeInTheDocument()
        })
    })

    test('The localized hreflang links exist in the html head', () => {
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={messages} />
        )

        // expected locales for hrefLang
        const hrefLangLocales = mockConfig.app.sites[0].l10n.supportedLocales.map(
            (locale) => locale.id
        )
        const helmet = Helmet.peek()
        const hreflangLinks = helmet.linkTags.filter((link) => link.rel === 'alternate')
        const hasGeneralLocale = ({hrefLang}) => hrefLang === DEFAULT_LOCALE.slice(0, 2)

        hrefLangLocales.forEach((supportedLocale) => {
            expect(
                hreflangLinks.some(
                    (link) => link.hrefLang.toLowerCase() === supportedLocale.toLowerCase()
                )
            ).toBe(true)
            expect(hreflangLinks.some((link) => hasGeneralLocale(link))).toBe(true)
        })

        // localeRefs takes locale alias into consideration
        const localeRefs = mockConfig.app.sites[0].l10n.supportedLocales.map(
            (locale) => locale.alias || locale.id
        )

        localeRefs.forEach((localeRef) => {
            expect(hreflangLinks.some((link) => link.href.includes(localeRef))).toBe(true)
            // expecting href does not contain search query params in the href since it is a canonical url
            expect(
                hreflangLinks.some((link) => {
                    const urlObj = new URL(link.href)
                    return urlObj.search.length > 0
                })
            ).toBe(false)
        })

        // `length + 2` because one for a general locale and the other with x-default value
        expect(hreflangLinks).toHaveLength(resultUseMultiSite.site.l10n.supportedLocales.length + 2)

        expect(hreflangLinks.some((link) => hasGeneralLocale(link))).toBe(true)
        expect(hreflangLinks.some((link) => link.hrefLang === 'x-default')).toBe(true)
    })

    test('App component updates the basket with correct currency and customer email', async () => {
        const customerEmail = 'email@test.com'

        // Test basket. _app will be manipulating this basket's currency and customerInfo.email for this test
        const basket = {
            basketId: 'basket_id',
            currency: 'CAD',
            customerInfo: {
                customerId: 'customer_id',
                email: ''
            }
        }

        jest.mock('../../hooks/use-current-customer', () => {
            return {
                useCurrentCustomer: jest.fn().mockImplementation(() => {
                    return {data: basket, derivedData: {hasBasket: true, totalItems: 0}}
                })
            }
        })

        jest.mock('../../hooks/use-current-basket', () => {
            return {
                useCurrentBasket: jest.fn().mockImplementation(() => {
                    return {
                        data: basket,
                        derivedData: {
                            hasBasket: true,
                            totalItems: 0
                        }
                    }
                })
            }
        })

        global.server.use(
            // mock updating basket currency
            rest.patch('*/baskets/:basketId', (req, res, ctx) => {
                basket.currency = 'GBP'
                return res(ctx.json(basket))
            }),
            // mock adding guest email to basket
            rest.put('*/baskets/:basketId/customer', (req, res, ctx) => {
                basket.customerInfo.email = customerEmail
                return res(ctx.json(basket))
            })
        )

        useMultiSite.mockImplementation(() => resultUseMultiSite)
        renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={messages} />
        )

        await waitFor(() => {
            expect(basket.currency).toBe('GBP')
            expect(basket.customerInfo.email).toBe(customerEmail)
        })
    })
})
