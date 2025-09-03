/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {normalizeSetBundleProduct} from '@salesforce/retail-react-app/app/utils/product-utils'

/**
 * Custom hook to manage product inventory calculations for different product types.
 * Handles inventory normalization for sets and bundles, meaning the master product inventory
 * is reduced to represent the inventory of the selected sub product variants.
 *
 * @param {Object} productResponse - The raw product data from the API
 * @param {Object} variantProductData - Variant data for child products
 * @param {string} selectedInventoryId - ID of the selected store inventory
 * @param {boolean} isProductASet - Whether the product is a set
 * @param {boolean} isProductABundle - Whether the product is a bundle
 * @returns {Object} The normalized product with calculated inventory
 */
export const useProductInventory = (
    productResponse,
    variantProductData,
    selectedInventoryId,
    isProductASet,
    isProductABundle
) => {
    const product = useMemo(() => {
        if (!isProductASet && !isProductABundle) {
            return productResponse
        }

        const normalizedProduct = normalizeSetBundleProduct(productResponse)

        if (!normalizedProduct.childProducts) {
            return normalizedProduct
        }

        // normalizeSetBundleProduct already creates deep clones for safe mutation
        const updatedChildProducts = normalizedProduct.childProducts

        // Update base product inventory to inventory variant selections
        if (variantProductData?.data) {
            updatedChildProducts.forEach(({product: childProduct}, index) => {
                const matchingChildProduct = variantProductData.data.find(
                    (variantChild) => variantChild?.master?.masterId === childProduct.id
                )
                if (matchingChildProduct) {
                    updatedChildProducts[index].product = {
                        ...childProduct,
                        inventory: matchingChildProduct.inventory,
                        inventories: matchingChildProduct.inventories
                    }
                }
            })
        }

        // Calculate lowest inventory for product sets and update normalizedProduct directly
        if (isProductASet) {
            let lowestInventory
            let missingInventory = false
            let lowestStoreInventory
            let missingStoreInventory = false
            updatedChildProducts.forEach(({product: childProduct}) => {
                if (!childProduct.inventory) {
                    missingInventory = true
                } else if (!(lowestInventory?.stockLevel < childProduct.inventory.stockLevel)) {
                    lowestInventory = {...childProduct.inventory}
                    lowestInventory.lowestStockLevelProductName = childProduct.name
                }

                const selectedStoreInventory = childProduct.inventories?.find(
                    (inventory) => inventory.id === selectedInventoryId
                )
                if (!selectedStoreInventory) {
                    missingStoreInventory = true
                } else if (
                    !(lowestStoreInventory?.stockLevel < selectedStoreInventory.stockLevel)
                ) {
                    lowestStoreInventory = {...selectedStoreInventory}
                    lowestStoreInventory.lowestStockLevelProductName = childProduct.name
                }
            })

            // Update normalizedProduct directly with the lowest values
            if (!missingInventory && lowestInventory) {
                normalizedProduct.inventory = lowestInventory
            }
            if (!missingStoreInventory && lowestStoreInventory) {
                normalizedProduct.inventories = [lowestStoreInventory]
            }
        }

        return normalizedProduct
    }, [productResponse, variantProductData, selectedInventoryId])

    return product
}
