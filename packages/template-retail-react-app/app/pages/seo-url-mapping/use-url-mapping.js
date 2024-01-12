/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useQuery} from '@tanstack/react-query'

// NOTE: This is sample data as the `commerce-sdk-isomorphic` currently does not support
// the Shopper-SEO endpoints and thus our `commerce-sdk-react` does not either.
// NOTE: On the server out rendering is a 2-step process, we render first to get the hooks
// that should be executed, then we render a second time to ensure the html rendered has all
// the data in it. Because of that, we won't know what product/category/context data to render
// as it will never be fetched. The solution shold be to "pre-populate" the hook cache.
const SEO_URL_MAPPINGS = {
    '/custom-category-path': {
        resourceId: 'mens-accessories-gloves',
        resourceType: 'CATEGORY',
        refinements: undefined
    },
    '/custom-product-path': {
        resourceId: '66936828M',
        resourceType: 'PRODUCT'
    },
    '/global/en-GB/product/52416781M': {
        redirectUrl: {
            copySourceParams: false,
            destinationId: "42416786M",
            destinationType: "product",
            statusCode: "301",
            destinationUrl: "https://staging-c7testing-cdd.demandware.net/s/SiteGenesis/casual%20to%20dressy%20trousers/?lang=en_US"
        },
        resourceId: '52416781M',
        resourceType: 'product'
    }
} 

// Small inline hook so that the commenent definition will look as close to the final
// implimentation as possible. E.g. we are emulating a `commerce-sdk-react` hook here.
export const useUrlMapping = ({parameters}) => {
    return useQuery(['url-mappings', parameters.urlSegment], async () => {
        // Synthetic wait
        // await new Promise((resolve) => setTimeout(resolve, 100))
        const match = SEO_URL_MAPPINGS[parameters.urlSegment]

        if (!match) {
            throw new Error('No seo url found!')
        }
        return match
    })  
}