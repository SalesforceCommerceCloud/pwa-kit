/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, useMemo} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation} from 'react-router-dom'
import {StorefrontPreview} from '@salesforce/commerce-sdk-react/components'
import {getAssetUrl, getRouterBasePath} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'
import {useQuery} from '@tanstack/react-query'
import {
    useAccessToken,
    useCategory,
    useShopperBasketsMutation,
    useUsid
} from '@salesforce/commerce-sdk-react'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

// Chakra
import {SkipNavContent, SkipNavLink} from '@chakra-ui/skip-nav'
import {
    Box,
    Center,
    Fade,
    Spinner,
    useDisclosure,
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Contexts
import {CurrencyProvider} from '@salesforce/retail-react-app/app/contexts'

// Local Project Components
import AboveHeader from '@salesforce/retail-react-app/app/components/_app/partials/above-header'
import {DrawerMenu} from '@salesforce/retail-react-app/app/components/drawer-menu'
import Footer from '@salesforce/retail-react-app/app/components/footer'
import Header from '@salesforce/retail-react-app/app/components/header'
import Island from '@salesforce/retail-react-app/app/components/island'
import {ListMenu, ListMenuContent} from '@salesforce/retail-react-app/app/components/list-menu'
import OfflineBanner from '@salesforce/retail-react-app/app/components/offline-banner'
import OfflineBoundary from '@salesforce/retail-react-app/app/components/offline-boundary'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import ScrollToTop from '@salesforce/retail-react-app/app/components/scroll-to-top'
import {StoreLocatorModal} from '@salesforce/retail-react-app/app/components/store-locator'
import CheckoutFooter from '@salesforce/retail-react-app/app/pages/checkout/partials/checkout-footer'
import CheckoutHeader from '@salesforce/retail-react-app/app/pages/checkout/partials/checkout-header'

// Hooks
import {AddToCartModalProvider} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import {AuthModal, useAuthModal} from '@salesforce/retail-react-app/app/hooks/use-auth-modal'
import {BonusProductSelectionModalProvider} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {
    DntNotification,
    useDntNotification
} from '@salesforce/retail-react-app/app/hooks/use-dnt-notification'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useStoreLocatorModal} from '@salesforce/retail-react-app/app/hooks/use-store-locator'
import {useUpdateShopperContext} from '@salesforce/retail-react-app/app/hooks/use-update-shopper-context'

// HOCs
import {withCommerceSdkReact} from '@salesforce/retail-react-app/app/components/with-commerce-sdk-react/with-commerce-sdk-react'

import {PageDesignerProvider} from '@salesforce/commerce-sdk-react/page-designer'
import PageDesignerInit from '@salesforce/retail-react-app/app/components/page-designer-init'

// Localization
import {IntlProvider} from 'react-intl'

// Others
import {
    CAT_MENU_DEFAULT_NAV_SSR_DEPTH,
    CAT_MENU_DEFAULT_ROOT_CATEGORY,
    DEFAULT_LOCALE,
    DEFAULT_SITE_TITLE,
    HOME_HREF,
    STORE_LOCATOR_IS_ENABLED,
    THEME_COLOR
} from '@salesforce/retail-react-app/app/constants'
import {fetchTranslations, getTargetLocale} from '@salesforce/retail-react-app/app/utils/locale'
import {flatten, isServer, watchOnlineStatus} from '@salesforce/retail-react-app/app/utils/utils'

import Seo from '@salesforce/retail-react-app/app/components/seo'
import ShopperAgent from '@salesforce/retail-react-app/app/components/shopper-agent'
import {initializeRegistry} from '@salesforce/retail-react-app/app/page-designer/registry'

