/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import {render} from '@testing-library/react'
import {BrowserRouter as Router} from 'react-router-dom'
import {ChakraProvider} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'

import theme from '@salesforce/retail-react-app/app/theme'
import {AddToCartModalProvider} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import {ServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/contexts'
import {IntlProvider} from 'react-intl'
import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {PageContext, Region} from '@salesforce/commerce-sdk-react/components'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import fallbackMessages from '@salesforce/retail-react-app/app/static/translations/compiled/en-GB.json'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
// Contexts
import {CurrencyProvider, MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'

import {createUrlTemplate} from '@salesforce/retail-react-app/app/utils/url'
import {getSiteByReference} from '@salesforce/retail-react-app/app/utils/site-utils'
import jwt from 'jsonwebtoken'
import userEvent from '@testing-library/user-event'
// This JWT's payload is special
// it includes 3 fields that commerce-sdk-react cares:
// exp, isb and sub
// The lib decodes the jwt and extract information such as customerId and customerType
const guestPayload = {
    aut: 'GUID',
    scp: 'sfcc.shopper-myaccount.baskets sfcc.shopper-myaccount.addresses sfcc.shopper-products sfcc.shopper-discovery-search sfcc.shopper-myaccount.rw sfcc.shopper-myaccount.paymentinstruments sfcc.shopper-customers.login sfcc.shopper-experience sfcc.shopper-context.rw sfcc.shopper-myaccount.orders sfcc.shopper-customers.register sfcc.shopper-baskets-orders sfcc.shopper-myaccount.addresses.rw sfcc.shopper-myaccount.productlists.rw sfcc.shopper-productlists sfcc.shopper-promotions sfcc.shopper-baskets-orders.rw sfcc.shopper-myaccount.paymentinstruments.rw sfcc.shopper-gift-certificates sfcc.shopper-product-search sfcc.shopper-myaccount.productlists sfcc.shopper-categories sfcc.shopper-myaccount',
    sub: 'cc-slas::zzrf_001::scid:c9c45bfd-0ed3-4aa2-9971-40f88962b836::usid:02ccab32-d01e-4abc-809a-a457fa0512c2',
    ctx: 'slas',
    iss: 'slas/prod/zzrf_001',
    ist: 1,
    aud: 'commercecloud/prod/zzrf_001',
    nbf: 1679013708,
    sty: 'User',
    isb: 'uido:slas::upn:Guest::uidn:Guest User::gcid:bckbhHw0dGkXgRxbaVxqYYwuhH::chid: ',
    exp: 1924905600000,
    iat: 1679013738,
    jti: 'C2C4856201860-18906789034985270413965222'
}

const registeredUserPayload = {
    aut: 'GUID',
    scp: 'sfcc.shopper-myaccount.baskets sfcc.shopper-myaccount.addresses sfcc.shopper-products sfcc.shopper-discovery-search sfcc.shopper-myaccount.rw sfcc.shopper-myaccount.paymentinstruments sfcc.shopper-customers.login sfcc.shopper-experience sfcc.shopper-myaccount.orders sfcc.shopper-customers.register sfcc.shopper-baskets-orders sfcc.shopper-myaccount.addresses.rw sfcc.shopper-myaccount.productlists.rw sfcc.shopper-productlists sfcc.shopper-promotions sfcc.shopper-baskets-orders.rw sfcc.shopper-myaccount.paymentinstruments.rw sfcc.shopper-gift-certificates sfcc.shopper-product-search sfcc.shopper-myaccount.productlists sfcc.shopper-categories sfcc.shopper-myaccount',
    sub: 'cc-slas::zzrf_001::scid:c9c45bfd-0ed3-4aa2-9971-40f88962b836::usid:8e883973-68eb-41fe-a3c5-756232652ff5',
    ctx: 'slas',
    iss: 'slas/prod/zzrf_001',
    ist: 1,
    aud: 'commercecloud/prod/zzrf_001',
    nbf: 1678834271,
    sty: 'User',
    isb: 'uido:ecom::upn:kev5@test.com::uidn:kevin he::gcid:abmes2mbk3lXkRlHFJwGYYkuxJ::rcid:abUMsavpD9Y6jW00di2SjxGCMU::chid:RefArchGlobal',
    exp: 2678836101,
    iat: 1678834301,
    jti: 'C2C4856201860-18906789034805832570666542'
}
export const guestToken = jwt.sign(guestPayload, 'secret')
export const registerUserToken = jwt.sign(registeredUserPayload, 'secret')
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

export const renderWithReactIntl = (node, locale = DEFAULT_LOCALE) => {
    return render(
        <IntlProvider locale={locale} defaultLocale={locale}>
            {node}
        </IntlProvider>
    )
}

export const renderWithRouter = (node) => renderWithReactIntl(<Router>{node}</Router>)

/**
 * This is the Providers used to wrap components
 * for testing purposes.
 * @param {object} props
 */
export const TestProviders = ({
    children,
    locale = {id: DEFAULT_LOCALE},
    messages = fallbackMessages,
    appConfig = mockConfig.app,
    siteAlias = DEFAULT_SITE,
    isGuest = false,
    bypassAuth = true
}) => {
    const mounted = useRef()
    // We use this to track mounted state.
    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
        }
    }, [])

    const commerceApiConfig = appConfig.commerceAPI

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
                    <CommerceApiProvider
                        shortCode={commerceApiConfig.parameters.shortCode}
                        clientId={commerceApiConfig.parameters.clientId}
                        organizationId={commerceApiConfig.parameters.organizationId}
                        siteId={site?.id}
                        locale={locale.id}
                        redirectURI={`${window.location.origin}/testcallback`}
                        fetchedToken={bypassAuth ? (isGuest ? guestToken : registerUserToken) : ''}
                    >
                        <CurrencyProvider currency={DEFAULT_CURRENCY}>
                            <Router>
                                <ChakraProvider theme={theme}>
                                    <AddToCartModalProvider>{children}</AddToCartModalProvider>
                                </ChakraProvider>
                            </Router>
                        </CurrencyProvider>
                    </CommerceApiProvider>
                </MultiSiteProvider>
            </IntlProvider>
        </ServerContext.Provider>
    )
}

