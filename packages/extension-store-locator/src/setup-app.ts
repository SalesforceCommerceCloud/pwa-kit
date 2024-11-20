/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'
import {RouteProps} from 'react-router-dom'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/react'

// Local Imports
import {withOptionalChakra} from './components/store-locator/with-optional-chakra-provider'
import {withStoreLocator} from './components/store-locator/with-store-locator'
import {Config} from './types'

import StoreLocatorPage from './pages/store-locator'

class StoreLocatorExtension extends ApplicationExtension<Config> {
    DEFAULT_PATH = '/store-locator'
    DEFAULT_RADIUS = 100
    DEFAULT_RADIUS_UNIT = 'km'
    DEFAULT_PAGE_SIZE = 10

    extendApp<T>(App: React.ComponentType<T>): React.ComponentType<T> {
        const config = this.getConfig()

        if (!config.supportedCountries || config.supportedCountries.length === 0) {
            console.warn(
                '[extension-store-locator] Missing supportedCountries, this extension will not work.'
            )
        }

        return withStoreLocator(withOptionalChakra(App), {
            path: config.path ?? this.DEFAULT_PATH,
            radius: config.radius ?? this.DEFAULT_RADIUS,
            radiusUnit: config.radiusUnit ?? this.DEFAULT_RADIUS_UNIT,
            defaultPageSize: config.defaultPageSize ?? this.DEFAULT_PAGE_SIZE,
            defaultCountry: config.defaultCountry ?? '',
            defaultCountryCode: config.defaultCountryCode ?? '',
            defaultPostalCode: config.defaultPostalCode ?? '',
            supportedCountries: config.supportedCountries ?? []
        })
    }

    extendRoutes(routes: RouteProps[]): RouteProps[] {
        return [
            {
                exact: true,
                path: this.getConfig().path || this.DEFAULT_PATH,
                component: StoreLocatorPage
            },
            ...routes
        ]
    }
}

export default StoreLocatorExtension
