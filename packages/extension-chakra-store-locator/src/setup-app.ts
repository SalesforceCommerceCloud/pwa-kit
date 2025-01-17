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
import {applyHOCs} from '@salesforce/pwa-kit-extension-sdk/react/utils'

// Local Imports
import {withOptionalChakra} from './components/with-optional-chakra-provider'
import {withOptionalCommerceSdkReactProvider} from './components/with-optional-commerce-sdk-react-provider'
import {withStoreLocator} from './components/with-store-locator'
import {Config} from './types'

import StoreLocatorPage from './pages/store-locator'
import {logger} from './logger'
import extensionMeta from '../extension-meta.json'

class StoreLocatorExtension extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id

    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        const config = this.getConfig()

        if (!config.supportedCountries || config.supportedCountries.length === 0) {
            logger.error(
                '[extension-chakra-store-locator] Missing supportedCountries, this extension will not work.'
            )
        }

        const HOCs = [
            (component: React.ComponentType<any>) => withStoreLocator(component, config),
            (component: React.ComponentType<any>) =>
                withOptionalCommerceSdkReactProvider(component, config),
            (component: React.ComponentType<any>) => withOptionalChakra(component)
        ]

        return applyHOCs(App, HOCs)
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
