/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useApplicationExtensionsStore} from '@salesforce/pwa-kit-extension-sdk/react'
import extensionMeta from '../../extension-meta.json'

/**
 * This hook returns the store for the current application extension.
 */
export const useExtensionStore = (defaultValue: any = {}) => {
    const state = useApplicationExtensionsStore(
        (state: Record<string, any>) => state.state[extensionMeta.id] || defaultValue
    )

    if (state === undefined) {
        throw new Error(
            `'useExtensionStore' could not find your current application extension state! Make sure you have added the store to your extension.`
        )
    }

    return state
}
