/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/react'
import extensionMeta from '../../extension-meta.json'

/**
 * This hook returns the configuration for the current application extension.
 */
export const useExtensionConfig = () => {
    const extension = useApplicationExtension(extensionMeta.id)
    if (extension === undefined) {
        throw new Error(`'useExtensionConfig' could not find your current application extension instance!`)
    }
    return extension?.getConfig()
}
