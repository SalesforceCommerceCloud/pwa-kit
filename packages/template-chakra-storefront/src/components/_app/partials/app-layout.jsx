/*
 * Copyright (c) 2021, salesforce.com, inc.
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
const AppLayout = ({children, isOnline, headerComponent, footerComponent, modalsComponent}) => {
    return (
        <>
            <ScrollToTop />
            <Box id="app" display="flex" flexDirection="column" flex={1}>
                <SkipNavLink zIndex="skipLink">Skip to Content</SkipNavLink>

                {/* Header */}
                {headerComponent}

                {/* Offline Banner */}
                {!isOnline && <OfflineBanner />}

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
    children: PropTypes.node.isRequired,
    isOnline: PropTypes.bool.isRequired,
    headerComponent: PropTypes.node.isRequired,
    footerComponent: PropTypes.node.isRequired,
    modalsComponent: PropTypes.node.isRequired
}

export default AppLayout
