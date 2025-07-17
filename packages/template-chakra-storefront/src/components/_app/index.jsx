/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import React from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'

// Removes focus for non-keyboard interactions for the whole application
import 'focus-visible/dist/focus-visible'

// Platform Imports
import {Box} from '@chakra-ui/react'

// Custom Hooks
import {
    useAppConfig,
    useAppData,
    useAppAuth,
    useAppLocalization,
    useAppNavigation,
    useAppModals,
    useAppBasket,
    useAppOnlineStatus,
    useAppAnalytics
} from './hooks'
import {useUpdateShopperContext} from '../../hooks/use-update-shopper-context'

// Components
import {AppProviders, AppSEO, AppHeader, AppFooter, AppModals, AppLayout} from './partials'

/**
 * Main App component that orchestrates the entire application
 * Uses extracted hooks and components to manage app-level concerns
 */
const App = (props) => {
    const {children} = props
    const location = useLocation()

    // App configuration and theme
    const {appConfig, styles, themeColor} = useAppConfig()

    // Data fetching (categories, customer, basket)
    const {categories, customer, basket} = useAppData()

    // Authentication
    const {getTokenWhenReady, authModal} = useAppAuth()

    // Localization and internationalization
    const {targetLocale, messages, site, locale, buildUrl, currency, appOrigin} =
        useAppLocalization()

    // Navigation handlers
    const {onLogoClick, onCartClick, onAccountClick, onWishlistClick} = useAppNavigation()

    // Modal states
    const {
        isDrawerMenuOpen,
        onDrawerMenuOpen,
        onDrawerMenuClose,
        isOpenStoreLocator,
        onOpenStoreLocator,
        onCloseStoreLocator,
        dntNotification
    } = useAppModals()

    // Basket management
    useAppBasket(basket, customer, currency)

    // Online status monitoring
    const {isOnline} = useAppOnlineStatus()

    // Analytics tracking
    useAppAnalytics(site.id, locale.id, currency)

    // Handle updating the shopper context
    useUpdateShopperContext()

    // Used to conditionally render header/footer for checkout page
    const isCheckout = /\/checkout$/.test(location?.pathname)

    // Mobile navigation props
    const mobileNavigationProps = {
        categories,
        isDrawerMenuOpen,
        onDrawerMenuClose,
        onLogoClick
    }

    // Header props
    const headerProps = {
        isCheckout,
        styles,
        onMenuClick: onDrawerMenuOpen,
        onLogoClick,
        onMyCartClick: onCartClick,
        onMyAccountClick: onAccountClick,
        onWishlistClick,
        onStoreLocatorClick: onOpenStoreLocator,
        mobileNavigationProps
    }

    // SEO props
    const seoProps = {
        appConfig,
        appOrigin,
        themeColor,
        site,
        locale,
        buildUrl,
        location
    }

    // Modal props
    const modalProps = {
        authModal,
        dntNotification
        // Uncomment when store locator is enabled
        // isOpenStoreLocator,
        // onCloseStoreLocator
    }

    return (
        <Box className="sf-app" css={styles.container}>
            <AppProviders
                getTokenWhenReady={getTokenWhenReady}
                targetLocale={targetLocale}
                messages={messages}
                currency={currency}
            >
                <AppSEO {...seoProps} />

                <AppLayout
                    isOnline={isOnline}
                    headerComponent={<AppHeader {...headerProps} />}
                    footerComponent={<AppFooter isCheckout={isCheckout} />}
                    modalsComponent={<AppModals {...modalProps} />}
                >
                    {children}
                </AppLayout>
            </AppProviders>
        </Box>
    )
}

App.propTypes = {
    children: PropTypes.node
}

export default App
