/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {ChakraProvider} from '@chakra-ui/react'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

import theme from '../../theme'
import CommerceAPI from '../../commerce-api'
import {
    CommerceAPIProvider,
    CustomerProvider,
    BasketProvider,
    CustomerProductListsProvider
} from '../../commerce-api/contexts'
import {commerceAPIConfig} from '../../commerce-api.config'
import {einsteinAPIConfig} from '../../einstein-api.config'
import {DEFAULT_LOCALE, SUPPORTED_LOCALES, DEFAULT_CURRENCY} from '../../constants'
import {getLocaleConfig, getPreferredCurrency} from '../../utils/locale'
import {getUrlWithLocale} from '../../utils/url'

// Components
import Seo from '../seo'

// Localization
import {IntlProvider} from 'react-intl'

// SDK Utils
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

const apiConfig = {
    ...commerceAPIConfig,
    einsteinConfig: einsteinAPIConfig
}

/**
 * Returns the validated locale short code parsed from the url.
 * @private
 * @param locals the request locals (only defined when executing on the server.)
 * @returns {String} the locale short code
 */
const getLocale = (locals = {}) => {
    let {originalUrl} = locals

    // If there is no originalUrl value in the locals, create it from the window location.
    // This happens when executing on the client.
    if (!originalUrl) {
        originalUrl = window?.location.href.replace(window.location.origin, '')
    }

    // Parse the pathname from the partial using the URL object and a placeholder host
    const {pathname} = new URL(`http://hostname${originalUrl}`)
    let shortCode = pathname.split('/')[1]

    // Ensure that the locale is in the seported list, otherwise return the default.
    shortCode = SUPPORTED_LOCALES.find((locale) => locale.id === shortCode)
        ? shortCode
        : DEFAULT_LOCALE

    return shortCode
}

/**
 * Use the AppConfig component to inject extra arguments into the getProps
 * methods for all Route Components in the app – typically you'd want to do this
 * to inject a connector instance that can be used in all Pages.
 *
 * You can also use the AppConfig to configure a state-management library such
 * as Redux, or Mobx, if you like.
 */
const AppConfig = ({children, targetLocale, defaultLocale, messages, location, locals = {}}) => {
    const [basket, setBasket] = useState(null)
    const [customer, setCustomer] = useState(null)

    const appOrigin = getAppOrigin()

    return (
        <IntlProvider
            onError={(err) => {
                if (err.code === 'MISSING_TRANSLATION') {
                    // NOTE: Remove the console error for missing translations during development,
                    // as we knew translations would be added later.
                    console.warn('Missing translation', err.message)
                    return
                }
                throw err
            }}
            locale={targetLocale}
            defaultLocale={defaultLocale}
            messages={messages}
        >
            <Seo>
                <meta name="theme-color" content="#0288a7" />
                <meta name="apple-mobile-web-app-title" content="PWA-Kit-Retail-React-App" />
                <link
                    rel="apple-touch-icon"
                    href={getAssetUrl('static/img/global/apple-touch-icon.png')}
                />
                <link rel="manifest" href={getAssetUrl('static/manifest.json')} />

                {/* Urls for all localized versions of this page (including current page)
                            For more details on hrefLang, see https://developers.google.com/search/docs/advanced/crawling/localized-versions */}
                {SUPPORTED_LOCALES.map((locale) => (
                    <link
                        rel="alternate"
                        hrefLang={locale.id.toLowerCase()}
                        href={`${appOrigin}${getUrlWithLocale(targetLocale, {location})}`}
                        key={locale.id}
                    />
                ))}
                {/* A general locale as fallback. For example: "en" if default locale is "en-GB" */}
                <link
                    rel="alternate"
                    hrefLang={defaultLocale.slice(0, 2)}
                    href={`${appOrigin}${getUrlWithLocale(defaultLocale, {location})}`}
                />
                {/* A wider fallback for user locales that the app does not support */}
                <link rel="alternate" hrefLang="x-default" href={`${appOrigin}/`} />
            </Seo>

            <CommerceAPIProvider value={locals.api}>
                <CustomerProvider value={{customer, setCustomer}}>
                    <BasketProvider value={{basket, setBasket}}>
                        <CustomerProductListsProvider>
                            <ChakraProvider theme={theme}>{children}</ChakraProvider>
                        </CustomerProductListsProvider>
                    </BasketProvider>
                </CustomerProvider>
            </CommerceAPIProvider>
        </IntlProvider>
    )
}

AppConfig.restore = (locals = {}) => {
    // Parse the locale from the page url.
    const locale = getLocale(locals) || DEFAULT_LOCALE
    const currency = getPreferredCurrency(locale) || DEFAULT_CURRENCY

    locals.api = new CommerceAPI({...apiConfig, locale, currency})
}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {
        api: locals.api
    }
}

AppConfig.getProps = async ({api}) => {
    const localeConfig = await getLocaleConfig({
        getUserPreferredLocales: () => {
            // CONFIG: This function should return an array of preferred locales. They can be
            // derived from various sources. Below are some examples of those:
            //
            // - client side: window.navigator.languages
            // - the page URL they're on (example.com/en-GB/home)
            // - cookie (if their previous preference is saved there)
            //
            // If this function returns an empty array (e.g. there isn't locale in the page url),
            // then the app would use the default locale as the fallback.

            // NOTE: Your implementation may differ, this is jsut what we did.
            //
            // Since the CommerceAPI client already has the current `locale` set,
            // we can use it's value to load the correct messages for the application.
            // Take a look at the `app/components/_app-config` component on how the
            // preferred locale was derived.
            const {locale} = api.getConfig()

            return [locale]
        }
    })

    return {
        targetLocale: localeConfig.app.targetLocale,
        defaultLocale: localeConfig.app.defaultLocale,
        messages: localeConfig.messages
    }
}

AppConfig.propTypes = {
    children: PropTypes.node,
    targetLocale: PropTypes.string,
    defaultLocale: PropTypes.string,
    messages: PropTypes.object,
    location: PropTypes.object,
    locals: PropTypes.object
}

export default AppConfig
