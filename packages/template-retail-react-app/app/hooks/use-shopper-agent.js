/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
import {launchChat} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

/**
 * React hook that returns shopper agent actions.
 * Uses the embedded service bootstrap API. Structured for future extension (e.g. close, sendMessage).
 */
export function useShopperAgent() {
    const open = useCallback(() => {
        launchChat()
    }, [])

    return {actions: {open}}
}
