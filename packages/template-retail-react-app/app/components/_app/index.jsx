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
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'
import {useQuery} from '@tanstack/react-query'
import {
    useAccessToken,
    useCategory,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Chakra
import {
    Box,
    Center,
    Fade,
    Spinner,
    useDisclosure,
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SkipNavLink, SkipNavContent} from '@chakra-ui/skip-nav'

// Contexts
import {CurrencyProvider} from '@salesforce/retail-react-app/app/contexts'

// Local Project Components
import Header from '@salesforce/retail-react-app/app/components/header'
import OfflineBanner from '@salesforce/retail-react-app/app/components/offline-banner'
import OfflineBoundary from '@salesforce/retail-react-app/app/components/offline-boundary'
import ScrollToTop from '@salesforce/retail-react-app/app/components/scroll-to-top'
import Footer from '@salesforce/retail-react-app/app/components/footer'
import CheckoutHeader from '@salesforce/retail-react-app/app/pages/checkout/partials/checkout-header'
import CheckoutFooter from '@salesforce/retail-react-app/app/pages/checkout/partials/checkout-footer'
import {DrawerMenu} from '@salesforce/retail-react-app/app/components/drawer-menu'
import {ListMenu, ListMenuContent} from '@salesforce/retail-react-app/app/components/list-menu'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import AboveHeader from '@salesforce/retail-react-app/app/components/_app/partials/above-header'
import StoreLocatorModal from '@salesforce/retail-react-app/app/components/store-locator-modal'
// Hooks
import {AuthModal, useAuthModal} from '@salesforce/retail-react-app/app/hooks/use-auth-modal'
import {
    DntNotification,
    useDntNotification
} from '@salesforce/retail-react-app/app/hooks/use-dnt-notification'
import {AddToCartModalProvider} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useUpdateShopperContext} from '@salesforce/retail-react-app/app/hooks/use-update-shopper-context'

// HOCs
import {withCommerceSdkReact} from '@salesforce/retail-react-app/app/components/with-commerce-sdk-react/with-commerce-sdk-react'

// Localization
import {IntlProvider} from 'react-intl'

// Others
import {watchOnlineStatus, flatten, isServer} from '@salesforce/retail-react-app/app/utils/utils'
import {getTargetLocale, fetchTranslations} from '@salesforce/retail-react-app/app/utils/locale'
import {
    DEFAULT_SITE_TITLE,
    HOME_HREF,
    THEME_COLOR,
    CAT_MENU_DEFAULT_NAV_SSR_DEPTH,
    CAT_MENU_DEFAULT_ROOT_CATEGORY,
    DEFAULT_LOCALE,
    ACTIVE_DATA_ENABLED
} from '@salesforce/retail-react-app/app/constants'

import Seo from '@salesforce/retail-react-app/app/components/seo'
import {Helmet} from 'react-helmet'
import ShopperAgent from '@salesforce/retail-react-app/app/components/shopper-agent'
import {getPathWithLocale} from '@salesforce/retail-react-app/app/utils/url'

