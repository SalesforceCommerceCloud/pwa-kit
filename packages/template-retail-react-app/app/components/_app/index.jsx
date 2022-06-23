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
import useSite from '../../hooks/use-site'
import useLocale from '../../hooks/use-locale'
import useWishlist from '../../hooks/use-wishlist'

// Localization
import {IntlProvider} from 'react-intl'

// Others
import {watchOnlineStatus, flatten} from '../../utils/utils'
import {homeUrlBuilder, getPathWithLocale, buildPathWithUrlConfig} from '../../utils/url'
import {getTargetLocale, fetchTranslations} from '../../utils/locale'
import {DEFAULT_SITE_TITLE, HOME_HREF, THEME_COLOR} from '../../constants'

import Seo from '../seo'
import {resolveSiteFromUrl} from '../../utils/site-utils'

import {getLayout as getSiteLayout} from "../../layouts/site-layout";

const DEFAULT_NAV_DEPTH = 3
const DEFAULT_ROOT_CATEGORY = 'root'

const App = (props) => {
    const {children, targetLocale, messages, categories: allCategories = {}} = props

    const locale = useLocale()

    const styles = useStyleConfig('App')

    // Get the current currency to be used through out the app
    const currency = locale.preferredCurrency || l10n.defaultCurrency

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
                messages={messages}
                // For react-intl, the _default locale_ refers to the locale that the inline `defaultMessage`s are written for.
                // NOTE: if you update this value, please also update the following npm scripts in `template-retail-react-app/package.json`:
                // - "extract-default-translations"
                // - "compile-translations:pseudo"
                defaultLocale="en-US"
            >
                <CategoriesProvider categories={allCategories}>
                    <CurrencyProvider currency={currency}>
                        {children}
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

App.getProps = async (props) => {
    const {api, res} = props

    const site = resolveSiteFromUrl(res.locals.originalUrl)
    const l10nConfig = site.l10n
    const targetLocale = getTargetLocale({
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

            // NOTE: Your implementation may differ, this is just what we did.
            //
            // Since the CommerceAPI client already has the current `locale` set,
            // we can use it's value to load the correct messages for the application.
            // Take a look at the `app/components/_app-config` component on how the
            // preferred locale was derived.
            const {locale} = api.getConfig()

            return [locale]
        },
        l10nConfig
    })
    const messages = await fetchTranslations(targetLocale)

    // Login as `guest` to get session.
    await api.auth.login()

    // Get the root category, this will be used for things like the navigation.
    const rootCategory = await api.shopperProducts.getCategory({
        parameters: {
            id: DEFAULT_ROOT_CATEGORY,
            levels: DEFAULT_NAV_DEPTH
        }
    })

    if (rootCategory.isError) {
        const message =
            rootCategory.title === 'Unsupported Locale'
                ? `
It looks like the locale “${rootCategory.locale}” isn’t set up, yet. The locale settings in your package.json must match what is enabled in your Business Manager instance.
Learn more with our localization guide. https://sfdc.co/localization-guide
`
                : rootCategory.detail
        throw new Error(message)
    }

    // Flatten the root so we can easily access all the categories throughout
    // the application.
    const categories = flatten(rootCategory, 'categories')

    return {
        targetLocale,
        messages,
        categories,
        config: res?.locals?.config
    }
}

App.getLayout = getSiteLayout

App.propTypes = {
    children: PropTypes.node,
    targetLocale: PropTypes.string,
    messages: PropTypes.object,
    categories: PropTypes.object,
    config: PropTypes.object
}

export default App
