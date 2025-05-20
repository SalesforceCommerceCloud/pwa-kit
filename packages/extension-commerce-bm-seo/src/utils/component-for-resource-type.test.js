/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {getComponentForResourceType} from './component-for-resource-type'

// Mock components
const ProductDetail = () => <div>Product</div>
ProductDetail.displayName = 'ProductDetail'
const CategoryDetail = () => <div>Category</div>
CategoryDetail.displayName = 'CategoryDetail'

const routes = [
    {path: '/product/:id', component: ProductDetail},
    {path: '/category/:id', component: CategoryDetail}
]

const resourceTypeToComponentMap = {
    product: 'ProductDetail',
    category: 'CategoryDetail'
}

describe('getComponentForResourceType', () => {
    it('returns the correct component for a matching resourceType', () => {
        const Comp = getComponentForResourceType(routes, resourceTypeToComponentMap, 'product')
        expect(Comp).toBe(ProductDetail)
    })

    it('returns undefined if no matching component is found', () => {
        const Comp = getComponentForResourceType(routes, resourceTypeToComponentMap, 'notfound')
        expect(Comp).toBeUndefined()
    })

    it('returns undefined if routes is empty', () => {
        const Comp = getComponentForResourceType([], resourceTypeToComponentMap, 'product')
        expect(Comp).toBeUndefined()
    })

    it('returns undefined if resourceType is not in the map', () => {
        const Comp = getComponentForResourceType(routes, {}, 'product')
        expect(Comp).toBeUndefined()
    })
})
