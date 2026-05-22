/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */

import React, {useContext} from 'react'
import {CorrelationIdContext, ServerContext, MrtDataStoreContext} from '../contexts'

/**
 * Use this hook to get the correlation id value of the closest CorrelationIdProvider component.
 *
 * @returns {object} The correlation id
 */
export const useCorrelationId = () => {
    const context = React.useContext(CorrelationIdContext)
    if (context === undefined) {
        throw new Error('useCorrelationId needs to be used within CorrelationIdProvider')
    }
    return context
}

/**
 * Server context
 * @typedef {Object} ServerContext
 * @property {Object} req - Request object
 * @property {Object} res - Response object
 */

/**
 * Get the server context
 * @returns {ServerContext} ServerContext object
 *
 * @example
 * const {res} = useServerContext()
 * if (res && query.error) { res.status(404) }
 */
export const useServerContext = () => {
    const serverContext = useContext(ServerContext)

    return serverContext
}

/**
 * Returns the application's origin.
 *
 * By default, it will return the ORIGIN under which we are serving the page.
 *
 * If `fromXForwardedHeader` is true, it will use the value of `x-forwarded-proto` and `x-forwarded-host` headers in req
 * to build origin. (it is false by default)
 *
 * NOTE: this is a React hook, so it has to be used in a React rendering pipeline.
 * @returns {string} origin string
 *
 */
export const useOrigin = ({fromXForwardedHeader = false}) => {
    const {res} = useServerContext()

    if (typeof window !== 'undefined') {
        return window.location.origin
    }

    const {APP_ORIGIN} = process.env

    const xForwardedOrigin = res.locals.xForwardedOrigin
    if (fromXForwardedHeader && xForwardedOrigin) {
        return xForwardedOrigin
    }
    return APP_ORIGIN
}

/**
 * Hook to access custom site preferences from MRT Data Store.
 *
 * Works isomorphically:
 * - Server (SSR): Uses preferences passed to MrtDataStoreProvider
 * - Client: Reads from window.__MRT_DATA_STORE__ using DAL keys (bootstrapped by server)
 *
 * Requires:
 * - MrtDataStoreProvider in component tree
 * - MRT Data Store enabled (app.mrtDataStore.enabled or PWAKIT_MRT_DATA_STORE_ENABLED)
 *
 * @returns {Object} Custom site preferences (empty object if unavailable)
 *
 * @example
 * import {useCustomSitePreferences} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
 *
 * const MyComponent = () => {
 *   const sitePrefs = useCustomSitePreferences()
 *   return <div>{sitePrefs.myFeatureFlag ? 'Enabled' : 'Disabled'}</div>
 * }
 */
export const useCustomSitePreferences = () => {
    const {customSitePreferences} = useContext(MrtDataStoreContext)
    return customSitePreferences || {}
}

/**
 * Hook to access custom global preferences from MRT Data Store.
 *
 * Works isomorphically:
 * - Server (SSR): Uses preferences passed to MrtDataStoreProvider
 * - Client: Reads from window.__MRT_DATA_STORE__ using DAL keys (bootstrapped by server)
 *
 * Requires:
 * - MrtDataStoreProvider in component tree
 * - MRT Data Store enabled (app.mrtDataStore.enabled or PWAKIT_MRT_DATA_STORE_ENABLED)
 *
 * @returns {Object} Custom global preferences (empty object if unavailable)
 *
 * @example
 * import {useCustomGlobalPreferences} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
 *
 * const MyComponent = () => {
 *   const globalPrefs = useCustomGlobalPreferences()
 *   return <div>Theme: {globalPrefs.theme}</div>
 * }
 */
export const useCustomGlobalPreferences = () => {
    const {customGlobalPreferences} = useContext(MrtDataStoreContext)
    return customGlobalPreferences || {}
}
