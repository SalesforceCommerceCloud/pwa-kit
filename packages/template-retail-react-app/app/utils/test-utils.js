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

import theme from '../theme'
import _CommerceAPI from '../commerce-api'
import {
    BasketProvider,
    CommerceAPIProvider as _CommerceAPIProvider,
    CustomerProvider,
    CustomerProductListsProvider
} from '../commerce-api/contexts'
import {ServerContext} from 'pwa-kit-react-sdk/ssr/universal/contexts'
import {AddToCartModalContext} from '../hooks/use-add-to-cart-modal'
import {IntlProvider} from 'react-intl'
import {CommerceApiProvider} from 'commerce-sdk-react-preview'
import {withLegacyGetProps} from 'pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {mockCategories as initialMockCategories} from '../commerce-api/mock-data'
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
import {getSiteByReference} from './site-utils'

export const renderWithReactIntl = (node, locale = DEFAULT_LOCALE) => {
    return render(
        <IntlProvider locale={locale} defaultLocale={locale}>
            {node}
        </IntlProvider>
    )
}

export const renderWithRouter = (node) => renderWithReactIntl(<Router>{node}</Router>)

export const renderWithRouterAndCommerceAPI = (node) => {
    const api = new _CommerceAPI({
        ...mockConfig.app.commerceAPI,
        einsteinConfig: mockConfig.app.einsteinAPI,
        proxy: undefined
    })
    return renderWithReactIntl(
        <_CommerceAPIProvider value={api}>
            <Router>{node}</Router>
        </_CommerceAPIProvider>
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
    locale = {id: DEFAULT_LOCALE},
    messages = fallbackMessages,
    appConfig = mockConfig.app,
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
    const ocapiHost = 'zzrf-001.dx.commercecloud.salesforce.com'

    const api = new _CommerceAPI({
        ...appConfig.commerceAPI,
        einsteinConfig: appConfig.einsteinAPI,
        proxy,
        ocapiHost
    })
    const commerceApiConfig = appConfig.commerceAPI
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

    const site = getSiteByReference(siteAlias || appConfig.defaultSite)

    const buildUrl = createUrlTemplate(
        appConfig,
        site?.alias || site?.id,
        locale.alias || locale.id
    )

    return (
        <ServerContext.Provider value={{}}>
            <IntlProvider locale={locale.id} defaultLocale={DEFAULT_LOCALE} messages={messages}>
                <MultiSiteProvider site={site} locale={locale} buildUrl={buildUrl}>
                    <_CommerceAPIProvider value={api}>
                        <CommerceApiProvider
                            shortCode={commerceApiConfig.parameters.shortCode}
                            clientId={commerceApiConfig.parameters.clientId}
                            organizationId={commerceApiConfig.parameters.organizationId}
                            siteId={site?.id}
                            locale={locale.id}
                            redirectURI={`${window.location.origin}/testcallback`}
                        >
                            <CategoriesProvider treeRoot={initialCategories}>
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
                        </CommerceApiProvider>
                    </_CommerceAPIProvider>
                </MultiSiteProvider>
            </IntlProvider>
        </ServerContext.Provider>
    )
}

TestProviders.propTypes = {
    children: PropTypes.element,
    initialBasket: PropTypes.object,
    initialCustomer: PropTypes.object,
    initialCategories: PropTypes.element,
    initialProductLists: PropTypes.object,
    messages: PropTypes.object,
    locale: PropTypes.object,
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
export const renderWithProviders = (children, options) => {
    const TestProvidersWithDataAPI = withReactQuery(withLegacyGetProps(TestProviders), {
        queryClientConfig: {
            defaultOptions: {
                queries: {
                    retry: false,
                    staleTime: 2 * 1000
                },
                mutations: {
                    retry: false
                }
            }
        }
    })
    const locals = {}

    return render(children, {
        // eslint-disable-next-line react/display-name
        wrapper: () => (
            <TestProvidersWithDataAPI {...options?.wrapperProps} locals={locals}>
                {children}
            </TestProvidersWithDataAPI>
        ),
        ...options
    })
}

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
