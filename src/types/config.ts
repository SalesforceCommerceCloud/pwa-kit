/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type {ApplicationExtensionConfig as BaseApplicationExtensionConfig} from '@salesforce/pwa-kit-extension-sdk/types'
type Pages = typeof import('../pages')

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

type ShippingCountry = {
    value: string
    label: string
}

// Indicates where a value should be placed in the URL.
type UrlPlacement = 'path' | 'query_string' | 'none'

// Default configuration type
// should we keep string | string[] type here??
type DefaultPageConfig = {
    path: string
}

type CustomPageConfigs = {
    Account: DefaultPageConfig & {
        orderSearchParam: {
            limit: number
            offset: number
            sort: string
            refine: []
        }
    }
    Checkout: DefaultPageConfig & {
        shippingCountryCode: ShippingCountry[]
    }
    Home: DefaultPageConfig & {
        productLimit?: number
        mainCategory?: string
    }
    ProductList: DefaultPageConfig & {
        imageViewType: 'large'
        selectableAttributeId: 'color'
        filterAccordionSate: string
    }
}

// Combine inferred pages with specific configurations
type PageConfigs = {
    [K in keyof Pages]: K extends keyof CustomPageConfigs ? CustomPageConfigs[K] : DefaultPageConfig
}
/**
 * This defines how your extension can be configured in the user's project. Please update it to your specific needs!
 */
export interface UserConfig extends BaseApplicationExtensionConfig {
    activeDataEnabled?: boolean // default = false
    commerceAPI: CommerceAPIConfig
    categoryNav: {
        defaultNavSsrDepth: number
        defaultRootCategory: string | number
    }
    defaultSite: Site['id']
    defaultAppLocale: string
    defaultSiteTitle: string
    einsteinAPI: EinsteinAPI
    maxCacheAge: number
    pages?: {
        [K in keyof PageConfigs]: false | PageConfigs[K]
    }
    search: {
        defaultLimitValues: number[]
        defaultSearchParams: {
            limit: number
            offset: number
            sort: string
            refine: []
        }
        recentSearchKey: string
        recentSearchLimit: number
        recentSearchMinLength: number
    }
    siteAliases?: Record<Site['id'], string>
    sites: Site[]
    staleWhileRevalidate: number
    url?: {
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

/**
 * When instantiating your extension, pwa-kit-extension-sdk will make sure to pass in the "complete" configuration, which has the merged user-defined and default configs.
 */
export type Config = Required<UserConfig>

export type ApplicationExtensionConfig = BaseApplicationExtensionConfig