TestProviders.propTypes = {
    children: PropTypes.element,
    initialBasket: PropTypes.object,
    initialCustomer: PropTypes.object,
    initialProductLists: PropTypes.object,
    messages: PropTypes.object,
    locale: PropTypes.object,
    appConfig: PropTypes.object,
    siteAlias: PropTypes.string,
    bypassAuth: PropTypes.bool,
    isGuest: PropTypes.bool
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
    const TestProvidersWithDataAPI = withReactQuery(TestProviders, {
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
    const user = userEvent.setup()
    const locals = {}

    const res = render(children, {
        wrapper: () => (
            <TestProvidersWithDataAPI {...options?.wrapperProps} locals={locals}>
                {children}
            </TestProvidersWithDataAPI>
        ),
        ...options
    })
    return {user, ...res}
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

/**
 * When testing page designer components wrap them using this higher-order component
 * if you plan on using `Region` of `Components` within the components definition.
 *
 * @param {*} Component
 * @param {*} options
 * @returns
 */
export const withPageProvider = (Component, options) => {
    const providerProps = options?.providerProps || {
        value: {
            components: new Proxy(
                {},
                {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    get(_target, _prop) {
                        return (props) => (
                            <div>
                                <b>{props.typeId}</b>
                                {props?.regions?.map((region) => (
                                    <Region key={region.id} region={region} />
                                ))}
                            </div>
                        )
                    }
                }
            )
        }
    }
    const wrappedComponentName = Component.displayName || Component.name
    const WrappedComponent = (props) => (
        <PageContext.Provider {...providerProps}>
            <Component {...props} />
        </PageContext.Provider>
    )
    WrappedComponent.displayName = `withRouter(${wrappedComponentName})`

    return WrappedComponent
}
