/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Platform Imports
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

export const getExtensionConfig = () => {
    const extensions = getConfig()?.app?.extensions
    const extensionEntry = extensions.find(
        ([id]) => id === '@salesforce/extension-chakra-storefront'
    )

    // TODO: This isn't the right way to do this for multiple reasons.
    // 1. The config isn't always in tupal format so this might break.
    // 2. The config isn't representitive of the actual configuration as it might not include defualt values
    // that aren't supplied in the configuration file.
    //
    // NOTE: We should instead be getting the configuration from the extension instance via the getConfig method.
    // We can get the extensions via the getApplicationExtensions function, but that is asyn, or get it via the
    // useApplicationExtensions hook. But that would me that we have to refactor all the multi-site work as it
    // is a set of utilities that doesn't have access to react context to get the config, so we'd have to pass it in.
    return extensionEntry[1]
}
