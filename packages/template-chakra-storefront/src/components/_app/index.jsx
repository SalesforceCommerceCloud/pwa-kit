/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation} from 'react-router-dom'
import {Helmet} from 'react-helmet'
import {StorefrontPreview} from '@salesforce/commerce-sdk-react/components'
import {useQuery} from '@tanstack/react-query'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

// Platform Imports
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

import {
    useAccessToken,
    useCategory,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'

// Chakra
import {
    Box,
    Center,
    Spinner,

    // hooks
    useDisclosure,
    useSlotRecipe,
    useToken
} from '@chakra-ui/react'

// Local Project Components
import {DrawerMenu} from '../drawer-menu'
import {SkipNavLink, SkipNavContent} from '../skip-nav'
import {getPathWithLocale} from '../../utils/url'
import {HideOnDesktop, HideOnMobile} from '../responsive'
// import StoreLocatorModal from '../../components/store-locator-modal'
import {ListMenu, ListMenuContent} from '../list-menu'
import CheckoutHeader from '../../pages/checkout/partials/checkout-header'
import CheckoutFooter from '../../pages/checkout/partials/checkout-footer'
import Footer from '../footer'
import Header from '../header'
import OfflineBanner from '../offline-banner'
import OfflineBoundary from '../offline-boundary'
import Seo from '../seo'
import ScrollToTop from '../scroll-to-top'
import Fade from '../fade'

// Contexts
import {CurrencyProvider} from '../../contexts'
// Localization
import {IntlProvider} from 'react-intl'
// Local Project Hooks
import {AuthModal, useAuthModal} from '../../hooks/use-auth-modal'
import {AddToCartModalProvider} from '../../hooks/use-add-to-cart-modal'
import {useCurrentCustomer, useCurrentBasket} from '../../hooks'
import {useAppOrigin} from '../../hooks/use-app-origin'
import {useUpdateShopperContext} from '../../hooks/use-update-shopper-context'
import useMultiSite from '../../hooks/use-multi-site'
import {DntNotification, useDntNotification} from '../../hooks/use-dnt-notification'
import useActiveData from '../../../src/hooks/use-active-data'
import useEinstein from '../../../src/hooks/use-einstein'
import useDataCloud from '../../../src/hooks/use-datacloud'
import logger from '../../../src/utils/logger-instance'

// HOCs
import {withCommerceSdkReact} from '../with-commerce-sdk-react'

//other
import {watchOnlineStatus, flatten, isServer} from '../../utils/utils'
import {getTargetLocale, fetchTranslations} from '../../utils/locale'

const PlaceholderComponent = () => (
    <Center p="2">
        <Spinner size="lg" />
    </Center>
)

const DrawerMenuItemWithData = withCommerceSdkReact(
    ({itemComponent: ItemComponent, data, ...rest}) => (
        <Fade in={true}>
            <ItemComponent {...rest} item={data} itemComponent={DrawerMenuItemWithData} />
        </Fade>
    ),
    {
        hook: useCategory,
        queryOptions: ({item}) => ({
            parameters: {
                id: item.id
            }
        }),
        placeholder: PlaceholderComponent
    }
)

const ListMenuContentWithData = withCommerceSdkReact(
    ({data, ...rest}) => <ListMenuContent {...rest} item={data} />,
    {
        hook: useCategory,
        queryOptions: ({item}) => ({
            parameters: {
                id: item.id,
                levels: 2
            }
        }),
        placeholder: PlaceholderComponent
    }
)

const App = (props) => {
    const {children} = props
    const appConfig = getConfig()

    const {data: categoriesTree} = useCategory({
        parameters: {
            id: 'root',
            levels: 1
        }
    })

    const categories = flatten(categoriesTree || {}, 'categories')
    const {getTokenWhenReady} = useAccessToken()
    const appOrigin = useAppOrigin()
    const activeData = useActiveData()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const history = useHistory()
    const location = useLocation()
    const authModal = useAuthModal()
    const dntNotification = useDntNotification()
    const {site, locale, buildUrl} = useMultiSite()

    const [isOnline, setIsOnline] = useState(true)

    // Apply styles from the theme
    const recipe = useSlotRecipe({key: 'app'})
    const styles = recipe()
    // https://www.chakra-ui.com/docs/theming/overview#tokens-1
    const [themeColor] = useToken('colors.blue', '600')
    const {
        open: isDrawerMenuOpen,
        onOpen: onDrawerMenuOpen,
        onClose: onDrawerMenuClose
    } = useDisclosure()

    // const {
    //     isOpen: isOpenStoreLocator,
    //     onOpen: onOpenStoreLocator,
    //     onClose: onCloseStoreLocator
    // } = useDisclosure()

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
            return [locale?.id || appConfig.defaultAppLocale]
        },
        l10nConfig: site.l10n
    })

    // If the translation file exists, it'll be served directly from static folder (and won't reach this code here).
    // However, if the file is missing, the App would render a 404 page.
    const is404ForMissingTranslationFile = /\/static\/translations\/compiled\/[^.]+\.json$/.test(
        location?.pathname
    )

    // Fetch the translation message data using the target locale.
    const {data: messages} = useQuery({
        queryKey: ['static', 'translations', 'messages', targetLocale],
        queryFn: () => {
            if (is404ForMissingTranslationFile) {
                // Return early to prevent an infinite loop
                // Otherwise, it'll continue to fetch the missing translation file again
                return {}
            }
            return fetchTranslations(targetLocale, appOrigin)
        },
        enabled: isServer
    })

    // Used to conditionally render header/footer for checkout page
    const isCheckout = /\/checkout$/.test(location?.pathname)

    const {l10n} = site
    // Get the current currency to be used through out the app
    const currency = locale.preferredCurrency || l10n.defaultCurrency

    // Handle creating a new basket if there isn't one already assigned to the current
    // customer.
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()

    const updateBasket = useShopperBasketsMutation('updateBasket')
    const updateCustomerForBasket = useShopperBasketsMutation('updateCustomerForBasket')

    useEffect(() => {
        // update the basket currency if it doesn't match the current locale currency
        if (basket?.currency && basket?.currency !== currency) {
            updateBasket.mutate({
                parameters: {basketId: basket.basketId},
                body: {currency}
            })
        }
    }, [basket?.currency])

    useEffect(() => {
        // update the basket customer email
        if (
            basket &&
            customer?.isRegistered &&
            customer?.email &&
            customer?.email !== basket?.customerInfo?.email
        ) {
            updateCustomerForBasket.mutate({
                parameters: {basketId: basket.basketId},
                body: {
                    email: customer.email
                }
            })
        }
    }, [customer?.isRegistered, customer?.email, basket?.customerInfo?.email])

    useEffect(() => {
        // Listen for online status changes.
        watchOnlineStatus((isOnline) => {
            setIsOnline(isOnline)
        })
    }, [])

    // Handle updating the shopper context
    useUpdateShopperContext()

    useEffect(() => {
        // Lets automatically close the mobile navigation when the
        // location path is changed.
        onDrawerMenuClose()
    }, [location])

    const onLogoClick = () => {
        // Goto the home page.
        const path = buildUrl(appConfig.pages.home.path)

        history.push(path)

        // Close the drawer.
        onDrawerMenuClose()
    }

    const onCartClick = () => {
        const path = buildUrl('/cart')
        history.push(path)

        // Close the drawer.
        onDrawerMenuClose()
    }

    const onAccountClick = () => {
        // Link to account page if registered; Header component will show auth modal for guest users
        const path = buildUrl('/account')
        history.push(path)
    }

    const onWishlistClick = () => {
        // Link to wishlist page if registered; Header component will show auth modal for guest users
        const path = buildUrl('/account/wishlist')
        history.push(path)
    }

    const trackPage = () => {
        activeData.trackPage(site.id, locale.id, currency)
        einstein.sendViewPage(location.pathname)
        dataCloud.sendViewPage(location.pathname)
    }

    useEffect(() => {
        trackPage()
    }, [location])

    return (
        <Box className="sf-app" css={styles.container}>
            <StorefrontPreview getToken={getTokenWhenReady}>
                <Helmet>
                    {appConfig.activeDataEnabled && (
                        <script
                            src={getAssetUrl('static/head-active_data.js')}
                            id="headActiveData"
                            type="text/javascript"
                        ></script>
                    )}
                </Helmet>
                <IntlProvider
                    onError={(err) => {
                        if (!messages) {
                            // During the ssr prepass phase the messages object has not loaded, so we can suppress
                            // errors during this time.
                            return
                        }
                        if (err.code === 'MISSING_TRANSLATION') {
                            // NOTE: Remove the console error for missing translations during development,
                            // as we knew translations would be added later.
                            logger.warn('Missing translation', {
                                namespace: 'App.IntlProvider',
                                additionalProperties: {
                                    errorMessage: err.message
                                }
                            })
                            return
                        }
                        throw err
                    }}
                    locale={targetLocale}
                    messages={messages}
                    // For react-intl, the _default locale_ refers to the locale that the inline `defaultMessage`s are written for.
                    // NOTE: if you update this value, please also update the following npm scripts in `template-chakra-storefront/package.json`:
                    // - "extract-default-translations"
                    // - "compile-translations:pseudo"
                    defaultLocale={appConfig.defaultAppLocale}
                >
                    <CurrencyProvider currency={currency}>
                        <Seo>
                            <meta name="theme-color" content={themeColor} />
                            <meta
                                name="apple-mobile-web-app-title"
                                content={appConfig.defaultSiteTitle}
                            />

                            {/* Urls for all localized versions of this page (including current page)
                                For more details on hrefLang, see
                                https://developers.google.com/search/docs/advanced/crawling/localized-versions
                             */}
                            {site.l10n?.supportedLocales.map((locale) => (
                                <link
                                    rel="alternate"
                                    hrefLang={locale.id.toLowerCase()}
                                    href={`${appOrigin}${getPathWithLocale(locale.id, buildUrl, {
                                        location: {
                                            ...location,
                                            search: ''
                                        }
                                    })}`}
                                    key={locale.id}
                                />
                            ))}
                            {/* A general locale as fallback. For example: "en" if default locale is "en-GB" */}
                            <link
                                rel="alternate"
                                hrefLang={site.l10n.defaultLocale.slice(0, 2)}
                                href={`${appOrigin}${getPathWithLocale(locale.id, buildUrl, {
                                    location: {
                                        ...location,
                                        search: ''
                                    }
                                })}`}
                            />
                            {/* A wider fallback for user locales that the app does not support */}
                            <link rel="alternate" hrefLang="x-default" href={`${appOrigin}/`} />
                        </Seo>

                        <ScrollToTop />

                        <Box id="app" display="flex" flexDirection="column" flex={1}>
                            <SkipNavLink zIndex="skipLink">Skip to Content</SkipNavLink>
                            {/*Disable until you move the extesion store locator code in*/}
                            {/*<StoreLocatorModal*/}
                            {/*    isOpen={isOpenStoreLocator}*/}
                            {/*    onClose={onCloseStoreLocator}*/}
                            {/*/>*/}
                            <Box css={styles.headerWrapper}>
                                {!isCheckout ? (
                                    <>
                                        <Header
                                            onMenuClick={onDrawerMenuOpen}
                                            onLogoClick={onLogoClick}
                                            onMyCartClick={onCartClick}
                                            onMyAccountClick={onAccountClick}
                                            onWishlistClick={onWishlistClick}
                                        >
                                            <HideOnDesktop>
                                                <DrawerMenu
                                                    isOpen={isDrawerMenuOpen}
                                                    onClose={onDrawerMenuClose}
                                                    onLogoClick={onLogoClick}
                                                    root={
                                                        categories?.[
                                                            appConfig.categoryNav
                                                                .defaultRootCategory
                                                        ]
                                                    }
                                                    itemsKey="categories"
                                                    itemsCountKey="onlineSubCategoriesCount"
                                                    itemComponent={DrawerMenuItemWithData}
                                                />
                                            </HideOnDesktop>
                                            <HideOnMobile>
                                                <ListMenu
                                                    root={
                                                        categories?.[
                                                            appConfig.categoryNav
                                                                .defaultRootCategory
                                                        ]
                                                    }
                                                    itemsKey="categories"
                                                    itemsCountKey="onlineSubCategoriesCount"
                                                    contentComponent={ListMenuContentWithData}
                                                />
                                            </HideOnMobile>
                                        </Header>
                                    </>
                                ) : (
                                    <CheckoutHeader />
                                )}
                            </Box>
                            {!isOnline && <OfflineBanner />}
                            <AddToCartModalProvider>
                                <SkipNavContent
                                    css={{
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
                                <DntNotification {...dntNotification} />
                            </AddToCartModalProvider>
                        </Box>
                    </CurrencyProvider>
                </IntlProvider>
            </StorefrontPreview>
        </Box>
    )
}

App.propTypes = {
    children: PropTypes.node
}

export default App
