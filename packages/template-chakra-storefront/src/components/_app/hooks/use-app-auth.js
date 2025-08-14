/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useAccessToken} from '@salesforce/commerce-sdk-react'
import {useAuthModal} from '../../../hooks'

/**
 * Custom hook for managing authentication and auth modal state
 * Handles access token management and auth modal interactions
 *
 * @returns {Object} Authentication data and modal controls
 */
export const useAppAuth = () => {
    const {getTokenWhenReady} = useAccessToken()
    const authModal = useAuthModal()

    return {
        getTokenWhenReady,
        authModal
    }
}
