/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DEVELOPMENT_ORIGIN, getParentOrigin, isOriginTrusted} from '../../utils'

/** Detects whether the storefront is running in an iframe as part of Storefront Preview.
 * @private
 */
export const detectStorefrontPreview = () => {
    const parentOrigin = getParentOrigin()
    return isOriginTrusted(parentOrigin)
}

/** Returns the URL to load the Storefront Preview client script from the parent origin.
 * @private
 */
export const getClientScript = () => {
    const parentOrigin = getParentOrigin() ?? 'https://runtime.commercecloud.com'
    return parentOrigin === DEVELOPMENT_ORIGIN
        ? `${parentOrigin}/mobify/bundle/development/static/storefront-preview.js`
        : `${parentOrigin}/cc/b2c/preview/preview.client.js`
}
