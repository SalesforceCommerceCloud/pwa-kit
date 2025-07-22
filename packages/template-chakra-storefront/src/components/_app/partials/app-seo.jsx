/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import Seo from '../../seo'
import {getPathWithLocale} from '../../../utils/url'

/**
 * AppSEO component that handles meta tags, SEO configuration, and hrefLang links
 * Manages head elements including Active Data script, meta tags, and localized links
 */
const AppSEO = ({appConfig, appOrigin, themeColor, site, locale, buildUrl, location}) => {
    return (
        <Seo>
            <Helmet>
                {appConfig.activeDataEnabled && (
                    <script
                        src={getAssetUrl('static/head-active_data.js')}
                        id="headActiveData"
                        type="text/javascript"
                    ></script>
                )}
            </Helmet>

            <meta name="theme-color" content={themeColor} />
            <meta name="apple-mobile-web-app-title" content={appConfig.defaultSiteTitle} />

            {/* Urls for all localized versions of this page (including current page)
                For more details on hrefLang, see
                https://developers.google.com/search/docs/advanced/crawling/localized-versions
             */}
            {site.l10n?.supportedLocales?.map((locale) => (
                <link
                    rel="alternate"
                    hrefLang={locale.id.toLowerCase()}
                    href={`${appOrigin}${getPathWithLocale(locale.id, buildUrl, {
                        location: {
                            ...location,
                            search: ''
                        }
                    })}`}
                    key={locale.id}
                />
            ))}
            {/* A general locale as fallback. For example: "en" if default locale is "en-GB" */}
            {site.l10n?.defaultLocale && (
                <link
                    rel="alternate"
                    hrefLang={site.l10n.defaultLocale.slice(0, 2)}
                    href={`${appOrigin}${getPathWithLocale(locale.id, buildUrl, {
                        location: {
                            ...location,
                            search: ''
                        }
                    })}`}
                />
            )}
            {/* A wider fallback for user locales that the app does not support */}
            <link rel="alternate" hrefLang="x-default" href={`${appOrigin}/`} />
        </Seo>
    )
}

AppSEO.propTypes = {
    appConfig: PropTypes.object.isRequired,
    appOrigin: PropTypes.string.isRequired,
    themeColor: PropTypes.string.isRequired,
    site: PropTypes.object.isRequired,
    locale: PropTypes.object.isRequired,
    buildUrl: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired
}

export default AppSEO
