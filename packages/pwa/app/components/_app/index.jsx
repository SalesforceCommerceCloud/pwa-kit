/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation} from 'react-router-dom'
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

// Chakra
import {Box, useDisclosure, useStyleConfig} from '@chakra-ui/react'
import {SkipNavLink, SkipNavContent} from '@chakra-ui/skip-nav'

// Contexts
import {CategoriesProvider, CurrencyProvider} from '../../contexts'

// Local Project Components
import Header from '../../components/header'
import OfflineBanner from '../../components/offline-banner'
import OfflineBoundary from '../../components/offline-boundary'
import ScrollToTop from '../../components/scroll-to-top'
import Footer from '../../components/footer'
import CheckoutHeader from '../../pages/checkout/partials/checkout-header'
import CheckoutFooter from '../../pages/checkout/partials/checkout-footer'
import DrawerMenu from '../drawer-menu'
import ListMenu from '../list-menu'
import {HideOnDesktop, HideOnMobile} from '../responsive'

// Hooks
import useShopper from '../../commerce-api/hooks/useShopper'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {AuthModal, useAuthModal} from '../../hooks/use-auth-modal'
import {AddToCartModalProvider} from '../../hooks/use-add-to-cart-modal'

// Localization
import {defineMessages, IntlProvider} from 'react-intl'

// Others
import {watchOnlineStatus, flatten} from '../../utils/utils'
import {homeUrlBuilder, getUrlWithLocale} from '../../utils/url'
import {getLocaleConfig, getPreferredCurrency} from '../../utils/locale'
import {DEFAULT_CURRENCY, HOME_HREF, SUPPORTED_LOCALES} from '../../constants'

import Seo from '../seo'
import useWishlist from '../../hooks/use-wishlist'

const DEFAULT_NAV_DEPTH = 3
const DEFAULT_ROOT_CATEGORY = 'root'

/**
 *  Default messages for the supported locales.
 *  NOTE: Because the messages are statically analyzed, we have to maintain the list of locales asynchronously
 *  to those in the package.json.
 *  `locale` parameter format for OCAPI and Commerce API: <language code>-<country code>
 *  https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/Localization.html
 *  */
export const defaultLocaleMessages = defineMessages({
    'en-GB': {defaultMessage: 'English (United Kingdom)'},
    'fr-FR': {defaultMessage: 'French (France)'},
    'it-IT': {defaultMessage: 'Italian (Italy)'},
    'zh-CN': {defaultMessage: 'Chinese (China)'},
    'ja-JP': {defaultMessage: 'Japanese (Japan)'}
})

