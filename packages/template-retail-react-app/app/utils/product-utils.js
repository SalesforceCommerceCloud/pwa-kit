/*
 * Copyright (c) 2023, Salesforce, Inc.
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
 * This function extract the list price and current price of a product
 * If a product has promotional price, it will prioritize that value for current price
 * List price will take the highest value among the price book prices
 * @param {object} product - product detail object
 * @param {object} opts - product detail object
 * @returns {{listPrice: number, currentPrice: number}}
 */
export const getDisplayPrice = (product, opts = {}) => {
    const {quantity = 1} = opts
    const promotionalPriceList = product?.productPromotions
        ?.map((promo) => promo.promotionalPrice)
        .filter((i) => i !== null && i !== undefined)
    const promotionalPrice = promotionalPriceList?.length ? Math.min(...promotionalPriceList) : null

    // if a product has tieredPrices, get the tiered that has the higher closest quantity to current quantity
    const filteredTiered =
        product?.tieredPrices?.filter((tiered) => tiered.quantity <= quantity) || []
    const closestTieredPrice =
        filteredTiered.length &&
        filteredTiered.reduce((prev, curr) => {
            return Math.abs(curr.quantity - quantity) < Math.abs(prev.quantity - quantity)
                ? curr
                : prev
        })
    const salePrices = [closestTieredPrice?.price, promotionalPrice, product?.price].filter(Boolean)
    // pick the smallest price among these price for the "current" price
    let currentPrice = salePrices?.length ? Math.min(...salePrices) : 0

    // Master product and product set have priceRanges object
    // the price returned from API is the smallest price among price book
    // to figure out what is the original price, we find the lastest minPrice among the books
    const maxPriceRange = product?.priceRanges
        ? Math.max(...(product?.priceRanges || []).map((item) => item.minPrice))
        : 0
    const highestPriceRange = product?.priceRanges?.find(
        (range) => range.minPrice === maxPriceRange
    )
    // for standard/variant/bundle product, they dont have priceRanges, only tieredPrices
    // since the price is the lowest value returned from the API, each product will have at lease a single item tiered price
    // the highest value of tieredPrices is presumptively the list price
    const maxTieredPrice = product?.tieredPrices
        ? Math.max(...(product?.tieredPrices || []).map((item) => item.price))
        : 0
    const highestTieredPrice = product?.tieredPrices?.find((tier) => tier.price === maxTieredPrice)
    return {
        listPrice: highestTieredPrice?.price || highestPriceRange?.minPrice,
        currentPrice
    }
}
