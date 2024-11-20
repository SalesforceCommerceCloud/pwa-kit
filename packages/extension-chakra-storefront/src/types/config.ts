/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ApplicationExtensionConfig} from '@salesforce/pwa-kit-extension-sdk/types'

// Represents a locale with its ID and preferred currency.
type Locale = {
    id: string
    preferredCurrency: string
}

// Defines localization settings for a site, including currencies and supported locales.
type Localization = {
    supportedCurrencies: string[]
    defaultCurrency: string
    defaultLocale: string
    supportedLocales: Locale[]
}

// Represents a site configuration, including its localization details.
type Site = {
    id: string
    l10n: Localization
}

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

// Configuration settings for connecting to the Einstein API.
type EinsteinAPI = {
    host: string
    einsteinId: string
    siteId: string
    isProduction: boolean
}

// Indicates where a value should be placed in the URL.
type UrlPlacement = 'path' | 'query_string' | 'none'

// Main configuration type, extending ApplicationExtensionConfig for additional settings.
export interface Config extends ApplicationExtensionConfig {
    activeDataEnabled: boolean // default = false
    commerceAPI: CommerceAPIConfig
    defaultSite: Site['id']
    einsteinAPI: EinsteinAPI
    enabled: boolean
    pages: Record<string, boolean>
    siteAliases: Record<Site['id'], string>
    sites: Site[]
    url: {
        site: UrlPlacement
        locale: UrlPlacement
        showDefaults: boolean
        interpretPlusSignAsSpace: boolean
    }
    // TODO: Add pages to enabled disable easily. ✅
    // TODO: Move static assets to proper destination. ✅
    // TODO: Fix getting static image.. we need a way to get the id of the extension. ✅ We need a way to get
    // TODO: Think about the _error and how it works with extensions, right now I don't think it does
    // anything. ✅ We are only going to provide the component, it's on your to hook up the error component.
    // TODO: Add default config value ✅
    // TODO: Get auto integration of store locator back to working ✅ [Ticket created]
    // TODO: Test overriding page ✅

    // TODO: Write tests for HOCs
    // TODO: Write README, including steps to install.
    // TODO: Fix tests
}
