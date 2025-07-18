/*
 * Copyright (c) 2025, salesforce.com, inc.
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

    const {appConfig, styles, themeColor} = useAppConfig()
    const {categories, customer, basket} = useAppData()
    const {getTokenWhenReady, authModal} = useAppAuth()
    const {targetLocale, messages, site, locale, buildUrl, currency, appOrigin} =
        useAppLocalization()
    const {onLogoClick, onCartClick, onAccountClick, onWishlistClick} = useAppNavigation()
    const {
        isDrawerMenuOpen,
        onDrawerMenuOpen,
        onDrawerMenuClose,
        dntNotification
        // TODO: Store locator variables will be used when feature is enabled:
        // isOpenStoreLocator,
        // onOpenStoreLocator,
        // onCloseStoreLocator
    } = useAppModals()

    useAppBasket(basket, customer, currency)
    const {isOnline} = useAppOnlineStatus()
    useAppAnalytics(site.id, locale.id, currency)
    useUpdateShopperContext()

    // Used to conditionally render header/footer for checkout page
    const isCheckout = /\/checkout$/.test(location?.pathname)

    const mobileNavigationProps = {
        categories,
        isDrawerMenuOpen,
        onDrawerMenuClose,
        onLogoClick
    }

    const headerProps = {
        isCheckout,
        styles,
        onMenuClick: onDrawerMenuOpen,
        onLogoClick,
        onMyCartClick: onCartClick,
        onMyAccountClick: onAccountClick,
        onWishlistClick,
        // TODO: Will be enabled when store locator feature is ready
        // onStoreLocatorClick: onOpenStoreLocator,
        mobileNavigationProps
    }

    const seoProps = {
        appConfig,
        appOrigin,
        themeColor,
        site,
        locale,
        buildUrl,
        location
    }

    const modalProps = {
        authModal,
        dntNotification
        // TODO: Store locator modal will be added when enabled:
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
