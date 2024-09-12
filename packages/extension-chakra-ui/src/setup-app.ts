/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {IApplicationExtension, IRouteConfig} from '@salesforce/pwa-kit-react-sdk/ssr/universal/extensibility/types'
import {IConfig} from './types'
import withChakraUI from './components/with-chakra-ui'

class Sample implements IApplicationExtension {
    private config: IConfig;

    constructor(config: IConfig) {
        this.config = config
    }
    
    getName(): string {
        return 'sample'
    }

    extendApp(App: React.ComponentType): React.ComponentType {
        return withChakraUI(App)
    }

    extendRoutes(routes: IRouteConfig[]): IRouteConfig[] {
        return routes
    }
}

export default Sample