// Embedded CSS to avoid webpack loader conflicts
const adyenCSS = `
.adyen-checkout__spinner__wrapper{align-items:center;display:flex;height:100%;justify-content:center}.adyen-checkout__spinner__wrapper--inline{display:inline-block;height:auto;margin-right:8px}[dir=rtl] .adyen-checkout__spinner__wrapper--inline{margin-left:8px;margin-right:0}.adyen-checkout__spinner{animation:rotate-spinner 1.5s linear infinite;border:3px solid #0075ff;border-radius:50%;border-top-color:transparent;height:43px;width:43px}.adyen-checkout__spinner--large{height:43px;width:43px}.adyen-checkout__spinner--small{border-width:2px;height:16px;width:16px}.adyen-checkout__spinner--medium{height:28px;width:28px}@keyframes rotate-spinner{0%{transform:rotate(0deg)}to{transform:rotate(1turn)}}.adyen-checkout__button{background:#00112c;border:0;border-radius:6px;color:#fff;cursor:pointer;font-size:1em;font-weight:500;height:48px;margin:0;padding:15px;text-decoration:none;transition:background .3s ease-out,box-shadow .3s ease-out;width:100%}.adyen-checkout__button:focus{box-shadow:0 0 0 2px #3070ED;outline:0}.adyen-checkout__button:hover{background:#1c3045;box-shadow:0 0,0 2px 4px -1px rgba(0,0,0,.2),0 4px 5px 0 rgba(0,0,0,.14)}.adyen-checkout__button:active{background:#3a4a5c}.adyen-checkout__button:hover:focus{box-shadow:0 0 0 2px #3070ED,0 3px 4px rgba(0,15,45,.2)}.adyen-checkout__button:disabled,.adyen-checkout__button:disabled:hover{box-shadow:none;cursor:not-allowed;opacity:.4;-webkit-user-select:all;-moz-user-select:all;user-select:all}.adyen-checkout__button.adyen-checkout__button--loading{background:#687282;box-shadow:none;pointer-events:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}.adyen-checkout__button.adyen-checkout__button--pay{display:flex;justify-content:center;margin-top:24px}.adyen-checkout__button.adyen-checkout__button--pay:disabled{opacity:.4}.adyen-checkout__button.adyen-checkout__button--standalone{margin-top:0}.adyen-checkout__button.adyen-checkout__button--inline{display:block;font-size:.81em;height:auto;padding:10px 8px;width:auto}.adyen-checkout__button.adyen-checkout__button--ghost{background:none;border:0;color:#00112c}.adyen-checkout__button.adyen-checkout__button--ghost:hover{background:#f7f8f9;box-shadow:none}.adyen-checkout__button.adyen-checkout__button--ghost:active{background:#e6e9eb;box-shadow:none}.adyen-checkout__button.adyen-checkout__button--secondary{background:#fff;border:1px solid #00112c;color:#00112c;padding:10px 12px}.adyen-checkout__button.adyen-checkout__button--secondary:hover{background:#f7f8f9;box-shadow:0 2px 4px rgba(27,42,60,.2),0 4px 5px rgba(27,42,60,.14)}.adyen-checkout__button.adyen-checkout__button--secondary:active,.adyen-checkout__button.adyen-checkout__button--secondary:active:hover{background:#f7f8f9;box-shadow:none}.adyen-checkout__button.adyen-checkout__button--secondary:disabled,.adyen-checkout__button.adyen-checkout__button--secondary:disabled:hover{background-color:#f7f8f9;border-color:#99a3ad;box-shadow:none;cursor:not-allowed;opacity:.5;-webkit-user-select:all;-moz-user-select:all;user-select:all}.adyen-checkout__button.adyen-checkout__button--secondary .adyen-checkout__spinner{border-color:transparent #00112c #00112c}.adyen-checkout__button.adyen-checkout__button--action{background:rgba(0,102,255,.1);border:1px solid transparent;color:#0075ff;padding:10px 12px}.adyen-checkout__button.adyen-checkout__button--action:hover{background:rgba(0,102,255,.2);box-shadow:none}.adyen-checkout__button.adyen-checkout__button--action:active,.adyen-checkout__button.adyen-checkout__button--action:active:hover{background:rgba(0,102,255,.3);box-shadow:none}.adyen-checkout__button.adyen-checkout__button--link{background:transparent;border:1px solid transparent;border-radius:3px;color:#0075ff;font-weight:400;padding:2px}.adyen-checkout__button.adyen-checkout__button--link:hover{background:transparent;box-shadow:none;text-decoration:underline}.adyen-checkout__button.adyen-checkout__button--completed,.adyen-checkout__button.adyen-checkout__button--completed:active,.adyen-checkout__button.adyen-checkout__button--completed:active:hover,.adyen-checkout__button.adyen-checkout__button--completed:hover{background:#089a43;color:#fff}.adyen-checkout__button.adyen-checkout__button--completed .adyen-checkout__button__icon{filter:brightness(0) invert(1)}.adyen-checkout__button__content{align-items:center;display:flex;height:100%;justify-content:center}.adyen-checkout__button__icon{margin-right:12px}[dir=rtl] .adyen-checkout__button__icon{margin-left:12px;margin-right:0}.adyen-checkout__button__text{display:block;justify-content:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.adyen-checkout__button .adyen-checkout__spinner{border-color:transparent #fff #fff}.checkout-secondary-button__text{font-size:.85em;margin-left:5px;margin-top:1px}
`

