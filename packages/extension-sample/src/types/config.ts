/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    ApplicationExtensionConfig
} from '@salesforce/pwa-kit-runtime/ssr/server/extensibility'

// This is where you are going to define the configuration type for your App Extension. This is used in the constructor
// of the extension itself. Update this config type to your specific needs!
// This config will be shared for extending the React and Express apps.
export interface Config extends ApplicationExtensionConfig {
    // react-router-style path to the new sample page
    path?: string
}