// Initialize registry synchronously at module load time so components are available during SSR
initializeRegistry()
import {getCommerceAgentConfig} from '@salesforce/retail-react-app/app/utils/config-utils'
import {getPathWithLocale} from '@salesforce/retail-react-app/app/utils/url'
import {useShopperAgent} from '@salesforce/retail-react-app/app/hooks/use-shopper-agent'

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
    ({data, ...rest}) => (
        <Fade in={true}>
            <ListMenuContent {...rest} item={data} />
        </Fade>
    ),
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
    const {data: categoriesTree} = useCategory({
        parameters: {id: CAT_MENU_DEFAULT_ROOT_CATEGORY, levels: CAT_MENU_DEFAULT_NAV_SSR_DEPTH}
    })
    const categories = flatten(categoriesTree || {}, 'categories')
    const {getTokenWhenReady} = useAccessToken()
    const {usid} = useUsid()
    const appOrigin = useAppOrigin()
    const activeData = useActiveData()
    const history = useHistory()
    const location = useLocation()
    const authModal = useAuthModal()
    const dntNotification = useDntNotification()
    const {site, locale, buildUrl} = useMultiSite()
    const {
        isOpen: isStoreLocatorOpen,
        onOpen: onOpenStoreLocator,
        onClose: onCloseStoreLocator
    } = useStoreLocatorModal()
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED
    const {req} = useServerContext()

    const [isOnline, setIsOnline] = useState(true)
    const styles = useStyleConfig('App')
    const {isOpen, onOpen, onClose} = useDisclosure()

    // Determine Page Designer mode from URL - use req for server-side detection
    const pageDesignerMode = useMemo(() => {
        const queryParams = location?.search || ''
        if (queryParams.includes('mode=EDIT')) return 'EDIT'
        else if (queryParams.includes('mode=PREVIEW')) return 'PREVIEW'
        return undefined
    }, [req?.url])

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
            return [locale?.id || DEFAULT_LOCALE]
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
        queryKey: ['app', 'translations', 'messages', targetLocale],
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
    const {data: basket, dataUpdatedAt: basketQueryLastUpdateTime} = useCurrentBasket()
    const config = getConfig()

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

    const commerceAgentConfiguration = useMemo(() => {
        return getCommerceAgentConfig()
    }, [config.app.commerceAgent])

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
        // Link to account page if registered; Header component will show auth modal for guest users
        const path = buildUrl('/account')
        history.push(path)
    }

    const onWishlistClick = () => {
        // Link to wishlist page if registered; Header component will show auth modal for guest users
        const path = buildUrl('/account/wishlist')
        history.push(path)
    }

    const {actions: shopperAgentActions} = useShopperAgent()

    const trackPage = () => {
        activeData.trackPage(site.id, locale.id, currency)
    }

    useEffect(() => {
        trackPage()
    }, [location])

    const getHrefForLocale = (localeId) =>
        `${appOrigin}${getRouterBasePath()}${getPathWithLocale(localeId, buildUrl, {
            location: {...location, search: ''}
        })}`

    return (
        <Box className="sf-app" {...styles.container}>
            <StorefrontPreview getToken={getTokenWhenReady} getBasePath={getRouterBasePath}>
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
                                    href={getHrefForLocale(locale.id)}
                                    key={locale.id}
                                />
                            ))}
                            {/* A general locale as fallback. For example: "en" if default locale is "en-GB" */}
                            <link
                                rel="alternate"
                                hrefLang={site.l10n.defaultLocale.slice(0, 2)}
                                href={getHrefForLocale(locale.id)}
                            />
                            {/* A wider fallback for user locales that the app does not support */}
                            <link rel="alternate" hrefLang="x-default" href={`${appOrigin}/`} />
                        </Seo>

                        {commerceAgentConfiguration?.enabled === 'true' && (
                            <ShopperAgent
                                commerceAgentConfiguration={commerceAgentConfiguration}
                                basketDoneLoading={basketQueryLastUpdateTime > 0}
                            />
                        )}

                        <ScrollToTop />

                        <Box id="app" display="flex" flexDirection="column" flex={1}>
                            <SkipNavLink zIndex="skipLink">Skip to Content</SkipNavLink>
                            {storeLocatorEnabled && (
                                <StoreLocatorModal
                                    isOpen={isStoreLocatorOpen}
                                    onClose={onCloseStoreLocator}
                                />
                            )}
                            <Island hydrateOn={'visible'}>
                                <Box {...styles.headerWrapper}>
                                    {!isCheckout ? (
                                        <>
                                            <AboveHeader />
                                            <Header
                                                onMenuClick={onOpen}
                                                onLogoClick={onLogoClick}
                                                onMyCartClick={onCartClick}
                                                onMyAccountClick={onAccountClick}
                                                onWishlistClick={onWishlistClick}
                                                onStoreLocatorClick={onOpenStoreLocator}
                                                onAgentClick={shopperAgentActions.open}
                                            >
                                                <HideOnDesktop>
                                                    <DrawerMenu
                                                        isOpen={isOpen}
                                                        onClose={onClose}
                                                        onLogoClick={onLogoClick}
                                                        root={
                                                            categories?.[
                                                                CAT_MENU_DEFAULT_ROOT_CATEGORY
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
                                                                CAT_MENU_DEFAULT_ROOT_CATEGORY
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
                            </Island>
                            {!isOnline && <OfflineBanner />}
                            <AddToCartModalProvider>
                                <BonusProductSelectionModalProvider>
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
                                                <PageDesignerProvider
                                                    clientId="pwa-kit-client"
                                                    targetOrigin="*"
                                                    usid={usid}
                                                    mode={pageDesignerMode}
                                                >
                                                    <PageDesignerInit />
                                                    {children}
                                                </PageDesignerProvider>
                                            </OfflineBoundary>
                                        </Box>
                                    </SkipNavContent>

                                    <Island hydrateOn={'visible'}>
                                        {!isCheckout ? <Footer /> : <CheckoutFooter />}
                                    </Island>

                                    <AuthModal {...authModal} />
                                    <DntNotification {...dntNotification} />
                                </BonusProductSelectionModalProvider>
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
