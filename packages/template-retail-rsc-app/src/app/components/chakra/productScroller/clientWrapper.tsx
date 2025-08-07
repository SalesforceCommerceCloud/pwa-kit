'use client'

import React, {useEffect, useState} from 'react'
import {ChakraProvider} from '@chakra-ui/react'
import theme from '../../../../theme/index'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import ProductScroller from './component'

interface ProductScrollerClientWrapperProps {
    products: ShopperSearchTypes.ProductSearchHit[]
    isLoading: boolean
    title?: string
    [key: string]: any
}

const ProductScrollerClientWrapper = (props: ProductScrollerClientWrapperProps) => {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    // Don't render anything on the server side
    if (!isClient) {
        return (
            <div className="py-16">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex space-x-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({length: 4}).map((_, i) => (
                            <div key={i} className="flex-none w-60 md:w-72">
                                <div className="aspect-square bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                                <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ChakraProvider value={theme}>
            <ProductScroller {...props} />
        </ChakraProvider>
    )
}

export default ProductScrollerClientWrapper
