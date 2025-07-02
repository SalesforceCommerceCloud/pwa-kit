/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useMemo} from 'react'
import {keepPreviousData} from '@tanstack/react-query'
import {useProducts} from '@salesforce/commerce-sdk-react'

/**
 * Custom hook to handle all product data fetching and processing for cart
 * @param {Object} basket - The current basket data
 * @returns {Object} Object containing products data and loading states
 */
export const useCartProducts = (basket) => {
    // Main product IDs from basket items
    const productIds = basket?.productItems?.map(({productId}) => productId).join(',') ?? ''
    
    // Fetch main products
    const {data: products, isPending: isProductsPending} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true,
                perPricebook: true
            }
        },
        {
            enabled: Boolean(productIds),
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    /***************** Product Bundles ************************/
    const bundleChildVariantIds = []
    basket?.productItems?.forEach((productItem) => {
        productItem?.bundledProductItems?.forEach((childProduct) => {
            bundleChildVariantIds.push(childProduct.productId)
        })
    })

    const {data: bundleChildProductData} = useProducts(
        {
            parameters: {
                ids: bundleChildVariantIds?.join(','),
                allImages: false,
                expand: ['availability', 'variations'],
                select: '(data.(id,inventory))'
            }
        },
        {
            enabled: bundleChildVariantIds?.length > 0,
            placeholderData: keepPreviousData,
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    // We use the `products` object to reference products by itemId instead of productId
    // Since with product bundles, even though the parent productId is the same,
    // variant selection of the bundle children can be different,
    // and require unique references to each product bundle
    const productsByItemId = useMemo(() => {
        const updateProductsByItemId = {}
        basket?.productItems?.forEach((productItem) => {
            let currentProduct = products?.[productItem?.productId]

            // calculate inventory for product bundles based on availability of children
            if (productItem?.bundledProductItems && bundleChildProductData) {
                let lowestStockLevel =
                    currentProduct?.inventory?.stockLevel ?? Number.MAX_SAFE_INTEGER
                let productWithLowestInventory = ''
                productItem?.bundledProductItems.forEach((bundleChild) => {
                    const bundleChildStockLevel =
                        bundleChildProductData?.[bundleChild.productId]?.inventory?.stockLevel ??
                        Number.MAX_SAFE_INTEGER
                    lowestStockLevel = Math.min(lowestStockLevel, bundleChildStockLevel)
                    if (lowestStockLevel === bundleChildStockLevel)
                        productWithLowestInventory = bundleChild.productName
                })

                if (currentProduct?.inventory) {
                    currentProduct = {
                        ...currentProduct,
                        inventory: {
                            ...currentProduct.inventory,
                            stockLevel: lowestStockLevel,
                            lowestStockLevelProductName: productWithLowestInventory
                        }
                    }
                }
            }
            updateProductsByItemId[productItem.itemId] = currentProduct
        })
        return updateProductsByItemId
    }, [basket, products, bundleChildProductData])

    return {
        products,
        isProductsPending,
        bundleChildProductData,
        productsByItemId
    }
} 