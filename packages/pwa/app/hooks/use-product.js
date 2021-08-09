/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {useVariant} from './use-variant'
import {useIntl} from 'react-intl'
import {useVariationParams} from './use-variation-params'
import {useVariationAttributes} from './use-variation-attributes'

const OUT_OF_STOCK = 'OUT_OF_STOCK'
const UNFULFILLABLE = 'UNFULFILLABLE'

export const useProduct = (product) => {
    const intl = useIntl()

    // take the product quantity as initial value or set it to 1 by default
    const [quantity, setQuantity] = React.useState(product?.quantity || 1)
    const stockLevel = product?.inventory?.stockLevel || 0
    const variant = useVariant(product)
    const variationParams = useVariationParams(product)
    const variationAttributes = useVariationAttributes(product)
    const showLoading = !product
    const stepQuantity = product?.stepQuantity || 1

    // A product is considered out of stock if the stock level is 0 or if we have all our
    // variation attributes selected, but don't have a variant. We do this because the API
    // will sometimes return all the variants even if they are out of stock, but for other
    // products it won't.
    const isOutOfStock =
        !stockLevel ||
        (!variant && Object.keys(variationParams).length === variationAttributes.length)
    const unfulfillable = stockLevel < quantity

    const inventoryMessages = {
        [OUT_OF_STOCK]: intl.formatMessage({
            defaultMessage: 'Out of stock'
        }),
        [UNFULFILLABLE]: intl.formatMessage(
            {
                defaultMessage: 'Only {stockLevel} Left!'
            },
            {stockLevel}
        )
    }
    const showInventoryMessage = isOutOfStock || unfulfillable
    const inventoryMessage =
        (isOutOfStock && inventoryMessages[OUT_OF_STOCK]) ||
        (unfulfillable && inventoryMessages[UNFULFILLABLE])

    return {
        showLoading,
        showInventoryMessage,
        inventoryMessage,
        variationAttributes,
        quantity,
        stepQuantity,
        variationParams,
        setQuantity,
        variant,
        stockLevel
    }
}
