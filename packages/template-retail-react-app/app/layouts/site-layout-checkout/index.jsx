/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {Box, useDisclosure, useStyleConfig} from '@chakra-ui/react'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {useLocation} from 'react-router-dom'
import {AuthModal, useAuthModal} from '../../hooks/use-auth-modal'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useSite from '../../hooks/use-site'
import useLocale from '../../hooks/use-locale'
import useShopper from '../../commerce-api/hooks/useShopper'
import useWishlist from '../../hooks/use-wishlist'
import {watchOnlineStatus} from '../../utils/utils'
import {getPathWithLocale} from '../../utils/url'
import {DEFAULT_SITE_TITLE, THEME_COLOR} from '../../constants'

import Seo from '../../components/seo'
import {getAssetUrl} from 'pwa-kit-react-sdk/ssr/universal/utils'
import ScrollToTop from '../../components/scroll-to-top'
import {SkipNavContent, SkipNavLink} from '@chakra-ui/skip-nav'

import CheckoutHeader from '../../pages/checkout/partials/checkout-header'
import OfflineBanner from '../../components/offline-banner'
import {AddToCartModalProvider} from '../../hooks/use-add-to-cart-modal'
import OfflineBoundary from '../../components/offline-boundary'
import CheckoutFooter from '../../pages/checkout/partials/checkout-footer'
import PropTypes from 'prop-types'

const SiteLayoutCheckout = (props) => {
    const {children} = props

    const appOrigin = getAppOrigin()

    const location = useLocation()
    const authModal = useAuthModal()
    const customer = useCustomer()

    const site = useSite()
    const locale = useLocale()

    const [isOnline, setIsOnline] = useState(true)
    const styles = useStyleConfig('App')

    const {onClose} = useDisclosure()

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

    return (
        <>
            <h1>CheckoutLayout</h1>
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
                    <CheckoutHeader />
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

                    <CheckoutFooter />

                    <AuthModal {...authModal} />
                </AddToCartModalProvider>
            </Box>
        </>
    )
}

SiteLayoutCheckout.propTypes = {
    children: PropTypes.node
}

export const getLayout = (page) => {
    return <SiteLayoutCheckout>{page}</SiteLayoutCheckout>
}

export default SiteLayoutCheckout
