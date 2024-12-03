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
import extensionMeta from '../extension-meta.json'

class StoreLocatorExtension extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id

    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        const config = this.getConfig()

        if (!config.supportedCountries || config.supportedCountries.length === 0) {
            // TODO: use our logger
            console.warn(
                '[extension-store-locator] Missing supportedCountries, this extension will not work.'
            )
        }

        return withStoreLocator(withOptionalChakra(App), {
            path: config.path,
            radius: config.radius,
            radiusUnit: config.radiusUnit,
            defaultPageSize: config.defaultPageSize,
            defaultCountry: config.defaultCountry,
            defaultCountryCode: config.defaultCountryCode,
            defaultPostalCode: config.defaultPostalCode,
            supportedCountries: config.supportedCountries
        })
    }

    extendRoutes(routes: RouteProps[]): RouteProps[] {
        return [
            {
                exact: true,
                path: this.getConfig().path,
                component: StoreLocatorPage
            },
            ...routes
        ]
    }
}

export default StoreLocatorExtension
