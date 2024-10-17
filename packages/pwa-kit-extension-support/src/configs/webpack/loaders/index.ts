/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export * from './extensions-loader'

export const ruleForApplicationExtensibility = (findDepInStack: any, options: any) => {
    const {target} = options
    const testRegexStr = `${target === 'node' ? 'express' : 'react'}\/assets\/application-extensions-placeholder\.js`
    
    // TODO: User the newly created utility getApplicationExtensionInfo to get the information required here. 
    // NOTE: Passing around the `getConfig` is going to be interesting to make it look nice. Might jsut abandon it???
    return {
        test: new RegExp(testRegexStr, 'i'),
        use: {
            loader: findDepInStack('@salesforce/pwa-kit-extension-support/configs/webpack/loaders/extensions-loader'),
            options: {
                // pkg,
                // getConfig,
                // target: 'node'
                ...options
            }
        }
    } 
}
