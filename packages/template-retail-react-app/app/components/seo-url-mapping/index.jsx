/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import {Redirect, Route, Switch, useLocation} from 'react-router-dom'
import {useUrlMapping} from '@salesforce/commerce-sdk-react'
import loadable from '@loadable/component'
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'


const fallback = <Skeleton height="75vh" width="100%" />

const ProductDetail = loadable(() => import('../../pages/product-detail'), {fallback})
const ProductList = loadable(() => import('../../pages/product-list'), {
    fallback
})
// import ProductDetail from '../../pages/product-detail/index'
// import ProductList from '../../pages/product-list/index'
const COMPONENT_MAP = {
    category: ProductList,
    product: ProductDetail
}
const getComponentForMapping = (mapping = {}, location) => {
    const {destinationUrl, resourceId, resourceType} = mapping
    const isRedirect = !(resourceId && resourceType)

    if (isRedirect) {
        // NOTE: Redirects on the server arn't working.. figure out why.
        const CannedRedirect = () => <Redirect to={{
            pathname: destinationUrl,
            search: location.search
        }} />
        CannedRedirect.displayName = 'Redirect'
        return CannedRedirect
    }

    const Component = COMPONENT_MAP[resourceType]

    return () => <Component resourceId={resourceId} />

}
const SeoUrlMapping = ({routes = []}) => {
    const location = useLocation()
    console.log('location: ', location)
    const {data, isLoading, isFetching} = useUrlMapping(
        {
            parameters: {
                urlSegment: location.pathname
            }
        },
        {
            enabled: true
        }
    )

    const MappedComponent = data ? getComponentForMapping(data, location) : undefined
    
    if (MappedComponent && MappedComponent.displayName == 'Redirect') {
        return <MappedComponent />
    }
    
    return (
        <Fragment>
            <Fragment>
                {MappedComponent && <Route path={location.pathname} component={MappedComponent} /> }
            </Fragment>
            {/* Only render the application routes when you are not fetching an SEO url mapping. */}           
            <Fragment>
                {routes.map(({path, component}) => {
                    return (
                        <Route exact={path.includes('/:') ? false : true} path={path} component={component} />
                    )
                })}
            </Fragment>
        </Fragment>
    )
}


SeoUrlMapping.displayName = 'SeoUrlMapping'

export default SeoUrlMapping