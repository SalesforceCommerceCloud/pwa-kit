/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {useActiveData} from '../../../hooks'

/**
 * Custom hook for managing analytics and page tracking
 * Handles page view tracking and analytics integration
 *
 * @param {string} siteId - Current site ID
 * @param {string} localeId - Current locale ID
 * @param {string} currency - Current currency
 * @returns {Object} Analytics utilities
 */
export const useAppAnalytics = (siteId, localeId, currency) => {
    const location = useLocation()
    const activeData = useActiveData()

    const trackPage = () => {
        if (activeData && typeof activeData.trackPage === 'function') {
            activeData.trackPage(siteId, localeId, currency)
        }
    }

    // Track page views on location changes
    useEffect(() => {
        trackPage()
    }, [location])

    return {
        trackPage,
        activeData
    }
}
