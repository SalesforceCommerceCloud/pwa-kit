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
import CommerceAPI from '../commerce-api'
import {
    BasketProvider,
    CommerceAPIProvider,
    CustomerProvider,
    CustomerProductListsProvider
} from '../commerce-api/contexts'
import {AddToCartModalContext} from '../hooks/use-add-to-cart-modal'
import {commerceAPIConfig, einsteinAPIConfig} from '../api.config'
import {IntlProvider} from 'react-intl'
import {mockCategories as initialMockCategories} from '../commerce-api/mock-data'
import fallbackMessages from '../translations/compiled/en-GB.json'
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
// Contexts
import {CategoriesProvider, CurrencyProvider} from '../contexts'
import mockConfig from '../../config/mocks/default.json'

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
        ...commerceAPIConfig,
        einsteinConfig: einsteinAPIConfig,
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
    messages = fallbackMessages
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
    const ocapiHost = 'zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com'

    const api = new CommerceAPI({
        ...commerceAPIConfig,
        einsteinConfig: einsteinAPIConfig,
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
    return (
        <IntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
            <CommerceAPIProvider value={api}>
                <CategoriesProvider categories={initialCategories}>
                    <CurrencyProvider currency={DEFAULT_CURRENCY}>
                        <CustomerProvider value={{customer, setCustomer}}>
                            <BasketProvider value={{basket, setBasket}}>
                                <CustomerProductListsProvider>
                                    <Router>
                                        <ChakraProvider theme={theme}>
                                            <AddToCartModalContext.Provider value={addToCartModal}>
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
    locale: PropTypes.string
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
