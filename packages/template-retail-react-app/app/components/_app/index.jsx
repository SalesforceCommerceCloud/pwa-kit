/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation} from 'react-router-dom'
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {useQueries} from '@tanstack/react-query'
import {
    useAccessToken,
    useCategory,
    useCommerceApi,
    useCustomerType,
    useCustomerBaskets,
    useShopperBasketsMutation
} from 'commerce-sdk-react-preview'
import * as queryKeyHelpers from 'commerce-sdk-react-preview/hooks/ShopperProducts/queryKeyHelpers'
// Chakra
import {Box, useDisclosure, useStyleConfig} from '@chakra-ui/react'
import {SkipNavLink, SkipNavContent} from '@chakra-ui/skip-nav'

// Contexts
import {CurrencyProvider} from '../../contexts'

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
import {AuthModal, useAuthModal} from '../../hooks/use-auth-modal'
import {AddToCartModalProvider} from '../../hooks/use-add-to-cart-modal'
import useMultiSite from '../../hooks/use-multi-site'
import {useCurrentCustomer} from '../../hooks/use-current-customer'

// Localization
import {IntlProvider} from 'react-intl'

// Others
import {
    watchOnlineStatus,
    flatten,
    mergeMatchedItems,
    isServer,
    resolveLocaleFromUrl
} from '../../utils/utils'
import {getTargetLocale, fetchTranslations} from '../../utils/locale'
import {
    DEFAULT_SITE_TITLE,
    HOME_HREF,
    THEME_COLOR,
    CAT_MENU_DEFAULT_NAV_SSR_DEPTH,
    CAT_MENU_DEFAULT_ROOT_CATEGORY,
    DEFAULT_LOCALE
} from '../../constants'

import Seo from '../seo'
import {resolveSiteFromUrl} from '../../utils/site-utils'

const onClient = typeof window !== 'undefined'

