/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box} from '@chakra-ui/react'
import Header from '../../header'
import CheckoutHeader from '../../../pages/checkout/partials/checkout-header'
import AppMobileNavigation from './app-mobile-navigation'

/**
 * AppHeader component that renders the appropriate header based on checkout state
 * Handles conditional rendering of normal header vs checkout header
 */
const AppHeader = ({
    isCheckout,
    styles,
    onMenuClick,
    onLogoClick,
    onMyCartClick,
    onMyAccountClick,
    onWishlistClick,
    onStoreLocatorClick,
    mobileNavigationProps
}) => {
    return (
        <Box css={styles.headerWrapper}>
            {!isCheckout ? (
                <>
                    <Header
                        onMenuClick={onMenuClick}
                        onLogoClick={onLogoClick}
                        onMyCartClick={onMyCartClick}
                        onMyAccountClick={onMyAccountClick}
                        onWishlistClick={onWishlistClick}
                        onStoreLocatorClick={onStoreLocatorClick}
                    >
                        <AppMobileNavigation {...mobileNavigationProps} />
                    </Header>
                </>
            ) : (
                <CheckoutHeader />
            )}
        </Box>
    )
}

AppHeader.propTypes = {
    isCheckout: PropTypes.bool.isRequired,
    styles: PropTypes.object.isRequired,
    onMenuClick: PropTypes.func.isRequired,
    onLogoClick: PropTypes.func.isRequired,
    onMyCartClick: PropTypes.func.isRequired,
    onMyAccountClick: PropTypes.func.isRequired,
    onWishlistClick: PropTypes.func.isRequired,
    onStoreLocatorClick: PropTypes.func.isRequired,
    mobileNavigationProps: PropTypes.object.isRequired
}

export default AppHeader
