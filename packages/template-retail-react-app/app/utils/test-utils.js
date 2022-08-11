/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {render} from '@testing-library/react'
import {BrowserRouter as Router} from 'react-router-dom'
import {ChakraProvider} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {setupServer} from 'msw/node'
import {rest} from 'msw'

import theme from '../theme'
import CommerceAPI from '../commerce-api'
import {
    BasketProvider,
    CommerceAPIProvider,
    CustomerProvider,
    CustomerProductListsProvider
} from '../commerce-api/contexts'
import {AddToCartModalContext} from '../hooks/use-add-to-cart-modal'
import {app as appDefaultConfig} from '../../config/default'
import {IntlProvider} from 'react-intl'
import {
    mockCategories as initialMockCategories,
    mockedRegisteredCustomer,
    exampleTokenReponse
} from '../commerce-api/mock-data'
import fallbackMessages from '../translations/compiled/en-GB.json'
import mockConfig from '../../config/mocks/default'

export const DEFAULT_LOCALE = 'en-GB'
export const DEFAULT_CURRENCY = 'GBP'
export const SUPPORTED_LOCALES = [
    {
        id: 'en-GB',
        preferredCurrency: 'GBP'
    },
    {
        id: 'de-DE',
        preferredCurrency: 'EUR'
    }
]
export const DEFAULT_SITE = 'global'
// Contexts
import {CategoriesProvider, CurrencyProvider, MultiSiteProvider} from '../contexts'

import {createUrlTemplate} from './url'
import {getDefaultSite, getSites} from './site-utils'

export const renderWithReactIntl = (node, locale = DEFAULT_LOCALE) => {
    return render(
        <IntlProvider locale={locale} defaultLocale={locale}>
            {node}
        </IntlProvider>
    )
}

export const renderWithRouter = (node) => renderWithReactIntl(<Router>{node}</Router>)

export const renderWithRouterAndCommerceAPI = (node) => {
    const api = new CommerceAPI({
        ...appDefaultConfig.commerceAPI,
        einsteinConfig: appDefaultConfig.einsteinAPI,
        proxy: undefined
    })
    return renderWithReactIntl(
        <CommerceAPIProvider value={api}>
            <Router>{node}</Router>
        </CommerceAPIProvider>
    )
}

/**
 * This is the Providers used to wrap components
 * for testing purposes.
 * @param {object} props
 */
export const TestProviders = ({
    children,
    initialBasket = null,
    initialCustomer = null,
    initialCategories = initialMockCategories,
    locale = DEFAULT_LOCALE,
    messages = fallbackMessages,
    appConfig = appDefaultConfig,
    siteAlias = DEFAULT_SITE
}) => {
    const mounted = useRef()
    // We use this to track mounted state.
    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
        }
    }, [])

    // API config overrides for disabling localhost proxy.
    const proxy = undefined

    // @TODO: make this dynamic (getting from package.json during CI tests fails, so hardcoding for now)
    const ocapiHost = 'zzrf-001.sandbox.us03.dx.commercecloud.salesforce.com'

    const api = new CommerceAPI({
        ...appConfig.commerceAPI,
        einsteinConfig: appConfig.einsteinAPI,
        proxy,
        ocapiHost
    })
    const [basket, _setBasket] = useState(initialBasket)
    const [customer, setCustomer] = useState(initialCustomer)

    const setBasket = useCallback((data) => {
        if (!mounted.current) {
            return
        }
        _setBasket(data)
    })

    const addToCartModal = {
        isOpen: false,
        data: null,
        onOpen: () => {},
        onClose: () => {}
    }

    const sites = getSites()
    const site =
        sites.find((site) => {
            return site.alias === siteAlias || site.id === appConfig['site']
        }) || getDefaultSite()

    const buildUrl = createUrlTemplate(appConfig, site.alias || site.id, locale)

    return (
        <IntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
            <MultiSiteProvider site={site} locale={locale} buildUrl={buildUrl}>
                <CommerceAPIProvider value={api}>
                    <CategoriesProvider categories={initialCategories}>
                        <CurrencyProvider currency={DEFAULT_CURRENCY}>
                            <CustomerProvider value={{customer, setCustomer}}>
                                <BasketProvider value={{basket, setBasket}}>
                                    <CustomerProductListsProvider>
                                        <Router>
                                            <ChakraProvider theme={theme}>
                                                <AddToCartModalContext.Provider
                                                    value={addToCartModal}
                                                >
                                                    {children}
                                                </AddToCartModalContext.Provider>
                                            </ChakraProvider>
                                        </Router>
                                    </CustomerProductListsProvider>
                                </BasketProvider>
                            </CustomerProvider>
                        </CurrencyProvider>
                    </CategoriesProvider>
                </CommerceAPIProvider>
            </MultiSiteProvider>
        </IntlProvider>
    )
}

TestProviders.propTypes = {
    children: PropTypes.element,
    initialBasket: PropTypes.object,
    initialCustomer: PropTypes.object,
    initialCategories: PropTypes.element,
    initialProductLists: PropTypes.object,
    messages: PropTypes.object,
    locale: PropTypes.string,
    appConfig: PropTypes.object,
    siteAlias: PropTypes.string
}

/**
 * This is used to wrap components for testing
 * purposes. You will need to wrap the components
 * which need access to certain contexts, such as
 * the theme, router and internationlization, etc.
 * @param {object} children
 * @param {object} options
 */
export const renderWithProviders = (children, options) =>
    render(children, {
        // eslint-disable-next-line react/display-name
        wrapper: () => <TestProviders {...options?.wrapperProps}>{children}</TestProviders>,
        ...options
    })

/**
 * This is used to construct the URL pathname that would include
 * or not include the default locale and site identifiers in the URL according to
 * their configuration set in config/mocks/default.js file.
 *
 * @param path The pathname that we want to use
 * @returns {string} URL pathname for the given path
 */
export const createPathWithDefaults = (path) => {
    const {app} = mockConfig
    const defaultSite = app.sites.find((site) => site.id === app.defaultSite)
    const siteAlias = app.siteAliases[defaultSite.id]
    const defaultLocale = defaultSite.l10n.defaultLocale

    const buildUrl = createUrlTemplate(app, siteAlias || defaultSite, defaultLocale)

    const updatedPath = buildUrl(path, siteAlias || defaultSite.id, defaultLocale)
    return updatedPath
}

/**
 * Set up an API mocking server for testing purposes.
 * This mock server includes the basic oauth flow endpoints.
 */
export const setupMockServer = (...handlers) => {
    return setupServer(
        // customer handlers have higher priority
        ...handlers,
        rest.post('*/oauth2/authorize', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
        ),
        rest.get('*/oauth2/authorize', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(303), ctx.set('location', `/testcallback`))
        ),
        rest.get('*/testcallback', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200))
        }),
        rest.post('*/oauth2/login', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.get('*/oauth2/logout', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(exampleTokenReponse))
        ),
        rest.get('*/customers/:customerId', (req, res, ctx) =>
            res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        ),
        rest.post('*/sessions', (req, res, ctx) => res(ctx.delay(0), ctx.status(200))),
        rest.post('*/oauth2/token', (req, res, ctx) =>
            res(
                ctx.delay(0),
                ctx.json({
                    customer_id: 'test',
                    access_token: 'testtoken',
                    refresh_token: 'testrefeshtoken',
                    usid: 'testusid',
                    enc_user_id: 'testEncUserId',
                    id_token: 'testIdToken'
                })
            )
        )
    )
}
