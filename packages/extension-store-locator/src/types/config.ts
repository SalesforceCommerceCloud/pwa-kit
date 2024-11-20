/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ApplicationExtensionConfig} from '@salesforce/pwa-kit-extension-sdk/types'

// This is where you are going to define the configuration type for your App Extension. This is used in the constructor
// of the extension itself. Update this config type to your specific needs!
export interface Config extends ApplicationExtensionConfig {
    path?: string
    radius: number
    radiusUnit: string
    defaultPageSize: number
    defaultCountry: string
    defaultCountryCode: string
    defaultPostalCode: string
    supportedCountries: Array<{
        countryCode: string
        countryName: string
    }>
}
