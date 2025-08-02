'use client'
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {ChakraProvider} from '@chakra-ui/react'
import theme from '../../../../theme/index'
import ProductScroller from './component'
import {useClientSideProductSearch} from '@/app/utils/api/commerce-client.client'

interface ProductScrollerIslandProps {
    title?: string
    categoryId?: string
    limit?: number
    [key: string]: any
}

// Client component island with ChakraProvider and real API data fetching
const ChakraProductScrollerIsland = (props: ProductScrollerIslandProps) => {
    const {fetchProducts, products, loading, error} = useClientSideProductSearch()

    useEffect(() => {
        // Fetch products on component mount
        fetchProducts({
            categoryId: props.categoryId || 'root',
            limit: props.limit || 8,
            expand: ['images', 'prices']
        })
    }, [fetchProducts, props.categoryId, props.limit])

    // Handle error state
    if (error) {
        console.error('ProductScroller API error:', error)
        return (
            <ChakraProvider value={theme}>
                <div className="text-center py-12">
                    <p className="text-lg text-gray-500">Unable to load products at this time.</p>
                </div>
            </ChakraProvider>
        )
    }

    return (
        <ChakraProvider value={theme}>
            <ProductScroller {...props} products={products} isLoading={loading} />
        </ChakraProvider>
    )
}

ChakraProductScrollerIsland.displayName = 'ChakraProductScrollerIsland'

export default ChakraProductScrollerIsland
