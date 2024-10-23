/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    Application as ExpressApplication,
    ApplicationExtension as ExpressApplicationExtension
} from '@salesforce/pwa-kit-runtime/ssr/server/extensibility'
import {ServerExtensionConfig as Config} from './types'

class SampleExtension extends ExpressApplicationExtension<Config> {
    extendApp(app: ExpressApplication): ExpressApplication {
        return app
    }
}

export default SampleExtension
