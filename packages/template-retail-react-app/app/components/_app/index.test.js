/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderToString} from 'react-dom/server'
import {Helmet} from 'react-helmet'
import {rest} from 'msw'

import App from '@salesforce/retail-react-app/app/components/_app/index.jsx'
import {renderWithProviders, TestProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {DEFAULT_LOCALE} from '@salesforce/retail-react-app/app/utils/test-utils'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import messages from '@salesforce/retail-react-app/app/static/translations/compiled/en-GB.json'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {prependHandlersToServer} from '@salesforce/retail-react-app/jest-setup'
import {mockCustomerBaskets} from '@salesforce/retail-react-app/app/mocks/mock-data'
import {mockEmbeddedHeader} from '@salesforce/retail-react-app/app/mocks/page-designer'
// `@salesforce/commerce-sdk-react/page-designer` is only stubbed for `PageDesignerProvider`
// below — the `registry` export it re-exports is the real V2 singleton.
import {registry} from '@salesforce/commerce-sdk-react/page-designer'
import {StorefrontPreview} from '@salesforce/commerce-sdk-react/components'

jest.mock('@salesforce/commerce-sdk-react/components', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react/components')
    return {
        ...actual,
        // eslint-disable-next-line react/prop-types
        StorefrontPreview: jest.fn(({children}) => children)
    }
})

jest.mock('../../hooks/use-multi-site', () => jest.fn())
jest.mock('../../hooks/use-update-shopper-context', () => ({
    useUpdateShopperContext: jest.fn()
}))
jest.mock('../../page-designer/registry', () => ({
    initializeRegistry: jest.fn()
}))
// In EDIT/PREVIEW mode the real PageDesignerProvider lazy-loads the runtime design
// machinery (React.lazy → DesignContext), which the jsdom test environment can't mount.
// The SSR regression is about the announcement `<Region>`, not the design pipeline.
jest.mock('@salesforce/commerce-sdk-react/page-designer', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react/page-designer'),
    // eslint-disable-next-line react/prop-types
    PageDesignerProvider: ({children}) => <>{children}</>
}))

let windowSpy

const mockUpdateDnt = jest.fn()

// Mock registry with required methods
const mockRegistry = {
    registerImporter: jest.fn(),
    getComponent: jest.fn(),
    has: jest.fn(() => false),
    get: jest.fn()
}

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useDNT: () => ({selectedDnt: undefined, updateDnt: mockUpdateDnt}),
        useUsid: () => ({usid: 'test-usid', getUsidWhenReady: () => Promise.resolve('test-usid')}),
        useGlobalAnchorBlock: jest.fn(),
        registry: mockRegistry,
        useComponent: jest.fn(() => ({data: undefined, isLoading: false, error: null}))
    }
})

beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get')
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
    StorefrontPreview.mockClear()
    jest.restoreAllMocks()
    jest.resetModules()
    // Reset the jsdom URL so a route-dependent test can't leak its location into the next.
    window.history.pushState({}, '', '/')
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

    test('renders the component-preview surface without StorefrontPreview or storefront chrome', async () => {
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        // BrowserRouter reads window.location, so put the app on the preview route.
        window.history.pushState({}, '', '/uk/en-GB/preview/component?mode=EDIT')
        StorefrontPreview.mockClear()

        renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE} messages={messages}>
                <p>Preview child</p>
            </App>
        )

        await waitFor(() => {
            expect(screen.getByText('Preview child')).toBeInTheDocument()
        })
        // The chrome-free preview surface renders the main region but no storefront
        // header navigation or footer, and does not mount MRT StorefrontPreview.
        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
        expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
        expect(StorefrontPreview).not.toHaveBeenCalled()
    })

    test('SSR-renders the embedded header when its component is only lazily registered', () => {
        // The production regression: `initializeRegistry()` registers *lazy importers*, not
        // eager components, so during SSR `registry.getComponent()` returns null on first
        // render and `<Component>` throws `registry.preload()`'s promise to suspend. The
        // announcement `<Region>` renders in *component mode*, which has no Suspense boundary
        // of its own, so `_app` must provide one — otherwise `renderToString` rethrows the
        // uncaught suspend and blanks the whole tree (the 500 seen on the runtime homepage).
        //
        // This must use `renderToString`, not `renderWithProviders`: React 18's client
        // renderer tolerates a boundary-less suspend (it commits once the promise resolves),
        // so a client render passes even on the broken code — only synchronous SSR reproduces
        // the crash. Restore `useComponent` and the production lazy-importer registry
        // afterward so later tests are not order-dependent.
        const {useComponent} = jest.requireMock('@salesforce/commerce-sdk-react')
        const {initializeRegistry} = jest.requireActual('../../page-designer/registry')
        useComponent.mockReturnValue({
            data: mockEmbeddedHeader,
            isLoading: false,
            error: null
        })
        useMultiSite.mockImplementation(() => resultUseMultiSite)
        const typeId = mockEmbeddedHeader.regions[0].components[0].typeId
        const AppWithProviders = withReactQuery(TestProviders)
        registry.clear()
        registry.registerImporter(typeId, () =>
            import('@salesforce/retail-react-app/app/page-designer/content/announcement-banner')
        )

        try {
            expect(() =>
                renderToString(
                    <AppWithProviders locals={{}}>
                        <App
                            targetLocale={DEFAULT_LOCALE}
                            defaultLocale={DEFAULT_LOCALE}
                            messages={messages}
                        />
                    </AppWithProviders>
                )
            ).not.toThrow()
        } finally {
            useComponent.mockReturnValue({data: undefined, isLoading: false, error: null})
            registry.clear()
            initializeRegistry()
        }
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
