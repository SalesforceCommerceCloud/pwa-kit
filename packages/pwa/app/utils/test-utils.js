import React, {useCallback, useEffect, useRef, useState} from 'react'
import {render} from '@testing-library/react'
import {BrowserRouter as Router} from 'react-router-dom'
import {ChakraProvider} from '@chakra-ui/react'
import PropTypes from 'prop-types'

import theme from '../theme'
import CommerceAPI from '../commerce-api'
import {BasketProvider, CommerceAPIProvider, CustomerProvider} from '../commerce-api/utils'
import {commerceAPIConfig} from '../commerce-api.config'
import {IntlProvider, DEFAULT_LOCALE} from '../locale'
import {CategoriesContext} from '../contexts'

export const renderWithReactIntl = (node, locale = DEFAULT_LOCALE) => {
    return render(
        <IntlProvider locale={locale} defaultLocale={locale}>
            {node}
        </IntlProvider>
    )
}

export const renderWithRouter = (node) => renderWithReactIntl(<Router>{node}</Router>)

export const renderWithRouterAndCommerceAPI = (node) => {
    const api = new CommerceAPI({...commerceAPIConfig, proxy: undefined})
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
    initialCategories = []
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
        proxy,
        ocapiHost
    })
    const [basket, _setBasket] = useState(initialBasket)
    const [customer, setCustomer] = useState(initialCustomer)
    const [categories, setCategories] = useState(initialCategories)

    const setBasket = useCallback((data) => {
        if (!mounted.current) {
            return
        }
        _setBasket(data)
    })

    return (
        <IntlProvider locale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE}>
            <CommerceAPIProvider value={api}>
                <CategoriesContext.Provider value={{categories, setCategories}}>
                    <CustomerProvider value={{customer, setCustomer}}>
                        <BasketProvider value={{basket, setBasket}}>
                            <Router>
                                <ChakraProvider theme={theme}>{children}</ChakraProvider>
                            </Router>
                        </BasketProvider>
                    </CustomerProvider>
                </CategoriesContext.Provider>
            </CommerceAPIProvider>
        </IntlProvider>
    )
}

TestProviders.propTypes = {
    children: PropTypes.element,
    initialBasket: PropTypes.object,
    initialCustomer: PropTypes.object,
    initialCategories: PropTypes.element
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
