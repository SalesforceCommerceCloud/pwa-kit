/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {productUrlBuilder, rebuildPathWithParams} from '@salesforce/retail-react-app/app/utils/url'

/**
 * Get the human-friendly version of the variation values that users have selected.
 * Useful for displaying these values in the UI.
 *
 * @param {Object} variationAttributes - The products variation attributes.
 * @param {Object} values - The variations selected attribute values.
 * @returns {Object} - A key value map of the display name and display value.
 *
 * @example
 * const displayValues = getDisplayVariationValues(
 *     [ { "id": "color", "name": "Colour", "values": [ { "name": "royal", "orderable": true, "value": "JJ5FUXX" } ] } ],
 *     { "color": "JJ5FUXX" }
 * )
 * // returns { "Colour": "royal" }
 */
export const getDisplayVariationValues = (variationAttributes, values = {}) => {
    const returnVal = Object.entries(values).reduce((acc, [id, value]) => {
        const attribute = variationAttributes.find(({id: attributeId}) => attributeId === id)
        const attributeValue = attribute.values.find(
            ({value: attributeValue}) => attributeValue === value
        )
        return {
            ...acc,
            [attribute.name]: attributeValue.name
        }
    }, {})
    return returnVal
}

/**
 * This function extract the price information of a given product
 * If a product is a master,
 *  currentPrice: get the lowest price (including promotional prices) among variants
 *  listPrice: get the list price of the variant that has lowest price (including promotional price)
 *  maxPrice: the max price in tieredPrices of variant that has lowest price
 * @param {object} product - product detail object
 * @param {object} opts - options to pass into the function like intl, quantity, and currency
 */
export const getPriceData = (product, opts = {}) => {
    const {quantity = 1} = opts
    const isASet = product?.hitType === 'set' || !!product?.type?.set
    const isMaster = product?.hitType === 'master' || !!product?.type?.master
    let currentPrice
    let variantWithLowestPrice
    // grab the variant that has the lowest price (including promotional price)
    if (isMaster) {
        const variants = product?.variants || []
        variantWithLowestPrice = variants.reduce(
            (minVariant, variant) => {
                const promotions = variant.productPromotions || []
                const smallestPromotionalPrice = getSmallestValByProperty(
                    promotions,
                    'promotionalPrice'
                )
                const variantSalePrice =
                    smallestPromotionalPrice && smallestPromotionalPrice < variant.price
                        ? smallestPromotionalPrice
                        : variant.price
                return variantSalePrice < minVariant.minPrice
                    ? {minPrice: variantSalePrice, variant}
                    : minVariant
            },
            {minPrice: Infinity, variant: null}
        )
        currentPrice = variantWithLowestPrice?.minPrice
    } else {
        const promotionalPrice = getSmallestValByProperty(
            product?.productPromotions,
            'promotionalPrice'
        )
        currentPrice =
            promotionalPrice && promotionalPrice < product?.price
                ? promotionalPrice
                : product?.price
    }

    // since the price is the lowest value among price books, each product will have at lease a single item tiered price at quantity 1
    // the highest value of tieredPrices is presumptively the list price
    const tieredPrices =
        variantWithLowestPrice?.variant?.tieredPrices || product?.tieredPrices || []
    const maxTieredPrice = tieredPrices?.length
        ? Math.max(...tieredPrices.map((item) => item.price))
        : undefined
    const highestTieredPrice = tieredPrices.find((tier) => tier.price === maxTieredPrice)
    const listPrice = highestTieredPrice?.price

    // if a product has tieredPrices, get the tiered that has the higher closest quantity to current quantity
    const filteredTiered = tieredPrices.filter((tiered) => tiered.quantity <= quantity)
    const closestTieredPrice =
        filteredTiered.length &&
        filteredTiered.reduce((prev, curr) => {
            return Math.abs(curr.quantity - quantity) < Math.abs(prev.quantity - quantity)
                ? curr
                : prev
        })
    return {
        currentPrice,
        listPrice,
        isOnSale: currentPrice < listPrice,
        isASet,
        isMaster,
        // For a product, set price is the lowest price of its children, so the price should be considered a range
        // For a master product, when it has more than 2 variants, we use the lowest priced variant, so it is  considered a range price
        //      but for master that has one variant, it is not considered range
        isRange: (isMaster && product?.variants?.length > 1) || isASet || false,
        // priceMax is for product set
        tieredPrice: closestTieredPrice?.price,
        maxPrice: product?.priceMax || maxTieredPrice
    }
}

/**
 * Filters the provided product `ImageGroups` array with the optional filters.
 *
 * @param {ImageGroup[]} imageGroups
 * @param {object} filters
 * @param {string} filters.viewType
 * @param {object} filters.variationValues
 *
 * @returns {ImageGroup[]} filteredImageGroups
 */
export const filterImageGroups = (imageGroups = [], filters) => {
    if (!filters) {
        throw new Error(`Missing required "filters" argument`)
    }

    const {viewType, variationValues = {}} = filters
    // NOTE: For future feature enhancement compatibility we use an object for the `variationValues` as
    // we might want to filter on more than the one attribute id/value pair.
    const [selectedAttributeId, selectedAttributeValue] = Object.entries(variationValues)[0] || []

    // Filters
    const typeFilter = viewType ? (group) => group.viewType === viewType : () => true
    const attributeFilter =
        !!selectedAttributeId && !!selectedAttributeValue
            ? ({variationAttributes = []}) =>
                  variationAttributes.some(
                      ({id, values}) =>
                          id === selectedAttributeId &&
                          !!values.find(({value}) => value === selectedAttributeValue)
                  )
            : () => true

    return imageGroups?.filter(typeFilter)?.filter(attributeFilter)
}

/**
 * Provided a product this function will return the variation attibutes decorated with
 * `href` and `swatch` image for the given attribute values. This allows easier access
 * when creating components that commonly use this information.
 *
 * @param {Product} product
 * @param {object} opts
 * @param {string} opts.swatchViewType - The `viewTypeId` for the swatch image. Defaults to `swatch`.
 *
 * @returns {VariationAttributes[]} decoratedVariationAttributes
 */
export const getDecoratedVariationAttributes = (product, opts = {}) => {
    const swatchViewType = opts.swatchViewType || 'swatch'

    return product?.variationAttributes?.map((variationAttribute) => ({
        ...variationAttribute,
        values: variationAttribute.values.map((value) => {
            const variationValues = {[variationAttribute.id]: value.value}

            return {
                ...value,
                swatch: filterImageGroups(product.imageGroups, {
                    viewType: swatchViewType,
                    variationValues
                })?.[0]?.images[0],
                href: rebuildPathWithParams(
                    productUrlBuilder({id: product.productId}),
                    variationValues
                )
            }
        })
    }))
}

/**
     
 * @private
 * Find the smallest value by key from a given array
 * @param arr
 * @param key
 */
const getSmallestValByProperty = (arr, key) => {
    if (!arr || !arr.length) return undefined
    if (!key) {
        throw new Error('Please specify a key.')
    }
    const vals = arr
        .map((item) => item[key])
        .filter(Boolean)
        .filter(Number)
    return vals.length ? Math.min(...vals) : undefined
}
