import React, {useState, useEffect} from 'react'
import Helmet from 'react-helmet'
import PropTypes from 'prop-types'

import SkipLinks from 'progressive-web-sdk/dist/components/skip-links'
import {pages, PAGEEVENTS} from 'progressive-web-sdk/dist/ssr/universal/events'
import {PAGEVIEW, ERROR, OFFLINE} from 'progressive-web-sdk/dist/analytics-integrations/types'
import {getAssetUrl} from 'progressive-web-sdk/dist/ssr/universal/utils'

import {watchOnlineStatus} from '../../utils/utils'
import Header from '../../components/header'
import Footer from '../../components/footer'
import OfflineBoundary from '../../components/offline-boundary'
import ResponsiveContainer from '../../components/responsive-container'
import ScrollToTop from '../../components/scroll-to-top'

import {getAnalyticsManager} from '../../analytics'
import {getRootCategoryId} from '../../connector'
import {getNavigationRoot, getNavigationRootDesktop, flattenCategory} from './helpers'
const analyticsManager = getAnalyticsManager()

export const OfflineBanner = () => (
    <header className="c-pwa-app__offline-banner">
        <p>Currently browsing in offline mode</p>
    </header>
)

const PWAApp = (props) => {
    const {children} = props

    const navigationRootMobile = getNavigationRoot(props)
    const navigationRootDesktop = getNavigationRootDesktop(props)

    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        // Listen for events from the SDK to send analytics for.
        pages.on(PAGEEVENTS.PAGELOAD, (evt) => {
            analyticsManager.track(PAGEVIEW, evt)
            analyticsManager.trackPageLoad(evt)
        })
        pages.on(PAGEEVENTS.ERROR, (evt) => {
            analyticsManager.track(ERROR, evt)
        })

        // Listen for online status changes to update state and send analytics for.
        watchOnlineStatus((isOnline) => {
            setIsOnline(isOnline)

            analyticsManager.track(OFFLINE, {
                startTime: !isOnline ? new Date().getTime() : null
            })
        })
    }, [])

    return (
        <ResponsiveContainer>
            <Helmet>
                <meta name="theme-color" content="#0288a7" />
                <meta name="apple-mobile-web-app-title" content="Scaffold" />
                <link
                    rel="apple-touch-icon"
                    href={getAssetUrl('static/img/global/apple-touch-icon.png')}
                />
                <link rel="manifest" href={getAssetUrl('static/manifest.json')} />
            </Helmet>

            <ScrollToTop />

            <div id="app" className="c-pwa-app">
                <SkipLinks
                    items={[
                        {target: '#app-main', label: 'Skip to content'} // See: https://www.w3.org/TR/WCAG20-TECHS/G1.html
                    ]}
                />

                <Header
                    navigationRootMobile={navigationRootMobile}
                    navigationRootDesktop={navigationRootDesktop}
                />

                {!isOnline && <OfflineBanner />}

                <main id="app-main" className="c-pwa-app__main" role="main">
                    <div className="c-pwa-app__content">
                        <OfflineBoundary isOnline={isOnline}>{children}</OfflineBoundary>
                    </div>
                </main>

                <Footer />
            </div>
        </ResponsiveContainer>
    )
}

PWAApp.shouldGetProps = () => {
    // In this case, we only want to fetch data for the app once, on the server.
    return typeof window === 'undefined'
}

PWAApp.getProps = async ({connector}) => {
    const category = await connector.getCategory(getRootCategoryId())
    const flattened = flattenCategory(category)
    return {categories: flattened}
}

PWAApp.propTypes = {
    children: PropTypes.node,
    categories: PropTypes.object
}

export default PWAApp
