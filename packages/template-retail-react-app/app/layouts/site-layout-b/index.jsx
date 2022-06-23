// /components/site-layout/index.jsx
import React, {useEffect, useState} from 'react'
import {Box, Link, useDisclosure, useStyleConfig} from "@chakra-ui/react";
import {getAppOrigin} from "pwa-kit-react-sdk/utils/url";
import {useHistory, useLocation} from "react-router-dom";
import {AuthModal, useAuthModal} from "../../hooks/use-auth-modal";
import useCustomer from "../../commerce-api/hooks/useCustomer";
import useSite from "../../hooks/use-site";
import useLocale from "../../hooks/use-locale";
import useShopper from "../../commerce-api/hooks/useShopper";
import useWishlist from "../../hooks/use-wishlist";
import {watchOnlineStatus} from "../../utils/utils";
import {buildPathWithUrlConfig, getPathWithLocale, homeUrlBuilder} from "../../utils/url";
import {DEFAULT_SITE_TITLE, HOME_HREF, THEME_COLOR} from "../../constants";
import {IntlProvider} from "react-intl";
 import {CategoriesProvider, CurrencyProvider} from "../../contexts";

 import Seo from "../../components/seo";
 import {getAssetUrl} from "pwa-kit-react-sdk/ssr/universal/utils";
 import ScrollToTop from "../../components/scroll-to-top";
 import {SkipNavContent, SkipNavLink} from "@chakra-ui/skip-nav";
import Header from "../../components/header";
import {HideOnDesktop, HideOnMobile} from "../../components/responsive";
import DrawerMenu from "../../components/drawer-menu";
import ListMenu from "../../components/list-menu";
import CheckoutHeader from "../../pages/checkout/partials/checkout-header";
import OfflineBanner from "../../components/offline-banner";
import {AddToCartModalProvider} from "../../hooks/use-add-to-cart-modal";
import OfflineBoundary from "../../components/offline-boundary";
import Footer from "../../components/footer";
import CheckoutFooter from "../../pages/checkout/partials/checkout-footer";

const DEFAULT_NAV_DEPTH = 3
const DEFAULT_ROOT_CATEGORY = 'root'

import {useCategories} from '../../hooks/use-categories'

const SiteLayout = (props) => {


    const {children, targetLocale, messages} = props

    const {categories: allCategories = {}} = useCategories()
    console.log('<SiteLayout /> allCategories:', allCategories)
    const appOrigin = getAppOrigin()

    const history = useHistory()
    const location = useLocation()
    const authModal = useAuthModal()
    const customer = useCustomer()

    const site = useSite()
    const locale = useLocale()

    console.log('SiteLayout locale:', locale)

    const [isOnline, setIsOnline] = useState(true)
    const styles = useStyleConfig('App')

    const configValues = {
        locale: locale.alias || locale.id,
        site: site.alias || site.id
    }

    const {isOpen, onOpen, onClose} = useDisclosure()

    // Used to conditionally render header/footer for checkout page
    const isCheckout = /\/checkout$/.test(location?.pathname)

    const {l10n} = site
    // Get the current currency to be used through out the app
    const currency = locale.preferredCurrency || l10n.defaultCurrency

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
        const path = homeUrlBuilder(HOME_HREF, {locale, site})
        history.push(path)

        // Close the drawer.
        onClose()
    }

    const onCartClick = () => {
        const path = buildPathWithUrlConfig('/cart', configValues)
        history.push(path)

        // Close the drawer.
        onClose()
    }

    const onAccountClick = () => {
        // Link to account page for registered customer, open auth modal otherwise
        if (customer.isRegistered) {
            const path = buildPathWithUrlConfig('/account', configValues)
            history.push(path)
        } else {
            // if they already are at the login page, do not show login modal
            if (new RegExp(`^/login$`).test(location.pathname)) return
            authModal.onOpen()
        }
    }

    const onWishlistClick = () => {
        const path = buildPathWithUrlConfig('/account/wishlist', configValues)
        history.push(path)
    }

    const getLayout =
        children.getLayout || (page => <SiteLayout children={page} />)



    return (

    <>
        <h1>SiteLayout BBB</h1>
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
                                    href={`${appOrigin}${getPathWithLocale(locale.id, {
                                        location
                                    })}`}
                                    key={locale.id}
                                />
                            ))}
                            {/* A general locale as fallback. For example: "en" if default locale is "en-GB" */}
                            <link
                                rel="alternate"
                                hrefLang={site.l10n.defaultLocale.slice(0, 2)}
                                href={`${appOrigin}${getPathWithLocale(site.l10n.defaultLocale, {
                                    location
                                })}`}
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

        </>
    )
}

export const getLayout = page =>{
    console.log('SiteLayout page:', page)
    return (<SiteLayout>{page}</SiteLayout>)}

export default SiteLayout