const App = (props) => {
    const {children, targetLocale, defaultLocale, messages, categories: allCategories = {}} = props

    const appOrigin = getAppOrigin()

    const history = useHistory()
    const location = useLocation()
    const authModal = useAuthModal()
    const customer = useCustomer()
    const [isOnline, setIsOnline] = useState(true)
    const styles = useStyleConfig('App')

    const {isOpen, onOpen, onClose} = useDisclosure()

    // Used to conditionally render header/footer for checkout page
    const isCheckout = /\/checkout$/.test(location?.pathname)

    // Get the current currency to be used throught the app
    const currency = getPreferredCurrency(targetLocale) || DEFAULT_CURRENCY

    // Set up customer and basket
    useShopper({currency})

    const wishlist = useWishlist()
    useEffect(() => {
        if (!customer.isInitialized) {
            return
        }
        if (customer.isRegistered) {
            wishlist.init()
        }
        if (customer.isGuest) {
            wishlist.reset()
        }
    }, [customer.authType])

    useEffect(() => {
        // Listen for online status changes.
        watchOnlineStatus((isOnline) => {
            setIsOnline(isOnline)
        })
    }, [])

    useEffect(() => {
        // Lets automatically close the mobile navigation when the
        // location path is changed.
        onClose()
    }, [location])

    const onLogoClick = () => {
        // Goto the home page.
        history.push(homeUrlBuilder(HOME_HREF, targetLocale))

        // Close the drawer.
        onClose()
    }

    const onCartClick = () => {
        // Goto the home page.
        history.push(`/${targetLocale}/cart`)

        // Close the drawer.
        onClose()
    }

    const onAccountClick = () => {
        // Link to account page for registered customer, open auth modal otherwise
        if (customer.isRegistered) {
            history.push(`/${targetLocale}/account`)
        } else {
            // if they already are at the login page, do not show login modal
            if (new RegExp(`^/${targetLocale}/login$`).test(location.pathname)) return
            authModal.onOpen()
        }
    }

    const onWishlistClick = () => {
        history.push(`/${targetLocale}/account/wishlist`)
    }

    return (
        <Box className="sf-app" {...styles.container}>
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
                <CategoriesProvider categories={allCategories}>
                    <CurrencyProvider currency={currency}>
                        <Seo>
                            <meta name="theme-color" content="#0288a7" />
                            <meta
                                name="apple-mobile-web-app-title"
                                content="PWA-Kit-Retail-React-App"
                            />
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
                                    href={`${appOrigin}${getUrlWithLocale(locale.id, {location})}`}
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

                        <ScrollToTop />

                        <Box id="app" display="flex" flexDirection="column" flex={1}>
                            <SkipNavLink zIndex="skipLink">Skip to Content</SkipNavLink>

                            <Box {...styles.headerWrapper}>
                                {!isCheckout ? (
                                    <Header
                                        onMenuClick={onOpen}
                                        onLogoClick={onLogoClick}
                                        onMyCartClick={onCartClick}
                                        onMyAccountClick={onAccountClick}
                                        onWishlistClick={onWishlistClick}
                                    >
                                        <HideOnDesktop>
                                            <DrawerMenu
                                                isOpen={isOpen}
                                                onClose={onClose}
                                                onLogoClick={onLogoClick}
                                                root={allCategories[DEFAULT_ROOT_CATEGORY]}
                                            />
                                        </HideOnDesktop>

                                        <HideOnMobile>
                                            <ListMenu root={allCategories[DEFAULT_ROOT_CATEGORY]} />
                                        </HideOnMobile>
                                    </Header>
                                ) : (
                                    <CheckoutHeader />
                                )}
                            </Box>

                            {!isOnline && <OfflineBanner />}
                            <AddToCartModalProvider>
                                <SkipNavContent
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flex: 1,
                                        outline: 0
                                    }}
                                >
                                    <Box
                                        as="main"
                                        id="app-main"
                                        role="main"
                                        display="flex"
                                        flexDirection="column"
                                        flex="1"
                                    >
                                        <OfflineBoundary isOnline={false}>
                                            {children}
                                        </OfflineBoundary>
                                    </Box>
                                </SkipNavContent>

                                {!isCheckout ? <Footer /> : <CheckoutFooter />}

                                <AuthModal {...authModal} />
                            </AddToCartModalProvider>
                        </Box>
                    </CurrencyProvider>
                </CategoriesProvider>
            </IntlProvider>
        </Box>
    )
}

App.shouldGetProps = () => {
    // In this case, we only want to fetch data for the app once, on the server.
    return typeof window === 'undefined'
}

App.getProps = async ({api}) => {
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

    // Login as `guest` to get session.
    await api.auth.login()

    // Get the root category, this will be used for things like the navigation.
    const rootCategory = await api.shopperProducts.getCategory({
        parameters: {
            id: DEFAULT_ROOT_CATEGORY,
            levels: DEFAULT_NAV_DEPTH,
            locale: localeConfig.app.targetLocale
        }
    })

    if (rootCategory.isError) {
        const message =
            rootCategory.title === 'Unsupported Locale'
                ? `

🚫 This page isn’t working.
It looks like the locale ‘${rootCategory.locale}’ hasn’t been set up, yet.
You can either follow this doc, https://sfdc.co/B4Z1m to enable it in business manager or define a different locale with the instructions for Localization in the README file.
`
                : rootCategory.detail
        throw new Error(message)
    }

    // Flatten the root so we can easily access all the categories throughout
    // the application.
    const categories = flatten(rootCategory, 'categories')

    return {
        targetLocale: localeConfig.app.targetLocale,
        defaultLocale: localeConfig.app.defaultLocale,
        messages: localeConfig.messages,
        categories: categories
    }
}

App.propTypes = {
    children: PropTypes.node,
    targetLocale: PropTypes.string,
    defaultLocale: PropTypes.string,
    messages: PropTypes.object,
    categories: PropTypes.object
}

export default App
