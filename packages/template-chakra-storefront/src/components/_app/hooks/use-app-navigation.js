/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback} from 'react'
import {useHistory} from 'react-router-dom'
import {useAppConfig} from './use-app-config'
import {useAppLocalization} from './use-app-localization'

/**
 * Custom hook for managing navigation handlers and routing logic
 * Provides centralized navigation functions for the app
 *
 * @returns {Object} Navigation handler functions
 */
export const useAppNavigation = () => {
    const {appConfig} = useAppConfig()
    const {buildUrl} = useAppLocalization()
    const history = useHistory()

    const onLogoClick = useCallback(() => {
        const path = buildUrl(appConfig.pages.home.path)
        history?.push(path)
    }, [appConfig.pages.home.path, buildUrl, history])

    const onCartClick = useCallback(() => {
        const path = buildUrl('/cart')
        history?.push(path)
    }, [buildUrl, history])

    const onAccountClick = useCallback(() => {
        // Link to account page if registered; Header component will show auth modal for guest users
        const path = buildUrl('/account')
        history?.push(path)
    }, [buildUrl, history])

    const onWishlistClick = useCallback(() => {
        // Link to wishlist page if registered; Header component will show auth modal for guest users
        const path = buildUrl('/account/wishlist')
        history?.push(path)
    }, [buildUrl, history])

    return {
        onLogoClick,
        onCartClick,
        onAccountClick,
        onWishlistClick
    }
}
