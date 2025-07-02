/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ApplicationExtensionConfig} from '@salesforce/pwa-kit-extension-sdk/types'
//
// Configuration settings for connecting to the Commerce API.
type CommerceAPIConfig = {
    proxyPath: string
    parameters: {
        clientId: string
        organizationId: string
        shortCode: string
        siteId: string
    }
}

/**
 * This defines how your extension can be configured in the user's project. Please update it to your specific needs!
 */
export interface UserConfig extends ApplicationExtensionConfig {
    // react-router-style path to the new sample page
    path?: string
    commerceAPI: CommerceAPIConfig
    commerceAPIAuth: {
        propertyNameInLocals: string
    }
}

/**
 * When instantiating your extension, pwa-kit-extension-sdk will make sure to pass in the "complete" configuration, which has the merged user-defined and default configs.
 */
export type Config = Required<UserConfig>
