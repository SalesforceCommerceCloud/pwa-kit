/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useLocation, Redirect} from 'react-router-dom'

import {useUrlMapping} from './use-url-mapping'
import PageNotFound from '../page-not-found/index'
import ProductDetail from '../product-detail/index'
import ProductList from '../product-list/index'

/**
 * 
 */
const SeoUrlMapping = () => {
    const {pathname, search} = useLocation()
    let urlSegment
    const searchParams = new URLSearchParams(search)
    const locationPathname = searchParams.get('locationPathname')
    const locationSearch = searchParams.get('locationSearch')
    if (locationPathname) {
        urlSegment = `${locationPathname}${locationSearch}`
    } else {
        urlSegment = pathname
    }
    const {data = {}, error, isLoading} = useUrlMapping({
        parameters: {
            urlSegment
        }
    })
    
    const {resourceId, resourceType, refinements, redirectUrl} = data

    if (redirectUrl) {
        // This is were we will take the redrect information and generate a PWA link from it and redirect to it.
        // DEVELOPER NOTE: `destinationUrl` is also included in the data, this could be used is the partner has 
        // change thier url schema to be just like the SFRA site.
        // DEVELOPER NOTE: Can a redirect goto a custom url mapping? I don't think we should support this initially.
        return <Redirect to={`/global/en-GB/${redirectUrl.destinationType}/${redirectUrl.destinationId}`} />
    }

    if (error) {
        // DEVELOPER NOTE: This pathname is important!
        if (!!locationPathname) {
            return <Redirect to={locationPathname} />
        }

        return <PageNotFound />
    }

    if (isLoading) {
        return <div>LOADING...</div>
    }

    switch (resourceType) {
        case 'CATEGORY':
            return <ProductList categoryId={resourceId} refinements={refinements} />
        case 'PRODUCT':
            return <ProductDetail productId={resourceId} />
        // Currently we will not support custom pages.
        // case 'CONTENT_ASSET':
        //     return <Page />
        default:
            return <PageNotFound />
    }
}

SeoUrlMapping.getTemplateName = () => 'seo-url-mapping'

export default SeoUrlMapping
