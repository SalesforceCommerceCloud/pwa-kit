/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation} from 'react-router-dom'
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'

// Chakra
import {Box, useDisclosure, useStyleConfig} from '@chakra-ui/react'
import {SkipNavLink, SkipNavContent} from '@chakra-ui/skip-nav'

// Contexts
import {CategoriesContext} from '../../contexts'

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

// Others
import {watchOnlineStatus, flatten} from '../../utils/utils'
import {IntlProvider, getLocaleConfig} from '../../locale'

import Seo from '../seo'

const DEFAULT_NAV_DEPTH = 3
const DEFAULT_ROOT_CATEGORY = 'root'
const HOME_HREF = '/'

const App = (props) => {
    const {children, targetLocale, defaultLocale, messages, categories: allCategories = {}} = props

    const history = useHistory()
    const location = useLocation()
    const authModal = useAuthModal()
    const customer = useCustomer()
    const [isOnline, setIsOnline] = useState(true)
    const [categories, setCategories] = useState(allCategories)
    const styles = useStyleConfig('App')

    const {isOpen, onOpen, onClose} = useDisclosure()

    // Used to conditionally render header/footer for checkout page
    const isCheckout = /\/checkout$/.test(location?.pathname)

    // Set up customer and basket
    useShopper()

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
        history.push(HOME_HREF)

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
        if (customer?.authType === 'registered') {
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
            <IntlProvider locale={targetLocale} defaultLocale={defaultLocale} messages={messages}>
                <CategoriesContext.Provider value={{categories, setCategories}}>
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
                                            root={categories[DEFAULT_ROOT_CATEGORY]}
                                        />
                                    </HideOnDesktop>

                                    <HideOnMobile>
                                        <ListMenu root={categories[DEFAULT_ROOT_CATEGORY]} />
                                    </HideOnMobile>
                                </Header>
                            ) : (
                                <CheckoutHeader />
                            )}
                        </Box>

                        {!isOnline && <OfflineBanner />}

                        <SkipNavContent
                            style={{display: 'flex', flexDirection: 'column', flex: 1, outline: 0}}
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
                    </Box>
                </CategoriesContext.Provider>
            </IntlProvider>
        </Box>
    )
}

App.shouldGetProps = () => {
    // In this case, we only want to fetch data for the app once, on the server.
    return typeof window === 'undefined'
}

App.getProps = async ({api, params}) => {
    const localeConfig = await getLocaleConfig({
        getUserPreferredLocales: () => {
            // TODO: You can detect their preferred locales from:
            // - client side: window.navigator.languages
            // - the page URL they're on (example.com/en/home)
            // - cookie (if their previous preference is saved there)
            // And decide which one takes precedence.

            const localeInPageUrl = params.locale
            return localeInPageUrl ? [localeInPageUrl] : []

            // If in this function an empty array is returned (e.g. there isn't locale in the page url),
            // then the app would use the default locale as the fallback.
        }
    })

    // Login as `guest` to get session.
    await api.auth.login()

    // Get the root category, this will be used for things like the navigation.
    const rootCategory = await api.shopperProducts.getCategory({
        parameters: {id: DEFAULT_ROOT_CATEGORY, levels: DEFAULT_NAV_DEPTH}
    })

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
    location: PropTypes.object,
    messages: PropTypes.object,
    categories: PropTypes.object
}

export default App
