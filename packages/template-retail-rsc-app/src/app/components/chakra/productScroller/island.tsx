/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
// import {ChakraProvider} from '@chakra-ui/react'
// import theme from '../../../../theme/index'
import ProductScrollerClientWrapper from './clientWrapper'
// import {useClientSideProductSearch} from '@/app/utils/api/commerce-client.client'
import {fetchSearchProducts} from '@/app/utils/api/commerce-client.server'
import {getCommerceApiToken} from '@/app/utils/api/commerce-api'
import {getServerContext} from '@/app/utils/serverContext'
import {RequestContext} from '@/app/utils/requestContext'

interface ProductScrollerIslandProps {
    title?: string
    categoryId?: string
    limit?: number
    [key: string]: any
}

const ChakraProductScrollerIsland = async (props: ProductScrollerIslandProps) => {
    let products: ShopperSearchTypes.ProductSearchHit[] = []
    let loading = true
    try {
        // In your component function:
        const request = getServerContext(RequestContext)
        if (!request) {
            throw new Error('Unexpected State: No request context provided.')
        }
        const [session] = await getCommerceApiToken(request)
        console.time('ProductCarousel API call')
        const searchResult = await fetchSearchProducts(session.data, {
            categoryId: 'root',
            limit: 8, // Reduced from 12 to load faster
            expand: ['images', 'prices'] // Only fetch essential data for carousel view
        })
        console.timeEnd('ProductCarousel API call')
        products = searchResult.hits ?? []
        loading = false
    } catch (error) {
        console.error('ProductScroller API error:', error)
        loading = false
        return (
            <div className="text-center py-12">
                <p className="text-lg text-gray-500">Unable to load products at this time.</p>
            </div>
        )
    }

    return <ProductScrollerClientWrapper {...props} products={products} isLoading={loading} />
}

export default ChakraProductScrollerIsland
