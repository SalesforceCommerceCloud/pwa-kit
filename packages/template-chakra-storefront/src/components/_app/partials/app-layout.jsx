/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box} from '@chakra-ui/react'
import {SkipNavLink, SkipNavContent} from '../../skip-nav'
import ScrollToTop from '../../scroll-to-top'
import OfflineBanner from '../../offline-banner'
import OfflineBoundary from '../../offline-boundary'
import {AddToCartModalProvider} from '../../../hooks/use-add-to-cart-modal'

/**
 * AppLayout component that provides the main layout structure
 * Handles skip navigation, scroll to top, offline banner, and main content wrapper
 */
const AppLayout = ({children, isOnline = true, headerComponent, footerComponent, modalsComponent}) => {
    return (
        <>
            <ScrollToTop />
            <Box id="app" display="flex" flexDirection="column" flex={1} data-testid="app-layout">
                <SkipNavLink zIndex="skipLink">Skip to Content</SkipNavLink>

                {/* Header */}
                {headerComponent}

                {/* Offline Banner */}
                {isOnline === false && <OfflineBanner isOnline={isOnline} />}

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
                            <OfflineBoundary isOnline={isOnline}>{children}</OfflineBoundary>
                        </Box>
                    </SkipNavContent>

                    {/* Footer */}
                    {footerComponent}

                    {/* Modals */}
                    {modalsComponent}
                </AddToCartModalProvider>
            </Box>
        </>
    )
}

AppLayout.propTypes = {
    children: PropTypes.node,
    isOnline: PropTypes.bool,
    headerComponent: PropTypes.node,
    footerComponent: PropTypes.node,
    modalsComponent: PropTypes.node
}

export default AppLayout
