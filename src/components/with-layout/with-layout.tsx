/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import React, {useState, useEffect} from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import {Helmet} from 'react-helmet'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

// Platform Imports
import {getStaticAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {useCategory, useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

// Chakra
import {Box, Center, Fade, Spinner, useDisclosure, useStyleConfig} from '@chakra-ui/react'
import {SkipNavLink, SkipNavContent} from '@chakra-ui/skip-nav'

// Local Project Components
import {DrawerMenu} from '../drawer-menu'
import {HideOnDesktop, HideOnMobile} from '../responsive'
import {ListMenu, ListMenuContent} from '../list-menu'
import {withCommerceSdkReactHookData} from '../with-commerce-sdk-react-hook-data'
import AboveHeader from '../above-header'
import CheckoutHeader from '../../pages/checkout/partials/checkout-header'
import CheckoutFooter from '../../pages/checkout/partials/checkout-footer'
import Footer from '../footer'
import Header from '../header'
import OfflineBanner from '../offline-banner'
import OfflineBoundary from '../offline-boundary'
import Seo from '../seo'
import ScrollToTop from '../scroll-to-top'

// Local Project Hooks
import {AuthModal, useAuthModal} from '../../hooks/use-auth-modal'
import {AddToCartModalProvider} from '../../hooks/use-add-to-cart-modal'
import {useConfig} from '../../hooks/use-extension-config'
import {useCurrentCustomer} from '../../hooks/use-current-customer'
import {useCurrentBasket} from '../../hooks/use-current-basket'
import {watchOnlineStatus, flatten} from '../../utils/utils'
import useActiveData from '../../hooks/use-active-data'
import useMultiSite from '../../hooks/use-multi-site'

// CONSTANTS
import {
    DEFAULT_SITE_TITLE,
    HOME_HREF,
    THEME_COLOR,
    CAT_MENU_DEFAULT_NAV_SSR_DEPTH,
    CAT_MENU_DEFAULT_ROOT_CATEGORY
} from '../../constants'

// Define a type for the HOC props
type WithAppLayoutProps = React.ComponentPropsWithoutRef<any>

const PlaceholderComponent = () => (
    <Center p="2">
        <Spinner size="lg" />
    </Center>
)

const DrawerMenuItemWithData = withCommerceSdkReactHookData(
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

const ListMenuContentWithData = withCommerceSdkReactHookData(
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

// Define the HOC function
const withLayout = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithLayout: React.FC<P> = (props: WithAppLayoutProps) => {
        const {data: categoriesTree} = useCategory({
            parameters: {id: CAT_MENU_DEFAULT_ROOT_CATEGORY, levels: CAT_MENU_DEFAULT_NAV_SSR_DEPTH}
        })
        const categories = flatten(categoriesTree || {}, 'categories')

        const appOrigin = getAppOrigin()
        const activeData = useActiveData()
        const config = useConfig()
        const history = useHistory()
        const location = useLocation()
        const authModal = useAuthModal()
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

        const trackPage = () => {
            void activeData.trackPage(site.id, locale.id, currency)
        }

        useEffect(() => {
            trackPage()
        }, [location])

        return (
            <Box className="sf-app" {...styles.container}>
                <Helmet>
                    {config.activeDataEnabled && (
                        <script
                            src={getStaticAssetUrl('libs/head-active_data.js', {
                                appExtensionPackageName: '@salesforce/extension-chakra-storefront'
                            })}
                            id="headActiveData"
                            type="text/javascript"
                        ></script>
                    )}
                </Helmet>

                <Seo>
                    <meta name="theme-color" content={THEME_COLOR} />
                    <meta name="apple-mobile-web-app-title" content={DEFAULT_SITE_TITLE} />

                    {/* Urls for all localized versions of this page (including current page)
                    For more details on hrefLang, see https://developers.google.com/search/docs/advanced/crawling/localized-versions */}
                    {site.l10n?.supportedLocales.map((locale: any) => (
                        <link
                            rel="alternate"
                            hrefLang={locale.id.toLowerCase()}
                            href={`${appOrigin}${buildUrl(location.pathname) as string}`}
                            key={locale.id}
                        />
                    ))}
                    {/* A general locale as fallback. For example: "en" if default locale is "en-GB" */}
                    <link
                        rel="alternate"
                        hrefLang={site.l10n.defaultLocale.slice(0, 2)}
                        href={`${appOrigin}${buildUrl(location.pathname) as string}`}
                    />
                    {/* A wider fallback for user locales that the app does not support */}
                    <link rel="alternate" hrefLang="x-default" href={`${appOrigin}/`} />
                </Seo>

                <ScrollToTop />

                <Box id="app" display="flex" flexDirection="column" flex={1}>
                    <SkipNavLink zIndex="skipLink">Skip to Content</SkipNavLink>
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
                                >
                                    <HideOnDesktop>
                                        <DrawerMenu
                                            isOpen={isOpen}
                                            onClose={onClose}
                                            onLogoClick={onLogoClick}
                                            root={categories?.[CAT_MENU_DEFAULT_ROOT_CATEGORY]}
                                            itemsKey="categories"
                                            itemsCountKey="onlineSubCategoriesCount"
                                            itemComponent={DrawerMenuItemWithData}
                                        />
                                    </HideOnDesktop>

                                    <HideOnMobile>
                                        <ListMenu
                                            root={categories?.[CAT_MENU_DEFAULT_ROOT_CATEGORY]}
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
                                    <WrappedComponent {...(props as P)} />
                                </OfflineBoundary>
                            </Box>
                        </SkipNavContent>

                        {!isCheckout ? <Footer /> : <CheckoutFooter />}

                        <AuthModal {...authModal} />
                    </AddToCartModalProvider>
                </Box>
                {(config.activeDataEnabled as boolean) && (
                    <script
                        type="text/javascript"
                        src={getStaticAssetUrl('libs/dwanalytics-22.2.js', {
                            appExtensionPackageName: '@salesforce/extension-chakra-storefront'
                        })}
                        id="dwanalytics"
                        async="async"
                        onLoad={trackPage}
                    ></script>
                )}
                {config.activeDataEnabled && (
                    <script
                        src={getStaticAssetUrl('libs/dwac-21.7.js', {
                            appExtensionPackageName: '@salesforce/extension-chakra-storefront'
                        })}
                        type="text/javascript"
                        id="dwac"
                        async="async"
                    ></script>
                )}
            </Box>
        )
    }

    return WithLayout
}

export default withLayout
