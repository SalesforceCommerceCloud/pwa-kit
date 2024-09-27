/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {ApplicationExtension} from '@salesforce/pwa-kit-react-sdk/ssr/universal/extensibility'
import {IRouteConfig} from '@salesforce/pwa-kit-react-sdk/ssr/universal/extensibility/types'

import withChakraUI from './components/with-chakra-ui'

class Sample extends ApplicationExtension {
    
    extendApp(App: React.ComponentType): React.ComponentType {
        return withChakraUI(App)
    }

    extendRoutes(routes: IRouteConfig[]): IRouteConfig[] {
        return routes
    }
}

export default Sample
