/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation} from 'react-router-dom'
import {useIntl} from 'react-intl'

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

// Others
import {watchOnlineStatus, flatten} from '../../utils/utils'
import {homeUrlBuilder} from '../../utils/url'
import {DEFAULT_CURRENCY, HOME_HREF} from '../../constants'

import useWishlist from '../../hooks/use-wishlist'

const DEFAULT_NAV_DEPTH = 3
const DEFAULT_ROOT_CATEGORY = 'root'

const App = (props) => {
    const {children, categories: allCategories = {}} = props

    const history = useHistory()
    const intl = useIntl()
    const location = useLocation()
    const authModal = useAuthModal()
    const customer = useCustomer()
    const [isOnline, setIsOnline] = useState(true)
    const styles = useStyleConfig('App')

    const {isOpen, onOpen, onClose} = useDisclosure()

    // Used to conditionally render header/footer for checkout page
    const isCheckout = /\/checkout$/.test(location?.pathname)

    // Set up customer and basket
    // useShopper({currency})
    useShopper()
    const currency = DEFAULT_CURRENCY

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
        history.push(homeUrlBuilder(HOME_HREF, intl.locale))

        // Close the drawer.
        onClose()
    }

    const onCartClick = () => {
        // Goto the home page.
        history.push(`/${intl.locale}/cart`)

        // Close the drawer.
        onClose()
    }

    const onAccountClick = () => {
        // Link to account page for registered customer, open auth modal otherwise
        if (customer.isRegistered) {
            history.push(`/${intl.locale}/account`)
        } else {
            // if they already are at the login page, do not show login modal
            if (new RegExp(`^/${intl.locale}/login$`).test(location.pathname)) return
            authModal.onOpen()
        }
    }

    const onWishlistClick = () => {
        history.push(`/${intl.locale}/account/wishlist`)
    }

    return (
        <Box className="sf-app" {...styles.container}>
            <CategoriesProvider categories={allCategories}>
                <CurrencyProvider currency={currency}>
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
                                    <OfflineBoundary isOnline={false}>{children}</OfflineBoundary>
                                </Box>
                            </SkipNavContent>

                            {!isCheckout ? <Footer /> : <CheckoutFooter />}

                            <AuthModal {...authModal} />
                        </AddToCartModalProvider>
                    </Box>
                </CurrencyProvider>
            </CategoriesProvider>
        </Box>
    )
}

App.shouldGetProps = () => {
    // In this case, we only want to fetch data for the app once, on the server.
    return typeof window === 'undefined'
}

App.getProps = async ({api}) => {
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
        categories: categories
    }
}

App.propTypes = {
    children: PropTypes.node,
    categories: PropTypes.object
}

export default App