const adyenOverridesCSS = `
.adyen-checkout__applepay__button {
    width: 100% !important;
    height: 32px !important;
}
`

// Inject CSS manually
const injectCSS = (cssContent, id) => {
    if (typeof document !== 'undefined' && !document.getElementById(id)) {
        const style = document.createElement('style')
        style.id = id
        style.textContent = cssContent
        document.head.appendChild(style)
    }
}

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
    const appOrigin = useAppOrigin()
    const activeData = useActiveData()
    const history = useHistory()
    const location = useLocation()
    const authModal = useAuthModal()
    const dntNotification = useDntNotification()
    const {site, locale, buildUrl} = useMultiSite()

    const [isOnline, setIsOnline] = useState(true)
    const styles = useStyleConfig('App')
    const {isOpen, onOpen, onClose} = useDisclosure()
    const {
        isOpen: isOpenStoreLocator,
        onOpen: onOpenStoreLocator,
        onClose: onCloseStoreLocator
    } = useDisclosure()

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
    const isExpress = /\/express$/.test(location?.pathname)

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
        const {commerceAgent} = config.app
        return JSON.parse(commerceAgent)
    }, [config?.app])

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
        // Inject Adyen CSS on app mount
        injectCSS(adyenCSS, 'adyen-css')
        injectCSS(adyenOverridesCSS, 'adyen-overrides-css')
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
        activeData.trackPage(site.id, locale.id, currency)
    }

    useEffect(() => {
        trackPage()
    }, [location])

    return isExpress ? (
        <OfflineBoundary isOnline={false}>
            <div style={{width: '100%', height: '32px', overflowY: 'hidden'}}>{children}</div>
        </OfflineBoundary>
    ) : (
        <Box className="sf-app" {...styles.container}>
            <StorefrontPreview getToken={getTokenWhenReady}>
                <Helmet>
                    {ACTIVE_DATA_ENABLED && (
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

                        <ShopperAgent
                            commerceAgentConfiguration={commerceAgentConfiguration}
                            domainUrl={`${appOrigin}${buildUrl(location.pathname)}`}
                            locale={locale?.id}
                            basketId={basket?.basketId}
                            basketDoneLoading={basketQueryLastUpdateTime > 0}
                        />

                        <ScrollToTop />

                        <Box id="app" display="flex" flexDirection="column" flex={1}>
                            <SkipNavLink zIndex="skipLink">Skip to Content</SkipNavLink>
                            <StoreLocatorModal
                                isOpen={isOpenStoreLocator}
                                onClose={onCloseStoreLocator}
                            />
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
                                        >
                                            <HideOnDesktop>
                                                <DrawerMenu
                                                    isOpen={isOpen}
                                                    onClose={onClose}
                                                    onLogoClick={onLogoClick}
                                                    root={
                                                        categories?.[CAT_MENU_DEFAULT_ROOT_CATEGORY]
                                                    }
                                                    itemsKey="categories"
                                                    itemsCountKey="onlineSubCategoriesCount"
                                                    itemComponent={DrawerMenuItemWithData}
                                                />
                                            </HideOnDesktop>

                                            <HideOnMobile>
                                                <ListMenu
                                                    root={
                                                        categories?.[CAT_MENU_DEFAULT_ROOT_CATEGORY]
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
                                <DntNotification {...dntNotification} />
                            </AddToCartModalProvider>
                        </Box>
                    </CurrencyProvider>
                </IntlProvider>
                {ACTIVE_DATA_ENABLED && (
                    <script
                        type="text/javascript"
                        src={getAssetUrl('static/dwanalytics-22.2.js')}
                        id="dwanalytics"
                        async="async"
                        onLoad={trackPage}
                    ></script>
                )}
                {ACTIVE_DATA_ENABLED && (
                    <script
                        src={getAssetUrl('static/dwac-21.7.js')}
                        type="text/javascript"
                        id="dwac"
                        async="async"
                    ></script>
                )}
            </StorefrontPreview>
        </Box>
    )
}

App.propTypes = {
    children: PropTypes.node
}

export default App
