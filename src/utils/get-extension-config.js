/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

export const getExtensionConfig = () => {
    const extensions = getConfig()?.app?.extensions
    // console.log('getExtensionConfig: ', extensions[0][1])
    return extensions[0][1]
}
