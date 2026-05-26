/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Build a regex that excludes node_modules from babel-loader, except for the
 * extensibility base package (e.g. @salesforce/retail-react-app) which must be
 * transpiled so overrides resolve correctly.
 *
 * @param {string} sep - Path separator for the target platform ('/' or '\\')
 * @param {string} extendsPackage - The package name to allow through (e.g. '@salesforce/retail-react-app')
 * @returns {RegExp} A regex matching node_modules paths, with a negative lookahead for the extends package
 */
export const buildBabelExcludeRegex = (sep, extendsPackage) => {
    const escapedSep = sep.replace(/\\/g, '\\\\')
    const extendsRegex = extendsPackage.replace('/', escapedSep)
    return new RegExp(`${escapedSep}node_modules(?!${escapedSep}${extendsRegex})`)
}
