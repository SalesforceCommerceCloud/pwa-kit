/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import {useVariant} from '@salesforce/retail-react-app/app/hooks/use-variant'
import {useIntl} from 'react-intl'
import {useVariationParams} from '@salesforce/retail-react-app/app/hooks/use-variation-params'
import {useVariationAttributes} from '@salesforce/retail-react-app/app/hooks/use-variation-attributes'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'

const OUT_OF_STOCK = 'OUT_OF_STOCK'
const UNFULFILLABLE = 'UNFULFILLABLE'

const getInventoryById = (product, inventoryId) => {
    if (!inventoryId || !product?.inventories) {
        return null
    }
    return product.inventories.find((inv) => inv.id === inventoryId)
}

// TODO: This needs to be refactored.
export const useDerivedProduct = (
    product,
    isProductPartOfSet = false,
    isProductPartOfBundle = false
) => {
    const showLoading = !product
    const isProductABundle = product?.type?.bundle
    const stockLevel = product?.inventory?.stockLevel || 0
    const stepQuantity = product?.stepQuantity || 1
    const minOrderQuantity = stockLevel > 0 ? product?.minOrderQuantity || 1 : 0
    const initialQuantity = product?.quantity || product?.minOrderQuantity || 1

    // used for product bundles when there are multiple products
    const lowestStockLevelProductName = product?.inventory?.lowestStockLevelProductName
    const intl = useIntl()
    const variant = useVariant(product, isProductPartOfSet, isProductPartOfBundle)
    const isStandardProduct = product?.type?.item
    const variationParams = useVariationParams(product, isProductPartOfSet, isProductPartOfBundle)
    const variationAttributes = useVariationAttributes(
        product,
        isProductPartOfSet,
        isProductPartOfBundle
    )
    const [quantity, setQuantity] = useState(initialQuantity)
    const {selectedStore} = useSelectedStore()

    const selectedStoreInventory = getInventoryById(product, selectedStore?.inventoryId)
    const selectedStoreStockLevel = selectedStoreInventory?.stockLevel || 0
    // selectedStoreStockLevel and selectedStoreInventory are already variant specific,
    // so we don't need to check for variation attributes
    const isSelectedStoreOutOfStock =
        !selectedStoreStockLevel ||
        selectedStoreStockLevel < quantity ||
        !selectedStoreInventory?.orderable
    // A product is considered out of stock if the stock level is 0 or if we have all our
    // variation attributes selected, but don't have a variant. We do this because the API
    // will sometimes return all the variants even if they are out of stock, but for other
    // products it won't.
    const isOutOfStock =
        !stockLevel ||
        (!isProductABundle &&
            !variant &&
            !isStandardProduct &&
            Object.keys(variationParams).length === variationAttributes.length) ||
        (!isProductABundle && variant && !variant.orderable)
    const unfulfillable = stockLevel < quantity
    const inventoryMessages = {
        [OUT_OF_STOCK]: intl.formatMessage({
            defaultMessage: 'Out of stock',
            id: 'use_product.message.out_of_stock'
        }),
        [UNFULFILLABLE]: lowestStockLevelProductName
            ? intl.formatMessage(
                  {
                      defaultMessage: 'Only {stockLevel} left for {productName}!',
                      id: 'use_product.message.inventory_remaining_for_product'
                  },
                  {stockLevel, productName: lowestStockLevelProductName}
              )
            : intl.formatMessage(
                  {
                      defaultMessage: 'Only {stockLevel} left!',
                      id: 'use_product.message.inventory_remaining'
                  },
                  {stockLevel}
              )
    }

    // showInventoryMessage controls if add to cart button is disabled
    const showInventoryMessage =
        (variant || isProductABundle || isStandardProduct) && (isOutOfStock || unfulfillable)
    const inventoryMessage =
        (isOutOfStock && inventoryMessages[OUT_OF_STOCK]) ||
        (unfulfillable && inventoryMessages[UNFULFILLABLE])

    // If the `initialQuantity` changes, update the state. This typically happens
    // when either the master product changes, or the inventory of the product changes
    // from out-of-stock to in-stock or vice versa.
    useEffect(() => {
        setQuantity(initialQuantity)
    }, [initialQuantity])

    return {
        showLoading,
        showInventoryMessage,
        inventoryMessage,
        variationAttributes,
        quantity,
        minOrderQuantity,
        stepQuantity,
        variationParams,
        setQuantity,
        variant,
        stockLevel,
        isOutOfStock,
        unfulfillable,
        isSelectedStoreOutOfStock,
        selectedStore
    }
}