/* 
The categories tree can be really large! For performance reasons,
we only load the level 0 categories on server side, and load the rest
on client side to reduce SSR page size.
*/
const useLazyLoadCategories = () => {
    const itemsKey = 'categories'

    const levelZeroCategoriesQuery = useCategory({
        parameters: {id: CAT_MENU_DEFAULT_ROOT_CATEGORY, levels: CAT_MENU_DEFAULT_NAV_SSR_DEPTH}
    })

    const ids = levelZeroCategoriesQuery.data?.[itemsKey].map((category) => category.id)
    const queries = useCategoryBulk(ids, {
        enabled: onClient && ids?.length > 0
    })
    const dataArray = queries.map((query) => query.data).filter(Boolean)
    const isLoading = queries.some((query) => query.isLoading)
    const isError = queries.some((query) => query.isError)
    return {
        isLoading,
        isError,
        data: {
            ...levelZeroCategoriesQuery.data,
            [itemsKey]: mergeMatchedItems(
                levelZeroCategoriesQuery.data?.categories || [],
                dataArray
            )
        }
    }
}
// This value represents the max age in milliseconds a customer can be before they are
// no longer considered a "new" customer.
// E.g. If a customers creation date is older than 2 seconds it will no longer be considered
// a new customer.
const NEW_CUSTOMER_MAX_AGE = 2 * 1000 // 2 seconds in milliseconds
const App = (props) => {
    const {children, targetLocale = DEFAULT_LOCALE, messages = {}} = props
    const {data: categoriesTree} = useLazyLoadCategories()

    const prevAuthType = useRef()

    const categories = flatten(categoriesTree || {}, 'categories')

    const appOrigin = getAppOrigin()

    const history = useHistory()
    const location = useLocation()
    const authModal = useAuthModal()
    const {isRegistered, customerType} = useCustomerType()
    const {site, locale, buildUrl} = useMultiSite()

    const [isOnline, setIsOnline] = useState(true)
    const styles = useStyleConfig('App')

    const {isOpen, onOpen, onClose} = useDisclosure()

    // Used to conditionally render header/footer for checkout page
    const isCheckout = /\/checkout$/.test(location?.pathname)

    const {l10n} = site
    // Get the current currency to be used through out the app
    const currency = locale.preferredCurrency || l10n.defaultCurrency

    // Handle creating a new basket if there isn't one already assigned to the current
    // customer.
    const {data: customer} = useCurrentCustomer()

    const {data: baskets} = useCustomerBaskets(
        {parameters: {customerId: customer.customerId}},
        {enabled: !!customer.customerId && !isServer, keepPreviousData: true}
    )
    const createBasket = useShopperBasketsMutation('createBasket')
    const updateBasket = useShopperBasketsMutation('updateBasket')
    const mergeBasket = useShopperBasketsMutation('mergeBasket')

    useEffect(() => {
        // Create a new basket if the current customer doesn't have one.
        if (baskets?.total === 0) {
            createBasket.mutate({
                body: {}
            })
        }
        // update the basket currency if it doesn't match the current locale currency
        if (baskets?.baskets?.[0]?.currency && baskets.baskets[0].currency !== currency) {
            updateBasket.mutate({
                parameters: {basketId: baskets.baskets[0].basketId},
                body: {currency}
            })
        }
    }, [baskets])

    useEffect(() => {
        const lastLoginTimeStamp = Date.parse(customer.lastLoginTime)
        const creationTimeStamp = Date.parse(customer.creationDate)
        const isNewCustomer = lastLoginTimeStamp - creationTimeStamp < NEW_CUSTOMER_MAX_AGE

        // Only call merge when there are items in the guest basket and you are
        // a returning customer.
        // new customer will be merged automatically from the backend
        const shouldMerge =
            customerType === 'registered' &&
            prevAuthType.current === 'guest' &&
            !isNewCustomer &&
            baskets?.baskets?.[0]?.productItems?.length > 0
        if (shouldMerge) {
            mergeBasket.mutate({
                headers: {
                    // This is not required since the request has no body
                    // but CommerceAPI throws a '419 - Unsupported Media Type' error if this header is removed.
                    'Content-Type': 'application/json'
                },
                parameters: {
                    createDestinationBasket: true
                }
            })
        }
        // Update the current `authType` value.
        prevAuthType.current = customerType
    }, [customerType])

    useEffect(() => {
        // Listen for online status changes.
        watchOnlineStatus((isOnline) => {
            setIsOnline(isOnline)
        })
        prevAuthType.current = customerType
    }, [])

    useEffect(() => {
        // Lets automatically close the mobile navigation when the
        // location path is changed.
        onClose()
    }, [location])

    const onLogoClick = () => {
        // Goto the home page.
        const path = buildUrl(HOME_HREF)

        history.push(path)

        // Close the drawer.
        onClose()
    }

    const onCartClick = () => {
        const path = buildUrl('/cart')
        history.push(path)

        // Close the drawer.
        onClose()
    }

    const onAccountClick = () => {
        // Link to account page for registered customer, open auth modal otherwise
        if (isRegistered) {
            const path = buildUrl('/account')
            history.push(path)
        } else {
            // if they already are at the login page, do not show login modal
            if (new RegExp(`^/login$`).test(location.pathname)) return
            authModal.onOpen()
        }
    }

    const onWishlistClick = () => {
        const path = buildUrl('/account/wishlist')
        history.push(path)
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
                messages={messages}
                // For react-intl, the _default locale_ refers to the locale that the inline `defaultMessage`s are written for.
                // NOTE: if you update this value, please also update the following npm scripts in `template-retail-react-app/package.json`:
                // - "extract-default-translations"
                // - "compile-translations:pseudo"
                defaultLocale={DEFAULT_LOCALE}
            >
                <CurrencyProvider currency={currency}>
                    <Seo>
                        <meta name="theme-color" content={THEME_COLOR} />
                        <meta name="apple-mobile-web-app-title" content={DEFAULT_SITE_TITLE} />
                        <link
                            rel="apple-touch-icon"
                            href={getAssetUrl('static/img/global/apple-touch-icon.png')}
                        />
                        <link rel="manifest" href={getAssetUrl('static/manifest.json')} />

                        {/* Urls for all localized versions of this page (including current page)
                            For more details on hrefLang, see https://developers.google.com/search/docs/advanced/crawling/localized-versions */}
                        {site.l10n?.supportedLocales.map((locale) => (
                            <link
                                rel="alternate"
                                hrefLang={locale.id.toLowerCase()}
                                href={`${appOrigin}${buildUrl(location.pathname)}`}
                                key={locale.id}
                            />
                        ))}
                        {/* A general locale as fallback. For example: "en" if default locale is "en-GB" */}
                        <link
                            rel="alternate"
                            hrefLang={site.l10n.defaultLocale.slice(0, 2)}
                            href={`${appOrigin}${buildUrl(location.pathname)}`}
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
                                            root={categories?.[CAT_MENU_DEFAULT_ROOT_CATEGORY]}
                                        />
                                    </HideOnDesktop>

                                    <HideOnMobile>
                                        <ListMenu
                                            root={categories?.[CAT_MENU_DEFAULT_ROOT_CATEGORY]}
                                        />
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
                                    <OfflineBoundary isOnline={false}>{children}</OfflineBoundary>
                                </Box>
                            </SkipNavContent>

                            {!isCheckout ? <Footer /> : <CheckoutFooter />}

                            <AuthModal {...authModal} />
                        </AddToCartModalProvider>
                    </Box>
                </CurrencyProvider>
            </IntlProvider>
        </Box>
    )
}

App.shouldGetProps = () => {
    // In this case, we only want to fetch data for the app once, on the server.
    return typeof window === 'undefined'
}

App.getProps = async ({res}) => {
    const site = resolveSiteFromUrl(res.locals.originalUrl)
    const locale = resolveLocaleFromUrl(res.locals.originalUrl)
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
            return [locale?.id]
        },
        l10nConfig
    })
    const messages = await fetchTranslations(targetLocale)

    return {
        targetLocale,
        messages
    }
}

App.propTypes = {
    children: PropTypes.node,
    targetLocale: PropTypes.string,
    messages: PropTypes.object
}

/**
 * a hook that parallelly and individually fetches category based on the given ids
 * @param ids - list of categories ids to fetch
 * @param queryOptions -  react query options
 * @return list of react query results
 */
export const useCategoryBulk = (ids = [], queryOptions) => {
    const api = useCommerceApi()
    const {getTokenWhenReady} = useAccessToken()
    const {
        app: {commerceAPI}
    } = getConfig()
    const {
        parameters: {organizationId}
    } = commerceAPI
    const {site} = useMultiSite()

    const queries = ids.map((id) => {
        return {
            queryKey: queryKeyHelpers.getCategory.queryKey({
                id,
                levels: 2,
                organizationId,
                siteId: site.id
            }),
            queryFn: async () => {
                const token = await getTokenWhenReady()
                const res = await api.shopperProducts.getCategory({
                    parameters: {id, levels: 2},
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                })
                return res
            },
            ...queryOptions,
            enabled: queryOptions.enabled !== false && Boolean(id)
        }
    })
    const res = useQueries({queries})
    return res
}

export default App
