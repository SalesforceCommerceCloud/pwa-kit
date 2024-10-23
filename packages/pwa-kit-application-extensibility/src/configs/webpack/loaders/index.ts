/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Local
import {getApplicationExtensionInfo} from '../../../shared/utils'

// Exports
export * from './extensions-loader'

const LOADER_IMPORT =
    '@salesforce/pwa-kit-application-extensibility/configs/webpack/loaders/extensions-loader'
const DEFAULT_TARGET = 'node'

export const ruleForApplicationExtensibility = (options: any = {}) => {
    const {loaderResolver, loaderOptions = {}} = options
    const {target = DEFAULT_TARGET, appConfig} = loaderOptions

    // TODO: User the newly created utility getApplicationExtensionInfo to get the information required here.
    // NOTE: Passing around the `getConfig` is going to be interesting to make it look nice. Might just abandon it???
    return {
        test: new RegExp(
            `${
                target === 'node' ? 'express' : 'react'
            }/assets/application-extensions-placeholder.js`,
            'i'
        ),
        use: {
            loader: loaderResolver ? loaderResolver(LOADER_IMPORT) : LOADER_IMPORT,
            options: {
                ...getApplicationExtensionInfo(appConfig),
                target
            }
        }
    }
}
