/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {Redirect} from 'react-router-dom'
// Pages
import * as Pages from '@salesforce/extension-chakra-storefront/pages'

// DEVELOPER NOTE: Update this to include correct resourceable components
const resourceableComponentsMap = {
    category: Pages.ProductList,
    product: Pages.ProductDetail
}

/**
 * Transforms a URL mapping from the Shopper Search getUrlMapping API to a routes config.
 * https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-seo?meta=getUrlMapping
 *
 * @param {Object} urlMapping - The URL mapping object.
 * @param {string} urlMapping.resourceType - The type of resource (e.g., 'product', 'category').
 * @param {string} urlMapping.resourceId - The ID of the resource.
 * @param {string} urlMapping.destinationUrl - The destination URL for redirects.
 * @param {Object} resourceableComponentsMap - A map of resource types to React components.
 */
export const transformUrlMappingToRoute = (path, urlMapping) => {
    let Component, props

    // Resource type is not defined for redirects with a URL destination
    const isRedirect = !urlMapping.resourceType

    if (isRedirect) {
        Component = Redirect
        props = {
            to: urlMapping.destinationUrl
        }
    } else {
        Component = resourceableComponentsMap[urlMapping.resourceType]
        props = {
            [`${urlMapping.resourceType}Id`]: urlMapping.resourceId
        }
    }

    return {
        path: path,
        // DEVELOPER NOTE: Here we would want to use a Loadable component as to not bloat the home page chunk size.
        component: Component,
        props
    }
}
