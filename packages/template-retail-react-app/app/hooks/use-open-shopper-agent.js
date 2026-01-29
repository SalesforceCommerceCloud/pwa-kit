/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
import {launchChat} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

/**
 * React hook that returns a stable callback to open the shopper agent chat window.
 * Uses the embedded service bootstrap API to launch the chat.
 *
 * @returns {Function} openShopperAgent - Stable callback to open the shopper agent chat
 */
export function useOpenShopperAgent() {
    const openShopperAgent = useCallback(() => {
        launchChat()
    }, [])

    return openShopperAgent
}
