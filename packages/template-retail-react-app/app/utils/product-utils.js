/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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
        variantWithLowestPrice = findLowestPrice(product)
        currentPrice = variantWithLowestPrice?.minPrice
    } else {
        currentPrice = findLowestPrice(product)?.minPrice
    }

    // since the price is the lowest value among price books, each product will have at lease a single item tiered price at quantity 1
    // the highest value of tieredPrices is presumptively the list price
    const tieredPrices = variantWithLowestPrice?.data?.tieredPrices || product?.tieredPrices || []
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

export const findLowestPrice = (product) => {
    if (!product) return
    const array = product.variants ?? [product]

    return array.reduce(
        (prev, data) => {
            const promotions = data.productPromotions || []
            const smallestPromotionalPrice = getSmallestValByProperty(
                promotions,
                'promotionalPrice'
            )
            const salePrice =
                smallestPromotionalPrice && smallestPromotionalPrice < data.price
                    ? smallestPromotionalPrice
                    : data.price

            return salePrice < prev.minPrice ? {minPrice: salePrice, data} : prev
        },
        {minPrice: Infinity, data: null}
    )
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
